"""
tests/api/v1/routes/test_admin.py

Integration tests for the /api/v1/admin endpoints: the RBAC matrix (every
admin route rejects anonymous, client and broker callers), the admin-only
sign-in, listing moderation (lifecycle, notification, audit row, races),
and user suspension/reinstatement (sessions, listings, audit trail).
"""

import uuid

import pytest

from app.core.security import create_access_token
from app.models.admin_audit_log import AdminAuditLog
from app.models.broker_profile import BrokerProfile
from app.models.enums import (
    AdminAction,
    ListingType,
    NotificationType,
    PropertyStatus,
    PropertyType,
    UserRole,
    VerificationStatus,
)
from app.models.notification import Notification
from app.models.property import Property
from app.models.refresh_token import RefreshToken
from app.models.user import User
from tests.conftest import make_user

PASSWORD = "correct-horse-battery-staple"


def _auth_headers(user: User) -> dict:
    return {"Authorization": f"Bearer {create_access_token(user.id, user.role.value)}"}


def _unique_email(prefix: str) -> str:
    return f"{prefix}-{uuid.uuid4().hex[:10]}@admin-tests.local"


def _make_admin(db_session, phone: str = "+919000011101") -> User:
    return make_user(db_session, phone=phone, role=UserRole.admin, email=_unique_email("admin"), full_name="Ada Admin")


def _make_broker(db_session, phone: str = "+919000011102", **kwargs) -> User:
    kwargs.setdefault("email", _unique_email("broker"))
    kwargs.setdefault("full_name", "Bina Broker")
    verification = kwargs.pop("verification_status", VerificationStatus.verified)
    user = make_user(db_session, phone=phone, role=UserRole.broker, **kwargs)
    db_session.add(BrokerProfile(user_id=user.id, verification_status=verification))
    db_session.flush()
    return user


def _make_client(db_session, phone: str = "+919000011103", **kwargs) -> User:
    kwargs.setdefault("email", _unique_email("client"))
    return make_user(db_session, phone=phone, role=UserRole.client, **kwargs)


def _make_property(db_session, broker: User, **overrides) -> Property:
    defaults = dict(
        broker_id=broker.id,
        title=f"Admin Test Villa {uuid.uuid4().hex[:6]}",
        listing_type=ListingType.sale,
        property_type=PropertyType.villa,
        price=12500000,
        is_negotiable=False,
        address_line="1 Test Road",
        locality="Indiranagar",
        city="Bengaluru",
        state="Karnataka",
        pincode="560038",
        status=PropertyStatus.pending,
    )
    defaults.update(overrides)
    property_ = Property(**defaults)
    db_session.add(property_)
    db_session.flush()
    return property_


# Every admin route except the sign-in, as (method, path-template, json body).
_ADMIN_ROUTES = [
    ("get", "/api/v1/admin/summary", None),
    ("get", "/api/v1/admin/properties", None),
    ("get", "/api/v1/admin/properties/moderation-stats", None),
    ("post", "/api/v1/admin/properties/{id}/moderate", {"action": "approve"}),
    ("get", "/api/v1/admin/users", None),
    ("get", "/api/v1/admin/users/{id}", None),
    ("post", "/api/v1/admin/users/{id}/suspend", {"reason": "spam"}),
    ("post", "/api/v1/admin/users/{id}/reinstate", None),
]


class TestAdminRbac:
    @pytest.mark.parametrize("method,path,body", _ADMIN_ROUTES)
    def test_anonymous_is_401(self, client, method, path, body):
        response = getattr(client, method)(path.format(id=uuid.uuid4()), **({"json": body} if body else {}))
        assert response.status_code == 401

    @pytest.mark.parametrize("role", [UserRole.client, UserRole.broker])
    @pytest.mark.parametrize("method,path,body", _ADMIN_ROUTES)
    def test_non_admin_roles_are_403(self, client, db_session, role, method, path, body):
        user = make_user(db_session, phone="+919000011199", role=role, email=_unique_email("rbac"))
        response = getattr(client, method)(
            path.format(id=uuid.uuid4()), headers=_auth_headers(user), **({"json": body} if body else {})
        )
        assert response.status_code == 403
        assert response.json()["error"]["code"] == "FORBIDDEN"


class TestAdminLogin:
    def test_admin_can_sign_in(self, client, db_session):
        admin = _make_admin(db_session)
        response = client.post("/api/v1/auth/admin/login", json={"phone_or_email": admin.email, "password": PASSWORD})
        assert response.status_code == 200
        body = response.json()
        assert body["user"]["role"] == "admin"
        assert body["access_token"]
        assert "refresh_token" in response.cookies

    @pytest.mark.parametrize("role", [UserRole.client, UserRole.broker])
    def test_non_admin_with_correct_password_gets_bad_credentials(self, client, db_session, role):
        user = make_user(db_session, phone="+919000011198", role=role, email=_unique_email("notadmin"))
        response = client.post("/api/v1/auth/admin/login", json={"phone_or_email": user.email, "password": PASSWORD})
        assert response.status_code == 401
        assert response.json()["error"]["code"] == "BAD_CREDENTIALS"
        assert "refresh_token" not in response.cookies
        assert db_session.query(RefreshToken).filter(RefreshToken.user_id == user.id).count() == 0

    def test_wrong_password_is_bad_credentials(self, client, db_session):
        admin = _make_admin(db_session)
        response = client.post("/api/v1/auth/admin/login", json={"phone_or_email": admin.email, "password": "nope-nope-nope"})
        assert response.status_code == 401
        assert response.json()["error"]["code"] == "BAD_CREDENTIALS"

    def test_regular_login_still_works_for_non_admins(self, client, db_session):
        broker = _make_broker(db_session)
        response = client.post("/api/v1/auth/login", json={"phone_or_email": broker.email, "password": PASSWORD})
        assert response.status_code == 200
        assert response.json()["user"]["role"] == "broker"


class TestAdminSummary:
    def test_returns_dashboard_shape(self, client, db_session):
        admin = _make_admin(db_session)
        broker = _make_broker(db_session)
        _make_property(db_session, broker, status=PropertyStatus.pending)
        response = client.get("/api/v1/admin/summary", headers=_auth_headers(admin))
        assert response.status_code == 200
        body = response.json()
        assert float(body["pending_reviews"]["value"]) >= 1
        assert len(body["monthly_traffic"]) == 12
        assert {"total_listings", "active_listings", "total_revenue", "listings_by_type", "recent_listings", "recent_activity"} <= body.keys()


class TestAdminListProperties:
    def test_lists_every_status_for_one_broker_with_counts(self, client, db_session):
        admin = _make_admin(db_session)
        broker = _make_broker(db_session)
        _make_property(db_session, broker, status=PropertyStatus.pending)
        _make_property(db_session, broker, status=PropertyStatus.draft)
        _make_property(db_session, broker, status=PropertyStatus.active)

        response = client.get(f"/api/v1/admin/properties?broker_id={broker.id}", headers=_auth_headers(admin))
        assert response.status_code == 200
        body = response.json()
        assert body["total"] == 3
        assert body["counts"]["pending"] == 1
        assert body["counts"]["draft"] == 1
        assert body["counts"]["active"] == 1
        assert body["counts"]["all"] == 3
        assert body["items"][0]["broker"]["id"] == str(broker.id)

    def test_status_filter_and_search(self, client, db_session):
        admin = _make_admin(db_session)
        broker = _make_broker(db_session)
        target = _make_property(db_session, broker, title="Zebra Crossing Residency", status=PropertyStatus.pending)
        _make_property(db_session, broker, title="Zebra Crossing Annex", status=PropertyStatus.active)

        response = client.get(
            f"/api/v1/admin/properties?broker_id={broker.id}&status=pending&q=zebra",
            headers=_auth_headers(admin),
        )
        ids = [item["id"] for item in response.json()["items"]]
        assert ids == [str(target.id)]

    def test_search_wildcards_match_literally(self, client, db_session):
        admin = _make_admin(db_session)
        broker = _make_broker(db_session)
        _make_property(db_session, broker, title="Plain Name")
        response = client.get(f"/api/v1/admin/properties?broker_id={broker.id}&q=%25", headers=_auth_headers(admin))
        assert response.json()["total"] == 0

    def test_page_size_is_capped(self, client, db_session):
        admin = _make_admin(db_session)
        response = client.get("/api/v1/admin/properties?page_size=1000", headers=_auth_headers(admin))
        assert response.status_code == 422


class TestModerateProperty:
    def test_approve_moves_pending_to_active_and_audits(self, client, db_session):
        admin = _make_admin(db_session)
        broker = _make_broker(db_session)
        listing = _make_property(db_session, broker, status=PropertyStatus.pending)

        response = client.post(
            f"/api/v1/admin/properties/{listing.id}/moderate",
            json={"action": "approve"},
            headers=_auth_headers(admin),
        )
        assert response.status_code == 200
        db_session.refresh(listing)
        assert listing.status == PropertyStatus.active
        assert listing.published_at is not None

        audit = db_session.query(AdminAuditLog).filter(AdminAuditLog.target_id == listing.id).one()
        assert audit.action == AdminAction.property_approved.value
        assert audit.admin_id == admin.id
        notification = db_session.query(Notification).filter(Notification.user_id == broker.id).one()
        assert notification.type == NotificationType.listing_status

    def test_reject_requires_note(self, client, db_session):
        admin = _make_admin(db_session)
        broker = _make_broker(db_session)
        listing = _make_property(db_session, broker)
        response = client.post(
            f"/api/v1/admin/properties/{listing.id}/moderate",
            json={"action": "reject", "note": "   "},
            headers=_auth_headers(admin),
        )
        assert response.status_code == 422
        db_session.refresh(listing)
        assert listing.status == PropertyStatus.pending

    def test_reject_stores_note_for_broker(self, client, db_session):
        admin = _make_admin(db_session)
        broker = _make_broker(db_session)
        listing = _make_property(db_session, broker)
        response = client.post(
            f"/api/v1/admin/properties/{listing.id}/moderate",
            json={"action": "reject", "note": "Photos are blurry."},
            headers=_auth_headers(admin),
        )
        assert response.status_code == 200
        db_session.refresh(listing)
        assert listing.status == PropertyStatus.rejected
        assert listing.moderation_note == "Photos are blurry."
        notification = db_session.query(Notification).filter(Notification.user_id == broker.id).one()
        assert "Photos are blurry." in notification.body

    @pytest.mark.parametrize("status", [PropertyStatus.draft, PropertyStatus.active, PropertyStatus.rejected])
    def test_non_pending_is_409_and_unaudited(self, client, db_session, status):
        admin = _make_admin(db_session)
        broker = _make_broker(db_session)
        listing = _make_property(db_session, broker, status=status)
        response = client.post(
            f"/api/v1/admin/properties/{listing.id}/moderate",
            json={"action": "approve"},
            headers=_auth_headers(admin),
        )
        assert response.status_code == 409
        assert db_session.query(AdminAuditLog).filter(AdminAuditLog.target_id == listing.id).count() == 0

    def test_unknown_property_is_404(self, client, db_session):
        admin = _make_admin(db_session)
        response = client.post(
            f"/api/v1/admin/properties/{uuid.uuid4()}/moderate",
            json={"action": "approve"},
            headers=_auth_headers(admin),
        )
        assert response.status_code == 404

    def test_moderation_stats_count_todays_decisions(self, client, db_session):
        admin = _make_admin(db_session)
        broker = _make_broker(db_session)
        before = client.get("/api/v1/admin/properties/moderation-stats", headers=_auth_headers(admin)).json()
        listing = _make_property(db_session, broker)
        client.post(
            f"/api/v1/admin/properties/{listing.id}/moderate",
            json={"action": "reject", "note": "Incomplete."},
            headers=_auth_headers(admin),
        )
        after = client.get("/api/v1/admin/properties/moderation-stats", headers=_auth_headers(admin)).json()
        assert after["rejected_today"] == before["rejected_today"] + 1
        assert after["awaiting_review"] == before["awaiting_review"]


class TestAdminUsers:
    def test_list_excludes_admins_and_filters_by_role(self, client, db_session):
        admin = _make_admin(db_session)
        marker = uuid.uuid4().hex[:8]
        broker = _make_broker(db_session, full_name=f"Broker {marker}")
        client_user = _make_client(db_session, full_name=f"Client {marker}")

        response = client.get(f"/api/v1/admin/users?q={marker}", headers=_auth_headers(admin))
        ids = {item["id"] for item in response.json()["items"]}
        assert ids == {str(broker.id), str(client_user.id)}

        brokers_only = client.get(f"/api/v1/admin/users?q={marker}&role=broker", headers=_auth_headers(admin)).json()
        assert [item["id"] for item in brokers_only["items"]] == [str(broker.id)]

        admin_search = client.get(f"/api/v1/admin/users?q={admin.email}", headers=_auth_headers(admin)).json()
        assert admin_search["total"] == 0

    def test_admin_role_filter_is_rejected(self, client, db_session):
        admin = _make_admin(db_session)
        response = client.get("/api/v1/admin/users?role=admin", headers=_auth_headers(admin))
        assert response.status_code == 422

    def test_detail_hides_admin_accounts(self, client, db_session):
        admin = _make_admin(db_session)
        other_admin = _make_admin(db_session, phone="+919000011120")
        response = client.get(f"/api/v1/admin/users/{other_admin.id}", headers=_auth_headers(admin))
        assert response.status_code == 404

    def test_detail_reports_counts(self, client, db_session):
        admin = _make_admin(db_session)
        broker = _make_broker(db_session)
        _make_property(db_session, broker, status=PropertyStatus.active)
        _make_property(db_session, broker, status=PropertyStatus.draft)
        body = client.get(f"/api/v1/admin/users/{broker.id}", headers=_auth_headers(admin)).json()
        assert body["listings_count"] == 2
        assert body["active_listings_count"] == 1
        assert body["status"] == "active"


class TestSuspendAndReinstate:
    def _login(self, client, user: User):
        return client.post("/api/v1/auth/login", json={"phone_or_email": user.email, "password": PASSWORD})

    def test_suspend_revokes_sessions_expires_listings_and_blocks_access(self, client, db_session):
        admin = _make_admin(db_session)
        broker = _make_broker(db_session)
        live = _make_property(db_session, broker, status=PropertyStatus.active)
        draft = _make_property(db_session, broker, status=PropertyStatus.draft)
        assert self._login(client, broker).status_code == 200

        response = client.post(
            f"/api/v1/admin/users/{broker.id}/suspend",
            json={"reason": "Fake listings"},
            headers=_auth_headers(admin),
        )
        assert response.status_code == 200
        assert response.json()["status"] == "suspended"

        db_session.refresh(live)
        db_session.refresh(draft)
        assert live.status == PropertyStatus.expired
        assert draft.status == PropertyStatus.draft
        active_sessions = (
            db_session.query(RefreshToken)
            .filter(RefreshToken.user_id == broker.id, RefreshToken.revoked_at.is_(None))
            .count()
        )
        assert active_sessions == 0
        assert client.post("/api/v1/auth/refresh").status_code == 401
        assert client.get("/api/v1/users/me", headers=_auth_headers(broker)).status_code == 401
        assert self._login(client, broker).status_code == 403

        audit = db_session.query(AdminAuditLog).filter(AdminAuditLog.target_id == broker.id).one()
        assert audit.action == AdminAction.user_suspended.value
        assert audit.meta["expired_property_ids"] == [str(live.id)]

    def test_reinstate_restores_only_listings_the_suspension_took_down(self, client, db_session):
        admin = _make_admin(db_session)
        broker = _make_broker(db_session)
        live = _make_property(db_session, broker, status=PropertyStatus.active)
        already_expired = _make_property(db_session, broker, status=PropertyStatus.expired)

        client.post(f"/api/v1/admin/users/{broker.id}/suspend", json={"reason": "Review"}, headers=_auth_headers(admin))
        response = client.post(f"/api/v1/admin/users/{broker.id}/reinstate", headers=_auth_headers(admin))
        assert response.status_code == 200
        assert response.json()["status"] == "active"

        db_session.refresh(live)
        db_session.refresh(already_expired)
        assert live.status == PropertyStatus.active
        assert already_expired.status == PropertyStatus.expired
        assert self._login(client, broker).status_code == 200

    def test_double_suspend_and_reinstate_unsuspended_are_409(self, client, db_session):
        admin = _make_admin(db_session)
        user = _make_client(db_session)
        assert client.post(f"/api/v1/admin/users/{user.id}/reinstate", headers=_auth_headers(admin)).status_code == 409
        client.post(f"/api/v1/admin/users/{user.id}/suspend", json={"reason": "x"}, headers=_auth_headers(admin))
        second = client.post(f"/api/v1/admin/users/{user.id}/suspend", json={"reason": "x"}, headers=_auth_headers(admin))
        assert second.status_code == 409

    def test_self_deactivated_account_cannot_be_suspended(self, client, db_session):
        admin = _make_admin(db_session)
        user = _make_client(db_session, is_active=False)
        response = client.post(f"/api/v1/admin/users/{user.id}/suspend", json={"reason": "x"}, headers=_auth_headers(admin))
        assert response.status_code == 409
        assert response.json()["error"]["code"] == "ACCOUNT_DEACTIVATED"

    def test_admin_accounts_cannot_be_suspended(self, client, db_session):
        admin = _make_admin(db_session)
        other_admin = _make_admin(db_session, phone="+919000011121")
        response = client.post(
            f"/api/v1/admin/users/{other_admin.id}/suspend", json={"reason": "x"}, headers=_auth_headers(admin)
        )
        assert response.status_code == 404
        db_session.refresh(other_admin)
        assert other_admin.is_active is True

    def test_suspend_requires_reason(self, client, db_session):
        admin = _make_admin(db_session)
        user = _make_client(db_session)
        response = client.post(f"/api/v1/admin/users/{user.id}/suspend", json={"reason": "  "}, headers=_auth_headers(admin))
        assert response.status_code == 422
