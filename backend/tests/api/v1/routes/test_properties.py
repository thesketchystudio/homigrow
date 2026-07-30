"""
tests/api/v1/routes/test_properties.py

Integration tests for GET /api/v1/properties/{id} (detail — visibility
rules, response shape) and GET /api/v1/properties (search grid —
filters, sort, pagination), through the TestClient.
"""

import uuid

from app.models.broker_profile import BrokerProfile
from app.models.enums import (
    ListingType,
    MediaType,
    PropertyStatus,
    PropertyType,
    UserRole,
    VerificationStatus,
)
from app.models.property import Property, PropertyMedia
from app.models.user import User
from tests.conftest import make_user


def _make_property(
    db_session, *, status: PropertyStatus = PropertyStatus.active, broker: User | None = None, **overrides
) -> Property:
    if broker is None:
        broker = make_user(
            db_session,
            phone=f"+9198765{uuid.uuid4().int % 100000:05d}",
            role=UserRole.broker,
            full_name="Vikram Sethi",
        )
        db_session.add(BrokerProfile(user_id=broker.id, verification_status=VerificationStatus.verified))
        db_session.flush()

    defaults = dict(
        broker_id=broker.id,
        title="The Obsidian Estate",
        description="A monolithic statement in stone and glass.",
        listing_type=ListingType.rent,
        property_type=PropertyType.villa,
        status=status,
        price=245000,
        is_negotiable=False,
        bhk=4,
        bathrooms=5,
        area_sqft=4500,
        built_year=2022,
        parking_slots=3,
        amenities=["Private Infinity Pool", "4K Home Cinema"],
        address_line="100 Ft Road, Indiranagar",
        locality="Indiranagar",
        city="Bengaluru",
        state="Karnataka",
        pincode="560038",
        metro_distance_m=3000,
    )
    defaults.update(overrides)
    property_ = Property(**defaults)
    db_session.add(property_)
    db_session.flush()

    db_session.add(
        PropertyMedia(
            property_id=property_.id,
            media_type=MediaType.image,
            url="https://example.com/cover.jpg",
            position=0,
            is_cover=True,
        )
    )
    db_session.add(
        PropertyMedia(
            property_id=property_.id,
            media_type=MediaType.image,
            url="https://example.com/second.jpg",
            position=1,
            is_cover=False,
        )
    )
    db_session.flush()
    return property_


class TestGetProperty:
    def test_returns_full_detail_for_an_active_property(self, client, db_session):
        property_ = _make_property(db_session)

        response = client.get(f"/api/v1/properties/{property_.id}")

        assert response.status_code == 200
        body = response.json()
        assert body["title"] == "The Obsidian Estate"
        assert body["parking_slots"] == 3
        assert body["built_year"] == 2022
        assert body["metro_distance_km"] == 3.0
        assert [m["url"] for m in body["media"]] == [
            "https://example.com/cover.jpg",
            "https://example.com/second.jpg",
        ]
        assert body["broker"]["full_name"] == "Vikram Sethi"
        assert body["broker"]["broker_profile"]["verification_status"] == "verified"

    def test_missing_id_returns_404(self, client):
        response = client.get(f"/api/v1/properties/{uuid.uuid4()}")

        assert response.status_code == 404
        assert response.json()["error"]["code"] == "PROPERTY_NOT_FOUND"

    def test_non_active_property_returns_404(self, client, db_session):
        property_ = _make_property(db_session, status=PropertyStatus.pending)

        response = client.get(f"/api/v1/properties/{property_.id}")

        assert response.status_code == 404
        assert response.json()["error"]["code"] == "PROPERTY_NOT_FOUND"


def _unique_city() -> str:
    """
    A per-test throwaway city name. Tests run against the real dev DB
    (tests/conftest.py's db_session wraps in a rolled-back transaction,
    but pre-existing committed rows — e.g. the demo "Obsidian Estate"
    deliberately left seeded, docs P3-T04 — are still visible). Scoping
    every list query to a city no real data uses keeps assertions exact
    without depending on what else happens to be in the DB.
    """
    return f"Testville-{uuid.uuid4().hex[:8]}"


class TestListProperties:
    def test_returns_only_active_properties_with_cover_image(self, client, db_session):
        city = _unique_city()
        active = _make_property(db_session, title="Active One", city=city)
        _make_property(db_session, title="Still Pending", status=PropertyStatus.pending, city=city)

        response = client.get("/api/v1/properties", params={"city": city})

        assert response.status_code == 200
        body = response.json()
        assert body["total"] == 1
        assert [item["title"] for item in body["items"]] == ["Active One"]
        assert body["items"][0]["cover_image_url"] == "https://example.com/cover.jpg"
        assert body["items"][0]["id"] == str(active.id)

    def test_pagination_envelope(self, client, db_session):
        city = _unique_city()
        for i in range(3):
            _make_property(db_session, title=f"Property {i}", city=city)

        response = client.get("/api/v1/properties", params={"city": city, "page": 1, "page_size": 2})

        assert response.status_code == 200
        body = response.json()
        assert body["total"] == 3
        assert body["page"] == 1
        assert body["page_size"] == 2
        assert body["total_pages"] == 2
        assert len(body["items"]) == 2

    def test_city_filter_is_case_insensitive(self, client, db_session):
        city_a, city_b = _unique_city(), _unique_city()
        _make_property(db_session, title="City A Home", city=city_a)
        _make_property(db_session, title="City B Home", city=city_b)

        response = client.get("/api/v1/properties", params={"city": city_a.upper()})

        assert response.status_code == 200
        body = response.json()
        assert [item["title"] for item in body["items"]] == ["City A Home"]

    def test_listing_type_filter(self, client, db_session):
        city = _unique_city()
        _make_property(db_session, title="For Sale", listing_type=ListingType.sale, city=city)
        _make_property(db_session, title="For Rent", listing_type=ListingType.rent, city=city)

        response = client.get("/api/v1/properties", params={"city": city, "listing_type": "sale"})

        assert response.status_code == 200
        assert [item["title"] for item in response.json()["items"]] == ["For Sale"]

    def test_property_type_filter_accepts_multiple_values(self, client, db_session):
        city = _unique_city()
        _make_property(db_session, title="A Villa", property_type=PropertyType.villa, city=city)
        _make_property(db_session, title="An Apartment", property_type=PropertyType.apartment, city=city)
        _make_property(db_session, title="A Plot", property_type=PropertyType.plot, city=city)

        response = client.get(
            "/api/v1/properties",
            params=[("city", city), ("property_type", "villa"), ("property_type", "apartment")],
        )

        assert response.status_code == 200
        titles = {item["title"] for item in response.json()["items"]}
        assert titles == {"A Villa", "An Apartment"}

    def test_price_range_filter(self, client, db_session):
        city = _unique_city()
        _make_property(db_session, title="Cheap", price=1000000, city=city)
        _make_property(db_session, title="Mid", price=5000000, city=city)
        _make_property(db_session, title="Expensive", price=20000000, city=city)

        response = client.get(
            "/api/v1/properties", params={"city": city, "price_min": 2000000, "price_max": 10000000}
        )

        assert response.status_code == 200
        assert [item["title"] for item in response.json()["items"]] == ["Mid"]

    def test_bhk_min_filter(self, client, db_session):
        city = _unique_city()
        _make_property(db_session, title="Two BHK", bhk=2, city=city)
        _make_property(db_session, title="Four BHK", bhk=4, city=city)

        response = client.get("/api/v1/properties", params={"city": city, "bhk_min": 3})

        assert response.status_code == 200
        assert [item["title"] for item in response.json()["items"]] == ["Four BHK"]

    def test_amenities_filter_matches_any(self, client, db_session):
        city = _unique_city()
        _make_property(db_session, title="Pool House", amenities=["Swimming pool"], city=city)
        _make_property(db_session, title="Gym House", amenities=["Gym"], city=city)
        _make_property(db_session, title="No Amenities", amenities=[], city=city)

        response = client.get(
            "/api/v1/properties",
            params=[("city", city), ("amenities", "Swimming pool"), ("amenities", "Gym")],
        )

        assert response.status_code == 200
        titles = {item["title"] for item in response.json()["items"]}
        assert titles == {"Pool House", "Gym House"}

    def test_sort_price_asc_and_desc(self, client, db_session):
        city = _unique_city()
        _make_property(db_session, title="Low", price=1000000, city=city)
        _make_property(db_session, title="High", price=9000000, city=city)

        asc = client.get("/api/v1/properties", params={"city": city, "sort": "price_asc"})
        desc = client.get("/api/v1/properties", params={"city": city, "sort": "price_desc"})

        assert [item["title"] for item in asc.json()["items"]] == ["Low", "High"]
        assert [item["title"] for item in desc.json()["items"]] == ["High", "Low"]

    def test_sort_newest_orders_by_published_at_desc(self, client, db_session):
        import datetime

        city = _unique_city()
        _make_property(
            db_session,
            title="Older",
            city=city,
            published_at=datetime.datetime(2020, 1, 1, tzinfo=datetime.timezone.utc),
        )
        _make_property(
            db_session,
            title="Newer",
            city=city,
            published_at=datetime.datetime(2024, 1, 1, tzinfo=datetime.timezone.utc),
        )

        response = client.get("/api/v1/properties", params={"city": city, "sort": "newest"})

        assert [item["title"] for item in response.json()["items"]] == ["Newer", "Older"]

    def test_invalid_sort_value_returns_422(self, client):
        response = client.get("/api/v1/properties", params={"sort": "random"})

        assert response.status_code == 422

    def test_invalid_page_size_returns_422(self, client):
        response = client.get("/api/v1/properties", params={"page_size": 100})

        assert response.status_code == 422
