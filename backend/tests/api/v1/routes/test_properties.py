"""
tests/api/v1/routes/test_properties.py

Integration tests for GET /api/v1/properties/{id} through the
TestClient — visibility rules (404 on missing/non-active) and response
shape.
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
from tests.conftest import make_user


def _make_property(db_session, *, status: PropertyStatus = PropertyStatus.active, **overrides) -> Property:
    broker = make_user(
        db_session,
        phone="+919876580001",
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
