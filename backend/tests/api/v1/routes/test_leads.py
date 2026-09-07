"""
tests/api/v1/routes/test_leads.py

Integration tests for POST /api/v1/properties/{id}/enquire through the
TestClient — anonymous vs logged-in submission, contact-info capture,
open-lead dedup for both paths, broker-phone reveal, and rate limiting.
"""

import uuid

from app.core.security import create_access_token
from app.models.enums import ListingType, PropertyStatus, PropertyType, UserRole
from app.models.lead import Lead
from app.models.notification import Notification
from app.models.property import Property
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


class TestEnquireProperty:
    def test_anonymous_enquiry_succeeds(self, client, db_session):
        broker = make_user(
            db_session, phone="+919812340000", role=UserRole.broker, full_name="Vikram Sethi"
        )
        property_ = _make_property(db_session, broker=broker)

        response = client.post(
            f"/api/v1/properties/{property_.id}/enquire",
            json={"name": "Test Visitor", "phone": "+919876500099", "source": "number_request"},
        )

        assert response.status_code == 201
        body = response.json()
        assert body["broker_name"] == "Vikram Sethi"
        assert body["broker_phone"] == "+919812340000"

        lead = db_session.query(Lead).filter(Lead.property_id == property_.id).first()
        assert lead is not None
        assert lead.client_id is None
        assert lead.contact_name == "Test Visitor"
        assert lead.contact_phone == "+919876500099"
        assert lead.broker_id == broker.id
        assert lead.source == "number_request"

        notification = db_session.query(Notification).filter(Notification.user_id == broker.id).first()
        assert notification is not None
        assert notification.data["lead_id"] == str(lead.id)

    def test_logged_in_enquiry_populates_client_id(self, client, db_session):
        client_user = make_user(db_session, phone="+919876580100")
        property_ = _make_property(db_session)

        response = client.post(
            f"/api/v1/properties/{property_.id}/enquire",
            headers=_auth_headers(client_user),
            json={"name": "Logged In User", "phone": "+919876580100", "source": "tour_request"},
        )

        assert response.status_code == 201
        lead = db_session.query(Lead).filter(Lead.property_id == property_.id).first()
        assert lead.client_id == client_user.id
        assert lead.contact_name == "Logged In User"

    def test_preferred_date_is_folded_into_message(self, client, db_session):
        property_ = _make_property(db_session)

        response = client.post(
            f"/api/v1/properties/{property_.id}/enquire",
            json={
                "name": "Test Visitor",
                "phone": "+919876500101",
                "source": "tour_request",
                "preferred_date": "2026-10-01",
            },
        )

        assert response.status_code == 201
        lead = db_session.query(Lead).filter(Lead.property_id == property_.id).first()
        assert "2026-10-01" in lead.message

    def test_anonymous_dedup_by_phone_returns_409(self, client, db_session):
        property_ = _make_property(db_session)
        payload = {"name": "Test Visitor", "phone": "+919876500102", "source": "number_request"}

        first = client.post(f"/api/v1/properties/{property_.id}/enquire", json=payload)
        second = client.post(f"/api/v1/properties/{property_.id}/enquire", json=payload)

        assert first.status_code == 201
        assert second.status_code == 409
        assert second.json()["error"]["code"] == "LEAD_ALREADY_OPEN"

    def test_logged_in_dedup_by_client_id_returns_409(self, client, db_session):
        client_user = make_user(db_session, phone="+919876580103")
        property_ = _make_property(db_session)
        payload = {"name": "Logged In User", "phone": "+919876580103", "source": "tour_request"}

        first = client.post(
            f"/api/v1/properties/{property_.id}/enquire", headers=_auth_headers(client_user), json=payload
        )
        second = client.post(
            f"/api/v1/properties/{property_.id}/enquire", headers=_auth_headers(client_user), json=payload
        )

        assert first.status_code == 201
        assert second.status_code == 409
        assert second.json()["error"]["code"] == "LEAD_ALREADY_OPEN"

    def test_different_property_is_not_deduped(self, client, db_session):
        first_property = _make_property(db_session)
        second_property = _make_property(db_session, title="A Different Listing")
        payload = {"name": "Test Visitor", "phone": "+919876500104", "source": "number_request"}

        first = client.post(f"/api/v1/properties/{first_property.id}/enquire", json=payload)
        second = client.post(f"/api/v1/properties/{second_property.id}/enquire", json=payload)

        assert first.status_code == 201
        assert second.status_code == 201

    def test_missing_property_returns_404(self, client, db_session):
        response = client.post(
            f"/api/v1/properties/{uuid.uuid4()}/enquire",
            json={"name": "Test Visitor", "phone": "+919876500105", "source": "number_request"},
        )

        assert response.status_code == 404
        assert response.json()["error"]["code"] == "PROPERTY_NOT_FOUND"


class TestEnquireRateLimiting:
    def test_sixth_enquiry_request_within_a_minute_returns_429(self, client, db_session):
        property_ = _make_property(db_session)

        for i in range(5):
            response = client.post(
                f"/api/v1/properties/{property_.id}/enquire",
                json={"name": "Test Visitor", "phone": f"+91987650{i:04d}", "source": "number_request"},
            )
            assert response.status_code == 201

        sixth = client.post(
            f"/api/v1/properties/{property_.id}/enquire",
            json={"name": "Test Visitor", "phone": "+919876509999", "source": "number_request"},
        )

        assert sixth.status_code == 429
        assert sixth.json()["error"]["code"] == "RATE_LIMITED"
