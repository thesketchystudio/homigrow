"""
tests/api/v1/routes/test_saved_properties.py

Integration tests for GET/PUT/DELETE /api/v1/saved-properties* through
the TestClient — auth wiring, idempotent save/unsave, response shape,
and pagination.
"""

import uuid

from app.core.security import create_access_token
from app.models.enums import ListingType, PropertyStatus, PropertyType, UserRole
from app.models.property import Property
from app.models.saved_property import SavedProperty
from tests.conftest import make_user


def _auth_headers(user) -> dict:
    return {"Authorization": f"Bearer {create_access_token(user.id, user.role.value)}"}


def _make_property(db_session, *, broker=None, **overrides) -> Property:
    if broker is None:
        broker = make_user(
            db_session,
            phone=f"+9198765{uuid.uuid4().int % 100000:05d}",
            role=UserRole.broker,
            full_name="Vikram Sethi",
        )

    defaults = dict(
        broker_id=broker.id,
        title="The Obsidian Estate",
        listing_type=ListingType.rent,
        property_type=PropertyType.villa,
        status=PropertyStatus.active,
        price=245000,
        is_negotiable=False,
        address_line="100 Ft Road, Indiranagar",
        locality="Indiranagar",
        city="Bengaluru",
        state="Karnataka",
        pincode="560038",
    )
    defaults.update(overrides)
    property_ = Property(**defaults)
    db_session.add(property_)
    db_session.flush()
    return property_


class TestListSavedProperties:
    def test_without_a_token_returns_401(self, client):
        response = client.get("/api/v1/saved-properties")

        assert response.status_code == 401

    def test_returns_only_the_callers_saved_properties(self, client, db_session):
        user = make_user(db_session, phone="+919876580001")
        other_user = make_user(db_session, phone="+919876580002")
        mine = _make_property(db_session, title="Mine")
        _make_property(db_session, title="Not Mine")
        db_session.add(SavedProperty(user_id=user.id, property_id=mine.id))
        db_session.add(SavedProperty(user_id=other_user.id, property_id=mine.id))
        db_session.flush()

        response = client.get("/api/v1/saved-properties", headers=_auth_headers(user))

        assert response.status_code == 200
        body = response.json()
        assert body["total"] == 1
        assert [item["title"] for item in body["items"]] == ["Mine"]
        assert "saved_at" in body["items"][0]

    def test_newest_saved_first(self, client, db_session):
        import datetime

        user = make_user(db_session, phone="+919876580010")
        older = _make_property(db_session, title="Older Save")
        newer = _make_property(db_session, title="Newer Save")
        db_session.add(
            SavedProperty(
                user_id=user.id,
                property_id=older.id,
                created_at=datetime.datetime(2020, 1, 1, tzinfo=datetime.timezone.utc),
            )
        )
        db_session.add(
            SavedProperty(
                user_id=user.id,
                property_id=newer.id,
                created_at=datetime.datetime(2024, 1, 1, tzinfo=datetime.timezone.utc),
            )
        )
        db_session.flush()

        response = client.get("/api/v1/saved-properties", headers=_auth_headers(user))

        assert [item["title"] for item in response.json()["items"]] == ["Newer Save", "Older Save"]

    def test_property_type_filter(self, client, db_session):
        user = make_user(db_session, phone="+919876580011")
        villa = _make_property(db_session, title="Villa Save", property_type=PropertyType.villa)
        office = _make_property(db_session, title="Office Save", property_type=PropertyType.office)
        db_session.add(SavedProperty(user_id=user.id, property_id=villa.id))
        db_session.add(SavedProperty(user_id=user.id, property_id=office.id))
        db_session.flush()

        response = client.get(
            "/api/v1/saved-properties", headers=_auth_headers(user), params={"property_type": "villa"}
        )

        assert response.status_code == 200
        assert [item["title"] for item in response.json()["items"]] == ["Villa Save"]

    def test_price_sort(self, client, db_session):
        user = make_user(db_session, phone="+919876580012")
        cheap = _make_property(db_session, title="Cheap Save", price=100000)
        pricey = _make_property(db_session, title="Pricey Save", price=900000)
        db_session.add(SavedProperty(user_id=user.id, property_id=pricey.id))
        db_session.add(SavedProperty(user_id=user.id, property_id=cheap.id))
        db_session.flush()

        response = client.get(
            "/api/v1/saved-properties", headers=_auth_headers(user), params={"sort": "price_asc"}
        )

        assert [item["title"] for item in response.json()["items"]] == ["Cheap Save", "Pricey Save"]

    def test_pagination_envelope(self, client, db_session):
        user = make_user(db_session, phone="+919876580020")
        for i in range(3):
            property_ = _make_property(db_session, title=f"Property {i}")
            db_session.add(SavedProperty(user_id=user.id, property_id=property_.id))
        db_session.flush()

        response = client.get(
            "/api/v1/saved-properties", headers=_auth_headers(user), params={"page": 1, "page_size": 2}
        )

        assert response.status_code == 200
        body = response.json()
        assert body["total"] == 3
        assert body["page"] == 1
        assert body["page_size"] == 2
        assert body["total_pages"] == 2
        assert len(body["items"]) == 2


class TestSaveProperty:
    def test_without_a_token_returns_401(self, client, db_session):
        property_ = _make_property(db_session)

        response = client.put(f"/api/v1/saved-properties/{property_.id}")

        assert response.status_code == 401

    def test_saves_the_property(self, client, db_session):
        user = make_user(db_session, phone="+919876580030")
        property_ = _make_property(db_session)

        response = client.put(f"/api/v1/saved-properties/{property_.id}", headers=_auth_headers(user))

        assert response.status_code == 204
        saved = (
            db_session.query(SavedProperty)
            .filter(SavedProperty.user_id == user.id, SavedProperty.property_id == property_.id)
            .first()
        )
        assert saved is not None

    def test_saving_twice_is_idempotent(self, client, db_session):
        user = make_user(db_session, phone="+919876580031")
        property_ = _make_property(db_session)

        first = client.put(f"/api/v1/saved-properties/{property_.id}", headers=_auth_headers(user))
        second = client.put(f"/api/v1/saved-properties/{property_.id}", headers=_auth_headers(user))

        assert first.status_code == 204
        assert second.status_code == 204
        count = (
            db_session.query(SavedProperty)
            .filter(SavedProperty.user_id == user.id, SavedProperty.property_id == property_.id)
            .count()
        )
        assert count == 1

    def test_missing_property_returns_404(self, client, db_session):
        user = make_user(db_session, phone="+919876580032")

        response = client.put(f"/api/v1/saved-properties/{uuid.uuid4()}", headers=_auth_headers(user))

        assert response.status_code == 404
        assert response.json()["error"]["code"] == "PROPERTY_NOT_FOUND"


class TestUnsaveProperty:
    def test_without_a_token_returns_401(self, client, db_session):
        property_ = _make_property(db_session)

        response = client.delete(f"/api/v1/saved-properties/{property_.id}")

        assert response.status_code == 401

    def test_unsaves_the_property(self, client, db_session):
        user = make_user(db_session, phone="+919876580040")
        property_ = _make_property(db_session)
        db_session.add(SavedProperty(user_id=user.id, property_id=property_.id))
        db_session.flush()

        response = client.delete(f"/api/v1/saved-properties/{property_.id}", headers=_auth_headers(user))

        assert response.status_code == 204
        saved = (
            db_session.query(SavedProperty)
            .filter(SavedProperty.user_id == user.id, SavedProperty.property_id == property_.id)
            .first()
        )
        assert saved is None

    def test_unsaving_something_never_saved_is_idempotent(self, client, db_session):
        user = make_user(db_session, phone="+919876580041")
        property_ = _make_property(db_session)

        response = client.delete(f"/api/v1/saved-properties/{property_.id}", headers=_auth_headers(user))

        assert response.status_code == 204
