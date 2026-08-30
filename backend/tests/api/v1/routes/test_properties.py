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

    def test_locality_filter_is_case_insensitive(self, client, db_session):
        city = _unique_city()
        _make_property(db_session, title="Indiranagar Home", city=city, locality="Indiranagar")
        _make_property(db_session, title="Whitefield Home", city=city, locality="Whitefield")

        response = client.get("/api/v1/properties", params={"city": city, "locality": "INDIRANAGAR"})

        assert response.status_code == 200
        assert [item["title"] for item in response.json()["items"]] == ["Indiranagar Home"]

    def test_search_matches_locality_not_just_city(self, client, db_session):
        # A typed "whitefield" is a locality, not a city — search must
        # match either column, unlike the exact `city`/`locality` filters
        # above.
        locality = f"Whitefield-{uuid.uuid4().hex[:8]}"
        city = _unique_city()
        _make_property(db_session, title="Locality Match", city=city, locality=locality)
        _make_property(db_session, title="Unrelated", city=_unique_city(), locality="Somewhere Else")

        response = client.get("/api/v1/properties", params={"search": locality.lower()})

        assert response.status_code == 200
        titles = {item["title"] for item in response.json()["items"]}
        assert "Locality Match" in titles
        assert "Unrelated" not in titles

    def test_search_matches_city_too(self, client, db_session):
        city = _unique_city()
        _make_property(db_session, title="City Match", city=city)

        response = client.get("/api/v1/properties", params={"search": city[:6].upper()})

        assert response.status_code == 200
        assert "City Match" in {item["title"] for item in response.json()["items"]}

    def test_search_matches_title(self, client, db_session):
        city = _unique_city()
        unique_word = f"Zenith{uuid.uuid4().hex[:8]}"
        _make_property(db_session, title=f"The {unique_word} Residency", city=city)
        _make_property(db_session, title="Unrelated Listing", city=city)

        response = client.get("/api/v1/properties", params={"search": unique_word.lower()})

        assert response.status_code == 200
        titles = {item["title"] for item in response.json()["items"]}
        assert f"The {unique_word} Residency" in titles
        assert "Unrelated Listing" not in titles

    def test_search_matches_description(self, client, db_session):
        city = _unique_city()
        unique_word = f"Skybridge{uuid.uuid4().hex[:8]}"
        _make_property(db_session, title="Match", description=f"Features a private {unique_word} to the pool deck.", city=city)
        _make_property(db_session, title="No Match", description="A plain, unremarkable home.", city=city)

        response = client.get("/api/v1/properties", params={"search": unique_word.lower()})

        assert response.status_code == 200
        assert {"Match"} == {item["title"] for item in response.json()["items"]}

    def test_search_matches_amenities(self, client, db_session):
        city = _unique_city()
        unique_word = f"Onsen{uuid.uuid4().hex[:8]}"
        _make_property(db_session, title="Match", amenities=[f"Private {unique_word} Bath"], city=city)
        _make_property(db_session, title="No Match", amenities=["Gym"], city=city)

        response = client.get("/api/v1/properties", params={"search": unique_word.lower()})

        assert response.status_code == 200
        assert {"Match"} == {item["title"] for item in response.json()["items"]}

    def test_search_matches_landmark(self, client, db_session):
        city = _unique_city()
        unique_word = f"Riverside{uuid.uuid4().hex[:8]}"
        _make_property(db_session, title="Match", landmark=f"Opposite {unique_word} Park", city=city)
        _make_property(db_session, title="No Match", landmark="Near the old mill", city=city)

        response = client.get("/api/v1/properties", params={"search": unique_word.lower()})

        assert response.status_code == 200
        assert {"Match"} == {item["title"] for item in response.json()["items"]}

    def test_search_combines_property_type_and_area(self, client, db_session):
        # "villas in <locality>" should resolve to property_type=villa AND
        # an area match — not one dead literal-phrase substring match.
        locality = f"Indiranagar-{uuid.uuid4().hex[:8]}"
        city = _unique_city()
        _make_property(db_session, title="Villa Match", city=city, locality=locality, property_type=PropertyType.villa)
        _make_property(db_session, title="Wrong Type", city=city, locality=locality, property_type=PropertyType.apartment)
        _make_property(db_session, title="Wrong Area", city=city, locality="Somewhere Else", property_type=PropertyType.villa)

        response = client.get("/api/v1/properties", params={"search": f"villas in {locality.lower()}"})

        assert response.status_code == 200
        titles = {item["title"] for item in response.json()["items"]}
        assert titles == {"Villa Match"}

    def test_search_property_type_alone_matches_by_type_not_title_text(self, client, db_session):
        # A villa whose title happens to contain no type-ish words at all
        # must still match a bare "apartments" search once it's the right
        # type — this only works via the structured property_type filter,
        # not the old plain-substring fallback.
        city = _unique_city()
        _make_property(db_session, title="Emerald Heights Residency", city=city, property_type=PropertyType.apartment)
        _make_property(db_session, title="Sunset Villa", city=city, property_type=PropertyType.villa)

        response = client.get("/api/v1/properties", params={"city": city, "search": "apartments"})

        assert response.status_code == 200
        titles = {item["title"] for item in response.json()["items"]}
        assert titles == {"Emerald Heights Residency"}

    def test_search_falls_back_to_substring_when_no_type_token(self, client, db_session):
        city = _unique_city()
        unique_word = f"Skyline{uuid.uuid4().hex[:8]}"
        _make_property(db_session, title=f"The {unique_word} Tower", city=city)

        response = client.get("/api/v1/properties", params={"search": unique_word.lower()})

        assert response.status_code == 200
        assert unique_word in response.json()["items"][0]["title"]

    def test_search_finds_nothing_for_an_unrelated_term(self, client, db_session):
        city = _unique_city()
        _make_property(db_session, title="Match", city=city)

        response = client.get("/api/v1/properties", params={"search": f"nonexistent{uuid.uuid4().hex[:8]}"})

        assert response.status_code == 200
        assert response.json()["items"] == []

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


class TestListNeighborhoods:
    def test_returns_top_localities_by_active_count_with_cover_image(self, client, db_session):
        city = _unique_city()
        locality = f"TestLocality-{uuid.uuid4().hex[:8]}"
        _make_property(db_session, title="One", city=city, locality=locality)
        _make_property(db_session, title="Two", city=city, locality=locality)
        _make_property(db_session, title="Pending", city=city, locality=locality, status=PropertyStatus.pending)

        response = client.get("/api/v1/properties/neighborhoods", params={"limit": 12})

        assert response.status_code == 200
        match = next(item for item in response.json() if item["locality"] == locality and item["city"] == city)
        assert match["property_count"] == 2
        assert match["cover_image_url"] == "https://example.com/cover.jpg"

    def test_invalid_limit_returns_422(self, client):
        response = client.get("/api/v1/properties/neighborhoods", params={"limit": 100})

        assert response.status_code == 422


class TestCompareProperties:
    def test_returns_active_properties_in_requested_order(self, client, db_session):
        first = _make_property(db_session, title="First")
        second = _make_property(db_session, title="Second")

        response = client.get("/api/v1/properties/compare", params={"ids": f"{second.id},{first.id}"})

        assert response.status_code == 200
        assert [item["title"] for item in response.json()["items"]] == ["Second", "First"]

    def test_drops_non_active_and_nonexistent_ids(self, client, db_session):
        active = _make_property(db_session, title="Active")
        pending = _make_property(db_session, title="Pending", status=PropertyStatus.pending)
        missing_id = uuid.uuid4()

        response = client.get(
            "/api/v1/properties/compare",
            params={"ids": f"{active.id},{pending.id},{missing_id}"},
        )

        assert response.status_code == 200
        assert [item["title"] for item in response.json()["items"]] == ["Active"]

    def test_malformed_id_returns_422(self, client):
        response = client.get("/api/v1/properties/compare", params={"ids": "not-a-uuid"})

        assert response.status_code == 422
        assert response.json()["error"]["code"] == "INVALID_COMPARE_IDS"

    def test_more_than_max_ids_returns_422(self, client, db_session):
        ids = [str(_make_property(db_session).id) for _ in range(4)]

        response = client.get("/api/v1/properties/compare", params={"ids": ",".join(ids)})

        assert response.status_code == 422
        assert response.json()["error"]["code"] == "TOO_MANY_COMPARE_IDS"

    def test_empty_ids_returns_empty_list(self, client):
        response = client.get("/api/v1/properties/compare", params={"ids": ""})

        assert response.status_code == 200
        assert response.json()["items"] == []
