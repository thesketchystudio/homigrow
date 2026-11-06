"""
tests/api/v1/routes/test_input_validation.py

Covers request validation added for hostile or malformed input: canonical
Indian mobile numbers (so one number cannot register twice by spelling it
differently), email shape, http(s)-only tour links and size caps on
amenities and descriptions.
"""

import pytest
from pydantic import ValidationError

from app.models.user import User
from app.schemas.properties import PropertyCreateRequest, PropertyUpdateRequest
from tests.api.v1.routes.test_broker_properties import _VALID_PAYLOAD

_PASSWORD = "s3cure-horse-battery-9"


def _signup(client, phone, email):
    return client.post(
        "/api/v1/auth/signup",
        json={"phone": phone, "role": "client", "email": email, "password": _PASSWORD},
    )


class TestPhoneCanonicalisation:
    def test_ten_digit_signup_is_stored_in_plus_91_form(self, client, db_session):
        assert _signup(client, "9876540101", "canon1@example.com").status_code == 201

        user = db_session.query(User).filter(User.email == "canon1@example.com").one()
        assert user.phone == "+919876540101"

    def test_same_number_spelled_differently_is_a_duplicate(self, client, db_session):
        assert _signup(client, "9876540102", "canon2a@example.com").status_code == 201
        # An unverified account can be claimed by a new signup, so verify it first.
        db_session.query(User).filter(User.email == "canon2a@example.com").one().is_email_verified = True
        db_session.flush()

        for spelling in ("+919876540102", "98765 40102", "09876540102"):
            response = _signup(client, spelling, "canon2b@example.com")
            assert response.status_code == 409
            assert response.json()["error"]["code"] == "PHONE_TAKEN"

    @pytest.mark.parametrize("phone", ["12345", "abcdefghij", "1111111111", "5876540103", ""])
    def test_invalid_phone_is_rejected(self, client, phone):
        response = _signup(client, phone, "canon3@example.com")
        assert response.status_code == 422
        assert "phone" in response.json()["error"]["fields"]

    def test_login_accepts_any_spelling_of_the_stored_number(self, client):
        assert _signup(client, "9876540104", "canon4@example.com").status_code == 201
        # signup leaves the account unverified, which login reports with its own code.
        for spelling in ("9876540104", "+919876540104", "98765-40104"):
            response = client.post("/api/v1/auth/login", json={"phone_or_email": spelling, "password": _PASSWORD})
            assert response.json()["error"]["code"] == "EMAIL_NOT_VERIFIED"


class TestEmailFormat:
    @pytest.mark.parametrize("email", ["abc", "a@b", "a b@example.com", "@example.com", "a@@example.com", ""])
    def test_malformed_email_is_rejected_at_signup(self, client, email):
        response = _signup(client, "9876540105", email)
        assert response.status_code == 422
        assert "email" in response.json()["error"]["fields"]

    @pytest.mark.parametrize("email", ["a@example.com", "first.last+tag@sub.example.co.in", "broker@homigrow.local"])
    def test_reasonable_emails_are_accepted(self, client, email):
        assert _signup(client, "9876540106", email).status_code == 201

    def test_malformed_email_is_rejected_on_otp_and_forgot_password(self, client):
        assert client.post("/api/v1/auth/otp/request", json={"email": "nope", "purpose": "signup"}).status_code == 422
        assert client.post("/api/v1/auth/password/forgot", json={"email": "nope"}).status_code == 422


class TestPropertyInputLimits:
    @pytest.mark.parametrize("url", ["javascript:alert(1)", "data:text/html,<script>", "ftp://example.com/x", "example.com", "http://"])
    def test_non_http_tour_links_are_rejected(self, url):
        with pytest.raises(ValidationError):
            PropertyCreateRequest.model_validate({**_VALID_PAYLOAD, "virtual_tour_url": url})
        with pytest.raises(ValidationError):
            PropertyUpdateRequest.model_validate({"virtual_tour_url": url})

    def test_https_tour_link_is_accepted(self):
        payload = PropertyCreateRequest.model_validate({**_VALID_PAYLOAD, "virtual_tour_url": "https://example.com/tour"})
        assert payload.virtual_tour_url == "https://example.com/tour"

    def test_too_many_amenities_are_rejected(self):
        with pytest.raises(ValidationError):
            PropertyCreateRequest.model_validate({**_VALID_PAYLOAD, "amenities": [f"a{i}" for i in range(51)]})

    def test_overlong_or_empty_amenity_is_rejected(self):
        with pytest.raises(ValidationError):
            PropertyCreateRequest.model_validate({**_VALID_PAYLOAD, "amenities": ["x" * 61]})
        with pytest.raises(ValidationError):
            PropertyUpdateRequest.model_validate({"amenities": [""]})

    def test_fifty_amenities_within_limits_are_accepted(self):
        payload = PropertyCreateRequest.model_validate({**_VALID_PAYLOAD, "amenities": ["x" * 60] * 50})
        assert len(payload.amenities) == 50

    def test_single_enormous_word_description_is_rejected(self):
        with pytest.raises(ValidationError):
            PropertyCreateRequest.model_validate({**_VALID_PAYLOAD, "description": "a" * 5001})
        with pytest.raises(ValidationError):
            PropertyUpdateRequest.model_validate({"description": "a" * 5001})
