"""
tests/api/v1/routes/test_leads.py

Integration tests for POST /api/v1/properties/{id}/enquire (anonymous vs
logged-in submission, contact-info capture, open-lead dedup, broker-phone
reveal, rate limiting) and for the broker-authenticated lead pipeline under
/api/v1/leads (list/detail/status update/notes).
"""

import uuid
from datetime import datetime, timedelta, timezone

from app.core.security import create_access_token
from app.models.enums import LeadStatus, ListingType, PropertyStatus, PropertyType, UserRole
from app.models.lead import Lead, LeadNote
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
        assert body["broker_phone"] is None

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

    def test_logged_in_enquiry_reveals_the_broker_phone(self, client, db_session):
        broker = make_user(db_session, phone="+919812340010", role=UserRole.broker, full_name="Vikram Sethi")
        client_user = make_user(db_session, phone="+919876580110")
        property_ = _make_property(db_session, broker=broker)

        response = client.post(
            f"/api/v1/properties/{property_.id}/enquire",
            headers=_auth_headers(client_user),
            json={"name": "Logged In User", "phone": "+919876580110", "source": "number_request"},
        )

        assert response.status_code == 201
        assert response.json()["broker_phone"] == "+919812340010"

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


class TestEnquiryInputValidation:
    def _post(self, client, property_, **fields):
        payload = {"name": "Test Visitor", "phone": "+919876500300", "source": "number_request", **fields}
        return client.post(f"/api/v1/properties/{property_.id}/enquire", json=payload)

    def test_phone_is_normalised_before_it_is_stored(self, client, db_session):
        property_ = _make_property(db_session)

        response = self._post(client, property_, phone="98765 43212")

        assert response.status_code == 201
        lead = db_session.query(Lead).filter(Lead.property_id == property_.id).one()
        assert lead.contact_phone == "+919876543212"

    def test_same_number_written_differently_is_still_deduped(self, client, db_session):
        property_ = _make_property(db_session)

        first = self._post(client, property_, phone="+91 98765-43211")
        second = self._post(client, property_, phone="09876543211")

        assert first.status_code == 201
        assert second.status_code == 409

    def test_implausible_phone_numbers_are_rejected(self, client, db_session):
        property_ = _make_property(db_session)

        for bad in ("12345", "0000000000", "9999999999", "5876543210", "1234567890", "abcdefghij", "+441234567890"):
            response = self._post(client, property_, phone=bad)
            assert response.status_code == 422, bad
            assert "phone" in response.json()["error"]["fields"]

    def test_junk_names_are_rejected(self, client, db_session):
        property_ = _make_property(db_session)

        for bad in ("1234", "x", "   ", "visit http://spam.example now", "www.spam.example"):
            assert self._post(client, property_, name=bad).status_code == 422, bad

    def test_oversized_message_is_rejected(self, client, db_session):
        property_ = _make_property(db_session)

        assert self._post(client, property_, message="x" * 1001).status_code == 422


class TestEnquiryAbuseLimits:
    def _enquire(self, client, property_, phone, headers=None):
        return client.post(
            f"/api/v1/properties/{property_.id}/enquire",
            headers=headers or {},
            json={"name": "Test Visitor", "phone": phone, "source": "number_request"},
        )

    def test_one_number_cannot_enquire_on_more_than_five_listings_a_day(self, client, db_session):
        phone = "+919876500400"
        for _ in range(5):
            _make_lead(db_session, property_=_make_property(db_session), contact_phone=phone)

        response = self._enquire(client, _make_property(db_session), phone)

        assert response.status_code == 429
        assert response.json()["error"]["code"] == "TOO_MANY_ENQUIRIES"

    def test_old_enquiries_do_not_count_toward_the_daily_cap(self, client, db_session):
        phone = "+919876500401"
        two_days_ago = datetime.now(timezone.utc) - timedelta(days=2)
        for _ in range(5):
            _make_lead(db_session, property_=_make_property(db_session), contact_phone=phone, created_at=two_days_ago)

        assert self._enquire(client, _make_property(db_session), phone).status_code == 201

    def test_one_account_cannot_rotate_numbers_past_the_daily_cap(self, client, db_session):
        account = make_user(db_session, phone="+919876580402")
        for i in range(5):
            _make_lead(db_session, property_=_make_property(db_session), client_id=account.id, contact_phone=f"+91987650050{i}")

        response = self._enquire(client, _make_property(db_session), "+919876500409", headers=_auth_headers(account))

        assert response.status_code == 429
        assert response.json()["error"]["code"] == "TOO_MANY_ENQUIRIES"

    def test_a_listing_cannot_be_flooded_with_enquiries_in_an_hour(self, client, db_session):
        property_ = _make_property(db_session)
        for i in range(15):
            _make_lead(db_session, property_=property_, contact_phone=f"+91987650060{i:02d}")

        response = self._enquire(client, property_, "+919876500699")

        assert response.status_code == 429
        assert response.json()["error"]["code"] == "PROPERTY_BUSY"


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


def _make_lead(db_session, *, property_, **overrides) -> Lead:
    defaults = dict(
        property_id=property_.id,
        broker_id=property_.broker_id,
        contact_name="Test Visitor",
        contact_phone="+919876500200",
        source="number_request",
    )
    defaults.update(overrides)
    lead = Lead(**defaults)
    db_session.add(lead)
    db_session.flush()
    return lead


class TestBrokerLeadPipeline:
    def test_list_leads_returns_only_this_brokers_leads_newest_first(self, client, db_session):
        broker = make_user(db_session, phone="+919812340001", role=UserRole.broker)
        other_broker = make_user(db_session, phone="+919812340002", role=UserRole.broker)
        property_ = _make_property(db_session, broker=broker)
        other_property = _make_property(db_session, broker=other_broker)

        yesterday = datetime.now(timezone.utc) - timedelta(days=1)
        older = _make_lead(db_session, property_=property_, contact_name="Older Lead", created_at=yesterday)
        _make_lead(db_session, property_=other_property, contact_name="Not This Broker's Lead")
        newer = _make_lead(db_session, property_=property_, contact_name="Newer Lead")
        db_session.commit()

        response = client.get("/api/v1/leads", headers=_auth_headers(broker))

        assert response.status_code == 200
        body = response.json()
        assert [item["id"] for item in body] == [str(newer.id), str(older.id)]
        assert body[0]["property_title"] == property_.title
        assert body[0]["last_contacted_at"] is None

    def test_list_leads_requires_broker_role(self, client, db_session):
        client_user = make_user(db_session, phone="+919876580200")

        response = client.get("/api/v1/leads", headers=_auth_headers(client_user))

        assert response.status_code == 403

    def test_get_lead_returns_notes(self, client, db_session):
        broker = make_user(db_session, phone="+919812340003", role=UserRole.broker)
        property_ = _make_property(db_session, broker=broker)
        lead = _make_lead(db_session, property_=property_)
        note = LeadNote(lead_id=lead.id, author_id=broker.id, body="Called, left a voicemail.")
        db_session.add(note)
        db_session.commit()

        response = client.get(f"/api/v1/leads/{lead.id}", headers=_auth_headers(broker))

        assert response.status_code == 200
        body = response.json()
        assert len(body["notes"]) == 1
        assert body["notes"][0]["body"] == "Called, left a voicemail."
        assert body["last_contacted_at"] is not None

    def test_get_lead_not_owned_returns_404(self, client, db_session):
        broker = make_user(db_session, phone="+919812340004", role=UserRole.broker)
        other_broker = make_user(db_session, phone="+919812340005", role=UserRole.broker)
        property_ = _make_property(db_session, broker=other_broker)
        lead = _make_lead(db_session, property_=property_)

        response = client.get(f"/api/v1/leads/{lead.id}", headers=_auth_headers(broker))

        assert response.status_code == 404
        assert response.json()["error"]["code"] == "LEAD_NOT_FOUND"

    def test_update_lead_status_persists(self, client, db_session):
        broker = make_user(db_session, phone="+919812340006", role=UserRole.broker)
        property_ = _make_property(db_session, broker=broker)
        lead = _make_lead(db_session, property_=property_)

        response = client.patch(
            f"/api/v1/leads/{lead.id}", headers=_auth_headers(broker), json={"status": "contacted"}
        )

        assert response.status_code == 200
        assert response.json()["status"] == "contacted"
        db_session.refresh(lead)
        assert lead.status == LeadStatus.contacted

    def test_update_lead_not_owned_returns_404(self, client, db_session):
        broker = make_user(db_session, phone="+919812340007", role=UserRole.broker)
        other_broker = make_user(db_session, phone="+919812340008", role=UserRole.broker)
        property_ = _make_property(db_session, broker=other_broker)
        lead = _make_lead(db_session, property_=property_)

        response = client.patch(
            f"/api/v1/leads/{lead.id}", headers=_auth_headers(broker), json={"status": "contacted"}
        )

        assert response.status_code == 404

    def test_add_note_creates_note_and_updates_last_contacted(self, client, db_session):
        broker = make_user(db_session, phone="+919812340009", role=UserRole.broker, full_name="Vikram Sethi")
        property_ = _make_property(db_session, broker=broker)
        lead = _make_lead(db_session, property_=property_)

        response = client.post(
            f"/api/v1/leads/{lead.id}/notes", headers=_auth_headers(broker), json={"body": "Scheduled a site visit."}
        )

        assert response.status_code == 200
        body = response.json()
        assert body["body"] == "Scheduled a site visit."
        assert body["author_name"] == "Vikram Sethi"

        list_response = client.get("/api/v1/leads", headers=_auth_headers(broker))
        assert list_response.json()[0]["last_contacted_at"] is not None
