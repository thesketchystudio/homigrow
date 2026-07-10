"""
tests/services/test_user_service.py

Covers profile update, password change, session listing/revocation,
and account deactivation — the P2-T20/T26/T27 self-service functions.
"""

from datetime import datetime, timedelta, timezone
from uuid import uuid4

import pytest

from app.core.exceptions import AppError
from app.core.security import create_refresh_token, hash_refresh_token, verify_password
from app.models.enums import ListingType, PropertyStatus, PropertyType, UserRole
from app.models.property import Property
from app.models.refresh_token import RefreshToken
from app.services import user_service
from tests.conftest import make_user


def _make_session(db_session, user, *, revoked=False, expired=False, **kwargs) -> RefreshToken:
    now = datetime.now(timezone.utc)
    row = RefreshToken(
        user_id=user.id,
        token_hash=hash_refresh_token(create_refresh_token()),
        expires_at=now - timedelta(days=1) if expired else now + timedelta(days=30),
        revoked_at=now if revoked else None,
        **kwargs,
    )
    db_session.add(row)
    db_session.flush()
    return row


def _make_property(db_session, broker, *, status: PropertyStatus = PropertyStatus.active) -> Property:
    prop = Property(
        broker_id=broker.id,
        title="2BHK in Koramangala",
        listing_type=ListingType.rent,
        property_type=PropertyType.apartment,
        status=status,
        price=25000,
        address_line="123 Main Rd",
        locality="Koramangala",
        city="Bengaluru",
        state="Karnataka",
        pincode="560034",
    )
    db_session.add(prop)
    db_session.flush()
    return prop


class TestUpdateMe:
    def test_updates_only_supplied_fields(self, db_session):
        user = make_user(db_session, phone="+919876560001", full_name="Original Name")

        updated = user_service.update_me(
            db_session, user, full_name="New Name", email=None, avatar_url=None, preferences=None
        )

        assert updated.full_name == "New Name"

    def test_changing_email_resets_verification_and_logs(self, db_session, caplog):
        user = make_user(db_session, phone="+919876560002", email="old@example.com")
        user.is_email_verified = True
        db_session.flush()

        with caplog.at_level("INFO"):
            updated = user_service.update_me(
                db_session, user, full_name=None, email="new@example.com", avatar_url=None, preferences=None
            )

        assert updated.email == "new@example.com"
        assert updated.is_email_verified is False
        assert any("Email verification needed" in r.message for r in caplog.records)

    def test_duplicate_email_raises_409(self, db_session):
        make_user(db_session, phone="+919876560003", email="taken@example.com")
        user = make_user(db_session, phone="+919876560004", email="mine@example.com")

        with pytest.raises(AppError) as exc_info:
            user_service.update_me(
                db_session, user, full_name=None, email="taken@example.com", avatar_url=None, preferences=None
            )

        assert exc_info.value.status_code == 409
        assert exc_info.value.code == "EMAIL_TAKEN"

    def test_preferences_dict_is_stored(self, db_session):
        user = make_user(db_session, phone="+919876560005")

        updated = user_service.update_me(
            db_session, user, full_name=None, email=None, avatar_url=None, preferences={"theme": "dark"}
        )

        assert updated.preferences == {"theme": "dark"}


class TestChangePassword:
    def test_correct_current_password_changes_it(self, db_session):
        user = make_user(db_session, phone="+919876560010", password="old-password-123")

        user_service.change_password(db_session, user, "old-password-123", "new-password-456")

        db_session.refresh(user)
        assert verify_password("new-password-456", user.password_hash)

    def test_wrong_current_password_raises_401(self, db_session):
        user = make_user(db_session, phone="+919876560011", password="old-password-123")

        with pytest.raises(AppError) as exc_info:
            user_service.change_password(db_session, user, "wrong-password", "new-password-456")

        assert exc_info.value.status_code == 401
        assert exc_info.value.code == "BAD_CURRENT_PASSWORD"

    def test_otp_only_account_rejects_any_current_password(self, db_session):
        user = make_user(db_session, phone="+919876560012", password=None)

        with pytest.raises(AppError) as exc_info:
            user_service.change_password(db_session, user, "anything", "new-password-456")

        assert exc_info.value.status_code == 401
        assert exc_info.value.code == "BAD_CURRENT_PASSWORD"


class TestListSessions:
    def test_returns_only_active_unexpired_sessions_newest_first(self, db_session):
        user = make_user(db_session, phone="+919876560020")
        _make_session(db_session, user, revoked=True)
        _make_session(db_session, user, expired=True)
        active = _make_session(db_session, user)

        sessions = user_service.list_sessions(db_session, user)

        assert [s.id for s in sessions] == [active.id]

    def test_does_not_include_another_users_sessions(self, db_session):
        user = make_user(db_session, phone="+919876560021")
        other = make_user(db_session, phone="+919876560022")
        _make_session(db_session, other)

        assert user_service.list_sessions(db_session, user) == []


class TestRevokeSession:
    def test_revokes_owned_session(self, db_session):
        user = make_user(db_session, phone="+919876560030")
        session = _make_session(db_session, user)

        user_service.revoke_session(db_session, user, session.id)

        db_session.refresh(session)
        assert session.revoked_at is not None

    def test_unknown_session_raises_404(self, db_session):
        user = make_user(db_session, phone="+919876560031")

        with pytest.raises(AppError) as exc_info:
            user_service.revoke_session(db_session, user, uuid4())

        assert exc_info.value.status_code == 404

    def test_another_users_session_raises_404(self, db_session):
        user = make_user(db_session, phone="+919876560032")
        other = make_user(db_session, phone="+919876560033")
        other_session = _make_session(db_session, other)

        with pytest.raises(AppError) as exc_info:
            user_service.revoke_session(db_session, user, other_session.id)

        assert exc_info.value.status_code == 404

    def test_is_idempotent_for_an_already_revoked_session(self, db_session):
        user = make_user(db_session, phone="+919876560034")
        session = _make_session(db_session, user, revoked=True)

        user_service.revoke_session(db_session, user, session.id)  # must not raise


class TestRevokeAllSessions:
    def test_revokes_every_active_session(self, db_session):
        user = make_user(db_session, phone="+919876560040")
        first = _make_session(db_session, user)
        second = _make_session(db_session, user)

        user_service.revoke_all_sessions(db_session, user)

        db_session.refresh(first)
        db_session.refresh(second)
        assert first.revoked_at is not None
        assert second.revoked_at is not None


class TestDeactivateAccount:
    def test_deactivates_client_account_and_revokes_sessions(self, db_session):
        user = make_user(db_session, phone="+919876560050", role=UserRole.client)
        session = _make_session(db_session, user)

        user_service.deactivate_account(db_session, user)

        db_session.refresh(user)
        db_session.refresh(session)
        assert user.is_active is False
        assert session.revoked_at is not None

    def test_broker_with_active_listing_raises_409(self, db_session):
        broker = make_user(db_session, phone="+919876560051", role=UserRole.broker)
        _make_property(db_session, broker, status=PropertyStatus.active)

        with pytest.raises(AppError) as exc_info:
            user_service.deactivate_account(db_session, broker)

        assert exc_info.value.status_code == 409
        assert exc_info.value.code == "ACTIVE_LISTINGS_EXIST"

    def test_broker_with_only_sold_listings_can_deactivate(self, db_session):
        broker = make_user(db_session, phone="+919876560052", role=UserRole.broker)
        _make_property(db_session, broker, status=PropertyStatus.sold)

        user_service.deactivate_account(db_session, broker)

        db_session.refresh(broker)
        assert broker.is_active is False
