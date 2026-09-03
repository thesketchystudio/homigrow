"""
tests/api/v1/routes/test_broker_properties.py

Integration tests for the broker-authenticated Post Property wizard
endpoints: POST /properties, POST /properties/{id}/media,
POST /properties/{id}/media/video, POST /properties/{id}/jv-agreement,
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
_VIDEO_FILE = ("video", ("walkthrough.mp4", b"fake mp4 bytes", "video/mp4"))
_AGREEMENT_FILE = ("document", ("jv-agreement.pdf", b"fake pdf bytes", "application/pdf"))


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
            "facing": "North-East",
            "plot_details": {"dimension": "30x40", "is_corner_plot": True},
        }

        response = client.post("/api/v1/properties", headers=_auth_headers(broker), json=payload)

        assert response.status_code == 200
        body = response.json()
        assert body["property_type"] == "plot"
        assert body["facing"] == "North-East"
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

    def test_broker_can_create_a_jv_listing(self, client, db_session):
        broker = _make_broker(db_session, phone="+919876546014")
        payload = {
            **_VALID_PAYLOAD,
            "is_jv_property": True,
            "jv_details": {
                "partners": [
                    {"name": "Ravi Kumar", "role": "Co-developer", "split_percent": 40, "can_edit": True},
                ],
                "commission_mode": "auto",
            },
        }

        response = client.post("/api/v1/properties", headers=_auth_headers(broker), json=payload)

        assert response.status_code == 200
        body = response.json()
        assert body["is_jv_property"] is True
        assert body["jv_details"]["commission_mode"] == "auto"
        assert body["jv_details"]["partners"][0]["name"] == "Ravi Kumar"
        assert body["jv_details"]["agreement_document_key"] is None

    def test_broker_can_create_a_sell_pg_listing(self, client, db_session):
        broker = _make_broker(db_session, phone="+919876546015")
        payload = {
            **_VALID_PAYLOAD,
            "property_type": "pg_colive",
            "bhk": None,
            "bathrooms": None,
            "pg_details": {
                "total_floors": 4,
                "total_rooms": 24,
                "currently_operational": True,
                "occupancy_types": ["Single", "Double"],
                "gender": "Mixed",
                "estimated_monthly_revenue": 240000,
            },
        }

        response = client.post("/api/v1/properties", headers=_auth_headers(broker), json=payload)

        assert response.status_code == 200
        body = response.json()
        assert body["pg_details"]["listing_scope"] is None
        assert body["pg_details"]["total_rooms"] == 24

    def test_broker_can_create_a_rent_pg_unit_listing(self, client, db_session):
        broker = _make_broker(db_session, phone="+919876546016")
        payload = {
            **_VALID_PAYLOAD,
            "listing_type": "rent",
            "property_type": "pg_colive",
            "bhk": None,
            "bathrooms": None,
            "deposit": 20000,
            "pg_details": {
                "listing_scope": "unit",
                "room_type": "Single",
                "floor": 2,
                "bathroom_type": "Attached",
                "ac": "AC",
                "gender_preference": "Any",
                "meals_included": True,
                "amenities": ["WiFi", "Laundry"],
                "monthly_rent": 9500,
            },
        }

        response = client.post("/api/v1/properties", headers=_auth_headers(broker), json=payload)

        assert response.status_code == 200
        body = response.json()
        assert body["pg_details"]["listing_scope"] == "unit"
        assert body["pg_details"]["monthly_rent"] == 9500

    def test_broker_can_create_a_commercial_building_rent_listing(self, client, db_session):
        broker = _make_broker(db_session, phone="+919876546017")
        payload = {
            **_VALID_PAYLOAD,
            "listing_type": "rent",
            "property_type": "commercial_building",
            "bhk": None,
            "bathrooms": None,
            "deposit": 500000,
        }

        response = client.post("/api/v1/properties", headers=_auth_headers(broker), json=payload)

        assert response.status_code == 200
        assert response.json()["property_type"] == "commercial_building"

    def test_broker_can_create_listing_with_extended_pricing_fields(self, client, db_session):
        broker = _make_broker(db_session, phone="+919876546018")
        payload = {
            **_VALID_PAYLOAD,
            "price_per_sqft": 10000,
            "token_amount": 500000,
            "price_flexibility": "highly_flexible",
            "payment_structure": "construction_linked",
            "stamp_duty_percent": 5,
            "registration_fee_percent": 1,
            "brokerage_included": False,
            "brokerage_percent": 2,
        }

        response = client.post("/api/v1/properties", headers=_auth_headers(broker), json=payload)

        assert response.status_code == 200
        body = response.json()
        assert body["price_per_sqft"] == 10000
        assert body["price_flexibility"] == "highly_flexible"
        assert body["payment_structure"] == "construction_linked"
        assert body["brokerage_included"] is False


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


class TestUploadPropertyVideo:
    def test_broker_can_upload_a_video(self, client, db_session):
        broker = _make_broker(db_session, phone="+919876546019")
        property_id = client.post(
            "/api/v1/properties", headers=_auth_headers(broker), json=_VALID_PAYLOAD
        ).json()["id"]

        response = client.post(
            f"/api/v1/properties/{property_id}/media/video",
            headers=_auth_headers(broker),
            files=[_VIDEO_FILE],
        )

        assert response.status_code == 200
        body = response.json()
        assert body["media_type"] == "video"
        assert body["is_cover"] is False

    def test_unsupported_video_type_returns_422(self, client, db_session):
        broker = _make_broker(db_session, phone="+919876546020")
        property_id = client.post(
            "/api/v1/properties", headers=_auth_headers(broker), json=_VALID_PAYLOAD
        ).json()["id"]

        response = client.post(
            f"/api/v1/properties/{property_id}/media/video",
            headers=_auth_headers(broker),
            files=[("video", ("walkthrough.avi", b"fake avi bytes", "video/x-msvideo"))],
        )

        assert response.status_code == 422
        assert response.json()["error"]["code"] == "UNSUPPORTED_FILE_TYPE"

    def test_non_owner_broker_is_forbidden(self, client, db_session):
        owner = _make_broker(db_session, phone="+919876546021")
        other = _make_broker(db_session, phone="+919876546022")
        property_id = client.post(
            "/api/v1/properties", headers=_auth_headers(owner), json=_VALID_PAYLOAD
        ).json()["id"]

        response = client.post(
            f"/api/v1/properties/{property_id}/media/video",
            headers=_auth_headers(other),
            files=[_VIDEO_FILE],
        )

        assert response.status_code == 403


class TestUploadJvAgreement:
    def test_broker_can_upload_agreement_for_a_jv_property(self, client, db_session):
        broker = _make_broker(db_session, phone="+919876546023")
        payload = {**_VALID_PAYLOAD, "is_jv_property": True, "jv_details": {"commission_mode": "manual"}}
        property_id = client.post(
            "/api/v1/properties", headers=_auth_headers(broker), json=payload
        ).json()["id"]

        response = client.post(
            f"/api/v1/properties/{property_id}/jv-agreement",
            headers=_auth_headers(broker),
            files=[_AGREEMENT_FILE],
        )

        assert response.status_code == 200
        body = response.json()
        assert body["jv_details"]["commission_mode"] == "manual"
        assert body["jv_details"]["agreement_document_key"] is not None

    def test_non_jv_property_returns_422(self, client, db_session):
        broker = _make_broker(db_session, phone="+919876546024")
        property_id = client.post(
            "/api/v1/properties", headers=_auth_headers(broker), json=_VALID_PAYLOAD
        ).json()["id"]

        response = client.post(
            f"/api/v1/properties/{property_id}/jv-agreement",
            headers=_auth_headers(broker),
            files=[_AGREEMENT_FILE],
        )

        assert response.status_code == 422
        assert response.json()["error"]["code"] == "NOT_JV_PROPERTY"

    def test_non_owner_broker_is_forbidden(self, client, db_session):
        owner = _make_broker(db_session, phone="+919876546025")
        other = _make_broker(db_session, phone="+919876546026")
        payload = {**_VALID_PAYLOAD, "is_jv_property": True}
        property_id = client.post(
            "/api/v1/properties", headers=_auth_headers(owner), json=payload
        ).json()["id"]

        response = client.post(
            f"/api/v1/properties/{property_id}/jv-agreement",
            headers=_auth_headers(other),
            files=[_AGREEMENT_FILE],
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
