"""
tests/api/v1/routes/test_broker_properties.py

Integration tests for the broker-authenticated Post Property wizard
endpoints: POST /properties, POST /properties/{id}/media,
POST /properties/{id}/submit — auth/ownership gating, the
create-requires-price contract, and the media-required submit rule.
"""

from app.core.security import create_access_token
from app.models.broker_profile import BrokerProfile
from app.models.enums import UserRole
from tests.conftest import make_user

_VALID_PAYLOAD = {
    "title": "2 BHK Luxury Flat",
    "listing_type": "sale",
    "property_type": "apartment",
    "bhk": 2,
    "bathrooms": 2,
    "area_sqft": 1200,
    "amenities": ["Gym", "Parking"],
    "address_line": "12 MG Road",
    "locality": "Indiranagar",
    "city": "Bengaluru",
    "state": "Karnataka",
    "pincode": "560038",
    "price": 15000000,
}

_IMAGE_FILES = [("images", ("hero.jpg", b"fake jpg bytes", "image/jpeg"))]


def _auth_headers(user) -> dict:
    return {"Authorization": f"Bearer {create_access_token(user.id, user.role.value)}"}


def _make_broker(db_session, **kwargs):
    user = make_user(db_session, role=UserRole.broker, **kwargs)
    db_session.add(BrokerProfile(user_id=user.id))
    db_session.flush()
    return user


class TestCreateProperty:
    def test_broker_can_create_a_draft_listing(self, client, db_session):
        broker = _make_broker(db_session, phone="+919876546001")

        response = client.post("/api/v1/properties", headers=_auth_headers(broker), json=_VALID_PAYLOAD)

        assert response.status_code == 200
        body = response.json()
        assert body["status"] == "draft"
        assert body["title"] == "2 BHK Luxury Flat"
        assert body["price"] == 15000000
        assert body["media"] == []
        assert body["plot_details"] is None
        assert body["land_details"] is None

    def test_requires_authentication(self, client):
        response = client.post("/api/v1/properties", json=_VALID_PAYLOAD)
        assert response.status_code == 401

    def test_client_role_is_forbidden(self, client, db_session):
        user = make_user(db_session, role=UserRole.client, phone="+919876546002")

        response = client.post("/api/v1/properties", headers=_auth_headers(user), json=_VALID_PAYLOAD)

        assert response.status_code == 403

    def test_non_positive_price_is_rejected(self, client, db_session):
        broker = _make_broker(db_session, phone="+919876546003")
        payload = {**_VALID_PAYLOAD, "price": 0}

        response = client.post("/api/v1/properties", headers=_auth_headers(broker), json=payload)

        assert response.status_code == 422

    def test_broker_can_create_a_plot_listing(self, client, db_session):
        broker = _make_broker(db_session, phone="+919876546012")
        payload = {
            **_VALID_PAYLOAD,
            "property_type": "plot",
            "bhk": None,
            "bathrooms": None,
            "plot_details": {"dimension": "30x40", "is_corner_plot": True},
        }

        response = client.post("/api/v1/properties", headers=_auth_headers(broker), json=payload)

        assert response.status_code == 200
        body = response.json()
        assert body["property_type"] == "plot"
        assert body["plot_details"] == {"dimension": "30x40", "is_corner_plot": True}
        assert body["land_details"] is None

    def test_broker_can_create_a_land_listing(self, client, db_session):
        broker = _make_broker(db_session, phone="+919876546013")
        payload = {
            **_VALID_PAYLOAD,
            "property_type": "land",
            "bhk": None,
            "bathrooms": None,
            "land_details": {"land_use": "commercial", "approvals": ["RERA", "BMRDA"]},
        }

        response = client.post("/api/v1/properties", headers=_auth_headers(broker), json=payload)

        assert response.status_code == 200
        body = response.json()
        assert body["property_type"] == "land"
        assert body["land_details"] == {"land_use": "commercial", "approvals": ["RERA", "BMRDA"]}
        assert body["plot_details"] is None


class TestUploadPropertyMedia:
    def test_broker_can_upload_photos_and_first_becomes_cover(self, client, db_session):
        broker = _make_broker(db_session, phone="+919876546004")
        property_id = client.post(
            "/api/v1/properties", headers=_auth_headers(broker), json=_VALID_PAYLOAD
        ).json()["id"]

        response = client.post(
            f"/api/v1/properties/{property_id}/media",
            headers=_auth_headers(broker),
            files=_IMAGE_FILES,
        )

        assert response.status_code == 200
        media = response.json()
        assert len(media) == 1
        assert media[0]["is_cover"] is True

    def test_unsupported_file_type_returns_422(self, client, db_session):
        broker = _make_broker(db_session, phone="+919876546005")
        property_id = client.post(
            "/api/v1/properties", headers=_auth_headers(broker), json=_VALID_PAYLOAD
        ).json()["id"]

        response = client.post(
            f"/api/v1/properties/{property_id}/media",
            headers=_auth_headers(broker),
            files=[("images", ("hero.gif", b"fake gif bytes", "image/gif"))],
        )

        assert response.status_code == 422
        assert response.json()["error"]["code"] == "UNSUPPORTED_FILE_TYPE"

    def test_non_owner_broker_is_forbidden(self, client, db_session):
        owner = _make_broker(db_session, phone="+919876546006")
        other = _make_broker(db_session, phone="+919876546007")
        property_id = client.post(
            "/api/v1/properties", headers=_auth_headers(owner), json=_VALID_PAYLOAD
        ).json()["id"]

        response = client.post(
            f"/api/v1/properties/{property_id}/media",
            headers=_auth_headers(other),
            files=_IMAGE_FILES,
        )

        assert response.status_code == 403


class TestSubmitProperty:
    def test_submit_without_media_returns_422(self, client, db_session):
        broker = _make_broker(db_session, phone="+919876546008")
        property_id = client.post(
            "/api/v1/properties", headers=_auth_headers(broker), json=_VALID_PAYLOAD
        ).json()["id"]

        response = client.post(f"/api/v1/properties/{property_id}/submit", headers=_auth_headers(broker))

        assert response.status_code == 422
        assert response.json()["error"]["code"] == "MEDIA_REQUIRED"

    def test_submit_with_cover_photo_moves_to_pending(self, client, db_session):
        broker = _make_broker(db_session, phone="+919876546009")
        property_id = client.post(
            "/api/v1/properties", headers=_auth_headers(broker), json=_VALID_PAYLOAD
        ).json()["id"]
        client.post(f"/api/v1/properties/{property_id}/media", headers=_auth_headers(broker), files=_IMAGE_FILES)

        response = client.post(f"/api/v1/properties/{property_id}/submit", headers=_auth_headers(broker))

        assert response.status_code == 200
        assert response.json()["status"] == "pending"

    def test_non_owner_broker_is_forbidden(self, client, db_session):
        owner = _make_broker(db_session, phone="+919876546010")
        other = _make_broker(db_session, phone="+919876546011")
        property_id = client.post(
            "/api/v1/properties", headers=_auth_headers(owner), json=_VALID_PAYLOAD
        ).json()["id"]

        response = client.post(f"/api/v1/properties/{property_id}/submit", headers=_auth_headers(other))

        assert response.status_code == 403
