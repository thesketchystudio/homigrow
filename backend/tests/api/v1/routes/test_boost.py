"""
tests/api/v1/routes/test_boost.py

Integration tests for GET /api/v1/boost-plans (public) and
POST /api/v1/boost-orders (broker-only checkout, no payment yet).
"""

from app.core.security import create_access_token
from app.models.boost import BoostPlan
from app.models.enums import BoostTier, ListingType, PropertyStatus, PropertyType, UserRole
from app.models.property import Property
from app.models.user import User
from tests.conftest import make_user


def _auth_headers(user: User) -> dict:
    return {"Authorization": f"Bearer {create_access_token(user.id, user.role.value)}"}


def _make_broker(db_session, **kwargs) -> User:
    return make_user(db_session, role=UserRole.broker, **kwargs)


def _make_plan(db_session, *, price=249, tier=BoostTier.featured, is_active=True) -> BoostPlan:
    plan = BoostPlan(tier=tier, name="Featured", price=price, features=["Top 5 search placement"], reach_estimate={
        "views_min": 3000, "views_max": 5000, "leads_min": 28, "leads_max": 45, "calls_min": 14, "calls_max": 22,
    }, is_active=is_active)
    db_session.add(plan)
    db_session.flush()
    return plan


def _make_property(db_session, broker, **overrides) -> Property:
    defaults = dict(
        broker_id=broker.id,
        title="2 BHK Modern Flat",
        listing_type=ListingType.sale,
        property_type=PropertyType.apartment,
        status=PropertyStatus.active,
        price=5000000,
        is_negotiable=False,
        address_line="1 MG Road",
        locality="Koramangala",
        city="Bengaluru",
        state="Karnataka",
        pincode="560034",
    )
    defaults.update(overrides)
    property_ = Property(**defaults)
    db_session.add(property_)
    db_session.flush()
    return property_


class TestListBoostPlans:
    def test_returns_active_plans_only(self, client, db_session):
        _make_plan(db_session, tier=BoostTier.featured)
        _make_plan(db_session, tier=BoostTier.basic, is_active=False)

        response = client.get("/api/v1/boost-plans")

        assert response.status_code == 200
        body = response.json()
        assert len(body) == 1
        assert body[0]["tier"] == "featured"
        assert body[0]["reach_estimate"]["views_min"] == 3000

    def test_no_auth_required(self, client):
        response = client.get("/api/v1/boost-plans")
        assert response.status_code == 200


class TestCreateBoostOrder:
    def test_requires_authentication(self, client):
        response = client.post("/api/v1/boost-orders", json={})
        assert response.status_code == 401

    def test_requires_broker_role(self, client, db_session):
        client_user = make_user(db_session, role=UserRole.client)
        response = client.post(
            "/api/v1/boost-orders", json={"property_id": "00000000-0000-0000-0000-000000000000", "plan_id": "00000000-0000-0000-0000-000000000000", "duration_days": 7},
            headers=_auth_headers(client_user),
        )
        assert response.status_code == 403

    def test_creates_order_for_own_active_property(self, client, db_session):
        broker = _make_broker(db_session)
        property_ = _make_property(db_session, broker)
        plan = _make_plan(db_session)

        response = client.post(
            "/api/v1/boost-orders",
            json={"property_id": str(property_.id), "plan_id": str(plan.id), "duration_days": 15},
            headers=_auth_headers(broker),
        )

        assert response.status_code == 201
        body = response.json()
        assert body["status"] == "created"
        assert body["duration_days"] == 15
        assert body["total_amount"] == 3966.57

    def test_409_when_property_not_active(self, client, db_session):
        broker = _make_broker(db_session)
        property_ = _make_property(db_session, broker, status=PropertyStatus.draft)
        plan = _make_plan(db_session)

        response = client.post(
            "/api/v1/boost-orders",
            json={"property_id": str(property_.id), "plan_id": str(plan.id), "duration_days": 7},
            headers=_auth_headers(broker),
        )

        assert response.status_code == 409
        assert response.json()["error"]["code"] == "PROPERTY_NOT_ACTIVE"

    def test_403_when_property_not_owned(self, client, db_session):
        broker = _make_broker(db_session, phone="+919876500001")
        other_broker = _make_broker(db_session, phone="+919876500002")
        property_ = _make_property(db_session, other_broker)
        plan = _make_plan(db_session)

        response = client.post(
            "/api/v1/boost-orders",
            json={"property_id": str(property_.id), "plan_id": str(plan.id), "duration_days": 7},
            headers=_auth_headers(broker),
        )

        assert response.status_code == 403

    def test_422_on_invalid_duration(self, client, db_session):
        broker = _make_broker(db_session)
        property_ = _make_property(db_session, broker)
        plan = _make_plan(db_session)

        response = client.post(
            "/api/v1/boost-orders",
            json={"property_id": str(property_.id), "plan_id": str(plan.id), "duration_days": 10},
            headers=_auth_headers(broker),
        )

        assert response.status_code == 422
