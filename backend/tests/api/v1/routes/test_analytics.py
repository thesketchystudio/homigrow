"""
tests/api/v1/routes/test_analytics.py

Integration tests for GET /api/v1/analytics/broker — auth/role gating,
range scoping (current vs previous period), and each KPI/breakdown's
aggregation logic.
"""

import datetime

from app.core.security import create_access_token
from app.models.broker_profile import BrokerProfile
from app.models.enums import LeadStatus, ListingType, PropertyType, UserRole
from app.models.lead import Lead
from app.models.property import Property
from app.models.property_view import PropertyView
from app.models.user import User
from tests.conftest import make_user

_NOW = datetime.datetime.now(datetime.timezone.utc)


def _auth_headers(user: User) -> dict:
    return {"Authorization": f"Bearer {create_access_token(user.id, user.role.value)}"}


def _make_broker(db_session, **kwargs) -> User:
    user = make_user(db_session, role=UserRole.broker, **kwargs)
    db_session.add(BrokerProfile(user_id=user.id))
    db_session.flush()
    return user


def _make_property(db_session, broker: User, **overrides) -> Property:
    defaults = dict(
        broker_id=broker.id,
        title="2 BHK Modern Flat",
        listing_type=ListingType.sale,
        property_type=PropertyType.apartment,
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


def _add_view(db_session, property_id, *, days_ago: int, viewer_id=None) -> None:
    db_session.add(PropertyView(property_id=property_id, viewer_id=viewer_id, viewed_at=_NOW - datetime.timedelta(days=days_ago)))


def _add_lead(db_session, property_id, broker_id, *, days_ago: int, **overrides) -> Lead:
    defaults = dict(property_id=property_id, broker_id=broker_id, created_at=_NOW - datetime.timedelta(days=days_ago))
    defaults.update(overrides)
    lead = Lead(**defaults)
    db_session.add(lead)
    db_session.flush()
    return lead


class TestGetBrokerAnalytics:
    def test_requires_authentication(self, client):
        response = client.get("/api/v1/analytics/broker")
        assert response.status_code == 401

    def test_client_role_is_forbidden(self, db_session, client):
        user = make_user(db_session, role=UserRole.client, phone="+919876591000")
        response = client.get("/api/v1/analytics/broker", headers=_auth_headers(user))
        assert response.status_code == 403

    def test_empty_state_for_a_broker_with_no_data(self, db_session, client):
        broker = _make_broker(db_session, phone="+919876591001")
        response = client.get("/api/v1/analytics/broker", headers=_auth_headers(broker))

        assert response.status_code == 200
        body = response.json()
        assert body["kpis"]["total_views"] == 0
        assert body["kpis"]["total_views_change_pct"] is None
        assert body["kpis"]["est_revenue"] == 0
        assert body["property_type_breakdown"] == []
        assert body["leads_by_city"] == []
        assert body["top_listings"] == []
        assert len(body["trend"]) == 30  # default range=30d

    def test_views_and_leads_are_scoped_to_the_selected_range(self, db_session, client):
        broker = _make_broker(db_session, phone="+919876591002")
        property_ = _make_property(db_session, broker)
        _add_view(db_session, property_.id, days_ago=5)
        _add_view(db_session, property_.id, days_ago=40)  # outside a 30d window
        _add_lead(db_session, property_.id, broker.id, days_ago=5)
        _add_lead(db_session, property_.id, broker.id, days_ago=40)
        db_session.flush()

        response = client.get("/api/v1/analytics/broker?range=30d", headers=_auth_headers(broker))

        assert response.status_code == 200
        kpis = response.json()["kpis"]
        assert kpis["total_views"] == 1
        assert kpis["total_leads"] == 1

    def test_pct_change_compares_against_the_equal_length_previous_period(self, db_session, client):
        broker = _make_broker(db_session, phone="+919876591003")
        property_ = _make_property(db_session, broker)
        # Current 7d window: 2 leads. Previous 7d window (days 8-14 ago): 1 lead.
        _add_lead(db_session, property_.id, broker.id, days_ago=1)
        _add_lead(db_session, property_.id, broker.id, days_ago=2)
        _add_lead(db_session, property_.id, broker.id, days_ago=10)
        db_session.flush()

        response = client.get("/api/v1/analytics/broker?range=7d", headers=_auth_headers(broker))

        kpis = response.json()["kpis"]
        assert kpis["total_leads"] == 2
        assert kpis["total_leads_change_pct"] == 100.0

    def test_pct_change_is_none_with_no_previous_period_baseline(self, db_session, client):
        broker = _make_broker(db_session, phone="+919876591004")
        property_ = _make_property(db_session, broker)
        _add_lead(db_session, property_.id, broker.id, days_ago=1)
        db_session.flush()

        response = client.get("/api/v1/analytics/broker?range=7d", headers=_auth_headers(broker))

        assert response.json()["kpis"]["total_leads_change_pct"] is None

    def test_enquiry_calls_counts_only_number_request_source(self, db_session, client):
        broker = _make_broker(db_session, phone="+919876591005")
        property_ = _make_property(db_session, broker)
        _add_lead(db_session, property_.id, broker.id, days_ago=1, source="number_request")
        _add_lead(db_session, property_.id, broker.id, days_ago=1, source="tour_request")
        db_session.flush()

        response = client.get("/api/v1/analytics/broker?range=30d", headers=_auth_headers(broker))

        assert response.json()["kpis"]["enquiry_calls"] == 1

    def test_est_revenue_sums_closed_won_leads_property_price(self, db_session, client):
        broker = _make_broker(db_session, phone="+919876591006")
        won_property = _make_property(db_session, broker, price=5000000, title="Won Deal")
        open_property = _make_property(db_session, broker, price=9000000, title="Still Open")
        _add_lead(db_session, won_property.id, broker.id, days_ago=1, status=LeadStatus.closed_won)
        _add_lead(db_session, open_property.id, broker.id, days_ago=1, status=LeadStatus.new)
        db_session.flush()

        response = client.get("/api/v1/analytics/broker?range=30d", headers=_auth_headers(broker))

        assert response.json()["kpis"]["est_revenue"] == 5000000.0

    def test_property_type_breakdown_percentages(self, db_session, client):
        broker = _make_broker(db_session, phone="+919876591007")
        apartment = _make_property(db_session, broker, property_type=PropertyType.apartment)
        villa = _make_property(db_session, broker, property_type=PropertyType.villa)
        _add_lead(db_session, apartment.id, broker.id, days_ago=1)
        _add_lead(db_session, apartment.id, broker.id, days_ago=1)
        _add_lead(db_session, apartment.id, broker.id, days_ago=1)
        _add_lead(db_session, villa.id, broker.id, days_ago=1)
        db_session.flush()

        response = client.get("/api/v1/analytics/broker?range=30d", headers=_auth_headers(broker))

        breakdown = {item["property_type"]: item for item in response.json()["property_type_breakdown"]}
        assert breakdown["apartment"]["count"] == 3
        assert breakdown["apartment"]["percent"] == 75.0
        assert breakdown["villa"]["count"] == 1
        assert breakdown["villa"]["percent"] == 25.0

    def test_leads_by_city_ranks_by_count_descending(self, db_session, client):
        broker = _make_broker(db_session, phone="+919876591008")
        bengaluru = _make_property(db_session, broker, city="Bengaluru")
        mumbai = _make_property(db_session, broker, city="Mumbai")
        _add_lead(db_session, bengaluru.id, broker.id, days_ago=1)
        _add_lead(db_session, bengaluru.id, broker.id, days_ago=1)
        _add_lead(db_session, mumbai.id, broker.id, days_ago=1)
        db_session.flush()

        response = client.get("/api/v1/analytics/broker?range=30d", headers=_auth_headers(broker))

        cities = response.json()["leads_by_city"]
        assert cities[0] == {"city": "Bengaluru", "count": 2}
        assert cities[1] == {"city": "Mumbai", "count": 1}

    def test_top_listings_ranks_by_conversion_rate(self, db_session, client):
        broker = _make_broker(db_session, phone="+919876591009")
        high_conversion = _make_property(db_session, broker, title="High Conversion")
        low_conversion = _make_property(db_session, broker, title="Low Conversion")
        # High: 2 leads / 4 views = 50%. Low: 1 lead / 10 views = 10%.
        # All anonymous (viewer_id=None) — each anonymous view logs its own
        # row, and a random non-existent viewer_id would violate the FK.
        for _ in range(4):
            _add_view(db_session, high_conversion.id, days_ago=1)
        for _ in range(10):
            _add_view(db_session, low_conversion.id, days_ago=1)
        _add_lead(db_session, high_conversion.id, broker.id, days_ago=1)
        _add_lead(db_session, high_conversion.id, broker.id, days_ago=1)
        _add_lead(db_session, low_conversion.id, broker.id, days_ago=1)
        db_session.flush()

        response = client.get("/api/v1/analytics/broker?range=30d", headers=_auth_headers(broker))

        listings = response.json()["top_listings"]
        assert listings[0]["title"] == "High Conversion"
        assert listings[0]["conversion_rate"] == 50.0
        assert listings[1]["title"] == "Low Conversion"
        assert listings[1]["conversion_rate"] == 10.0

    def test_does_not_include_another_brokers_data(self, db_session, client):
        broker = _make_broker(db_session, phone="+919876591010")
        other_broker = _make_broker(db_session, phone="+919876591011")
        other_property = _make_property(db_session, other_broker)
        _add_lead(db_session, other_property.id, other_broker.id, days_ago=1)
        _add_view(db_session, other_property.id, days_ago=1)
        db_session.flush()

        response = client.get("/api/v1/analytics/broker?range=30d", headers=_auth_headers(broker))

        kpis = response.json()["kpis"]
        assert kpis["total_views"] == 0
        assert kpis["total_leads"] == 0

    def test_six_month_range_buckets_trend_by_month(self, db_session, client):
        broker = _make_broker(db_session, phone="+919876591012")
        response = client.get("/api/v1/analytics/broker?range=6m", headers=_auth_headers(broker))

        assert response.status_code == 200
        assert len(response.json()["trend"]) == 6
