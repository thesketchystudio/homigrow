"""
tests/api/v1/routes/test_auth.py

Integration tests for the /api/v1/auth/* routes through the
TestClient — status codes and response shape, not business-rule edge
cases (those live in tests/services/test_auth_service.py).
"""

import re

from app.core.config import settings
from app.core.security import create_password_reset_token
from app.models.user import User
from tests.conftest import make_user


def _extract_otp_code(caplog, email: str) -> str:
    """Returns the most recently logged OTP for the email — matters when a test issues more than one (e.g. signup, then a later otp/request for another purpose)."""
    for record in reversed(caplog.records):
        match = re.search(rf"OTP for {re.escape(email)} \(\w+\): (\d{{6}})", record.message)
        if match:
            return match.group(1)
    raise AssertionError(f"No OTP logged for {email}")


class TestSignupRoute:
    def test_signup_returns_201_with_user_id(self, client):
        response = client.post(
            "/api/v1/auth/signup",
            json={
                "phone": "+919876540001",
                "role": "client",
                "full_name": "Test User",
                "email": "testuser1@example.com",
                "password": "s3cure-pass",
            },
        )

        assert response.status_code == 201
        assert "user_id" in response.json()

    def test_signup_rejects_admin_role_with_422(self, client):
        response = client.post(
            "/api/v1/auth/signup",
            json={"phone": "+919876540002", "role": "admin", "email": "admin2@example.com"},
        )

        assert response.status_code == 422

    def test_signup_without_email_returns_422(self, client):
        response = client.post(
            "/api/v1/auth/signup",
            json={"phone": "+919876540099", "role": "client"},
        )

        assert response.status_code == 422

    def test_duplicate_phone_returns_409(self, client, db_session):
        make_user(db_session, phone="+919876540003")

        response = client.post(
            "/api/v1/auth/signup",
            json={"phone": "+919876540003", "role": "client", "email": "dupphone3@example.com"},
        )

        assert response.status_code == 409
        assert response.json()["error"]["code"] == "PHONE_TAKEN"

    def test_duplicate_email_returns_409(self, client, db_session):
        make_user(db_session, phone="+919876540005", email="dupemail5@example.com")

        response = client.post(
            "/api/v1/auth/signup",
            json={"phone": "+919876540006", "role": "client", "email": "dupemail5@example.com"},
        )

        assert response.status_code == 409
        assert response.json()["error"]["code"] == "EMAIL_TAKEN"

    def test_weak_password_returns_422(self, client):
        response = client.post(
            "/api/v1/auth/signup",
            json={"phone": "+919876540004", "role": "client", "email": "weakpass4@example.com", "password": "whatever"},
        )

        assert response.status_code == 422

    def test_broker_signup_accepts_verification_details(self, client):
        response = client.post(
            "/api/v1/auth/signup",
            json={
                "phone": "+919876540007",
                "role": "broker",
                "full_name": "Test Broker",
                "email": "testbroker7@example.com",
                "password": "s3cure-pass",
                "company_name": "Test Realty",
                "rera_number": "RERA-KA-11223",
                "service_area": "Bengaluru",
            },
        )

        assert response.status_code == 201

    def test_short_rera_number_returns_422(self, client):
        response = client.post(
            "/api/v1/auth/signup",
            json={
                "phone": "+919876540008",
                "role": "broker",
                "email": "shortrera8@example.com",
                "password": "s3cure-pass",
                "rera_number": "AB1",
            },
        )

        assert response.status_code == 422


class TestOtpRoutes:
    def test_verify_route_flips_is_email_verified_and_logs_the_user_in(self, client, db_session, caplog):
        with caplog.at_level("INFO"):
            signup_response = client.post(
                "/api/v1/auth/signup",
                json={
                    "phone": "+919876540060",
                    "role": "client",
                    "email": "otproute@example.com",
                    "password": "s3cure-pass",
                },
            )
        user_id = signup_response.json()["user_id"]
        code = _extract_otp_code(caplog, "otproute@example.com")

        response = client.post(
            "/api/v1/auth/otp/verify",
            json={"email": "otproute@example.com", "code": code, "purpose": "signup"},
        )

        assert response.status_code == 200
        body = response.json()
        assert body["access_token"]
        assert body["user"]["id"] == user_id
        assert "refresh_token" in response.cookies
        user = db_session.query(User).filter(User.id == user_id).first()
        assert user.is_email_verified is True

    def test_verify_route_broker_verification_purpose_still_returns_204(self, client, db_session, caplog):
        """broker_verification also flips is_email_verified but must not mint a session — that purpose fires from an already-logged-in broker's profile, not a fresh signup."""
        with caplog.at_level("INFO"):
            client.post(
                "/api/v1/auth/signup",
                json={
                    "phone": "+919876540062",
                    "role": "broker",
                    "email": "brokerverifyroute@example.com",
                    "password": "s3cure-pass",
                },
            )
            client.post(
                "/api/v1/auth/otp/request",
                json={"email": "brokerverifyroute@example.com", "purpose": "broker_verification"},
            )
        code = _extract_otp_code(caplog, "brokerverifyroute@example.com")

        response = client.post(
            "/api/v1/auth/otp/verify",
            json={"email": "brokerverifyroute@example.com", "code": code, "purpose": "broker_verification"},
        )

        assert response.status_code == 204

    def test_verify_route_wrong_code_returns_401(self, client):
        client.post(
            "/api/v1/auth/signup",
            json={
                "phone": "+919876540061",
                "role": "client",
                "email": "otpwrong@example.com",
                "password": "s3cure-pass",
            },
        )

        response = client.post(
            "/api/v1/auth/otp/verify",
            json={"email": "otpwrong@example.com", "code": "000000", "purpose": "signup"},
        )

        assert response.status_code == 401
        assert response.json()["error"]["code"] == "OTP_INVALID"

    def test_request_route_returns_204(self, client):
        response = client.post(
            "/api/v1/auth/otp/request",
            json={"email": "otpresend@example.com", "purpose": "signup"},
        )

        assert response.status_code == 204


class TestLoginRoute:
    def test_login_returns_access_token_and_user(self, client, db_session):
        make_user(db_session, phone="+919876540010", password="correct-horse-battery-staple")

        response = client.post(
            "/api/v1/auth/login",
            json={"phone_or_email": "+919876540010", "password": "correct-horse-battery-staple"},
        )

        assert response.status_code == 200
        body = response.json()
        assert body["access_token"]
        assert body["token_type"] == "bearer"
        assert body["expires_in"] > 0
        assert body["user"]["phone"] == "+919876540010"

    def test_bad_password_returns_401(self, client, db_session):
        make_user(db_session, phone="+919876540011", password="correct-horse-battery-staple")

        response = client.post(
            "/api/v1/auth/login",
            json={"phone_or_email": "+919876540011", "password": "wrong-password"},
        )

        assert response.status_code == 401
        assert response.json()["error"]["code"] == "BAD_CREDENTIALS"

    def test_login_sets_an_httponly_refresh_cookie(self, client, db_session):
        make_user(db_session, phone="+919876540012", password="correct-horse-battery-staple")

        response = client.post(
            "/api/v1/auth/login",
            json={"phone_or_email": "+919876540012", "password": "correct-horse-battery-staple"},
        )

        set_cookie = response.headers.get("set-cookie", "")
        assert "refresh_token=" in set_cookie
        assert "httponly" in set_cookie.lower()
        assert "samesite=lax" in set_cookie.lower()
        assert client.cookies.get("refresh_token") is not None


class TestGoogleAuthRoute:
    def _mock_claims(self, monkeypatch, email: str, verified: bool = True, name: str = "Test User") -> None:
        monkeypatch.setattr(
            "app.services.auth_service.google_id_token.verify_oauth2_token",
            lambda *args, **kwargs: {"email": email, "email_verified": verified, "name": name},
        )

    def test_existing_account_logs_in_and_sets_refresh_cookie(self, client, db_session, monkeypatch):
        make_user(db_session, phone="+919876540030", email="carlos@example.com")
        self._mock_claims(monkeypatch, "carlos@example.com")

        response = client.post("/api/v1/auth/google", json={"id_token": "fake-id-token"})

        assert response.status_code == 200
        assert response.json()["user"]["email"] == "carlos@example.com"
        assert "refresh_token=" in response.headers.get("set-cookie", "")

    def test_no_account_and_no_role_returns_404(self, client, monkeypatch):
        self._mock_claims(monkeypatch, "brandnew@example.com")

        response = client.post("/api/v1/auth/google", json={"id_token": "fake-id-token"})

        assert response.status_code == 404
        assert response.json()["error"]["code"] == "GOOGLE_ACCOUNT_NOT_FOUND"

    def test_no_account_with_role_creates_one(self, client, monkeypatch):
        self._mock_claims(monkeypatch, "brandnewclient@example.com", name="Nina Rao")

        response = client.post("/api/v1/auth/google", json={"id_token": "fake-id-token", "role": "client"})

        assert response.status_code == 200
        body = response.json()
        assert body["user"]["email"] == "brandnewclient@example.com"
        assert body["user"]["full_name"] == "Nina Rao"

    def test_admin_role_is_rejected_with_422(self, client, monkeypatch):
        self._mock_claims(monkeypatch, "wouldbeadmin@example.com")

        response = client.post("/api/v1/auth/google", json={"id_token": "fake-id-token", "role": "admin"})

        assert response.status_code == 422


class TestRefreshRoute:
    def test_refresh_rotates_the_cookie_and_returns_a_new_access_token(self, client, db_session):
        make_user(db_session, phone="+919876540020", password="correct-horse-battery-staple")
        login_response = client.post(
            "/api/v1/auth/login",
            json={"phone_or_email": "+919876540020", "password": "correct-horse-battery-staple"},
        )
        original_access_token = login_response.json()["access_token"]
        original_refresh_cookie = client.cookies.get("refresh_token")

        refresh_response = client.post("/api/v1/auth/refresh")

        assert refresh_response.status_code == 200
        body = refresh_response.json()
        assert body["access_token"]
        assert body["access_token"] != original_access_token
        assert client.cookies.get("refresh_token") != original_refresh_cookie

    def test_refresh_without_a_cookie_returns_401(self, client):
        response = client.post("/api/v1/auth/refresh")

        assert response.status_code == 401
        assert response.json()["error"]["code"] == "REFRESH_INVALID"

    def test_replaying_a_rotated_refresh_cookie_returns_401(self, client, db_session):
        make_user(db_session, phone="+919876540021", password="correct-horse-battery-staple")
        client.post(
            "/api/v1/auth/login",
            json={"phone_or_email": "+919876540021", "password": "correct-horse-battery-staple"},
        )
        stale_refresh_cookie = client.cookies.get("refresh_token")

        client.post("/api/v1/auth/refresh")  # rotates the cookie once

        client.cookies.set("refresh_token", stale_refresh_cookie)
        response = client.post("/api/v1/auth/refresh")

        assert response.status_code == 401
        assert response.json()["error"]["code"] == "REFRESH_INVALID"

    def test_matching_origin_header_is_allowed(self, client, db_session):
        make_user(db_session, phone="+919876540023", password="correct-horse-battery-staple")
        client.post(
            "/api/v1/auth/login",
            json={"phone_or_email": "+919876540023", "password": "correct-horse-battery-staple"},
        )

        response = client.post("/api/v1/auth/refresh", headers={"Origin": settings.FRONTEND_ORIGIN})

        assert response.status_code == 200

    def test_mismatched_origin_header_returns_401(self, client, db_session):
        make_user(db_session, phone="+919876540024", password="correct-horse-battery-staple")
        client.post(
            "/api/v1/auth/login",
            json={"phone_or_email": "+919876540024", "password": "correct-horse-battery-staple"},
        )

        response = client.post("/api/v1/auth/refresh", headers={"Origin": "https://evil.example.com"})

        assert response.status_code == 401
        assert response.json()["error"]["code"] == "REFRESH_INVALID"


class TestLogoutRoute:
    def test_logout_clears_the_cookie_and_revokes_the_session(self, client, db_session):
        make_user(db_session, phone="+919876540030", password="correct-horse-battery-staple")
        client.post(
            "/api/v1/auth/login",
            json={"phone_or_email": "+919876540030", "password": "correct-horse-battery-staple"},
        )

        response = client.post("/api/v1/auth/logout")
        assert response.status_code == 204

        # The now-revoked cookie can no longer refresh a session.
        refresh_response = client.post("/api/v1/auth/refresh")
        assert refresh_response.status_code == 401

    def test_logout_without_a_cookie_is_a_no_op_204(self, client):
        response = client.post("/api/v1/auth/logout")

        assert response.status_code == 204


class TestForgotPasswordRoute:
    def test_always_returns_204_known_or_unknown_email(self, client, db_session):
        make_user(db_session, phone="+919876540040", email="anon@example.com")

        known = client.post("/api/v1/auth/password/forgot", json={"email": "anon@example.com"})
        unknown = client.post("/api/v1/auth/password/forgot", json={"email": "nobody@example.com"})

        assert known.status_code == 204
        assert unknown.status_code == 204


class TestResetPasswordRoute:
    def test_valid_token_returns_204_and_the_new_password_logs_in(self, client, db_session):
        user = make_user(db_session, phone="+919876540041", password="old-password-123")
        token = create_password_reset_token(user.id, user.password_hash, 30)

        response = client.post(
            "/api/v1/auth/password/reset",
            json={"token": token, "new_password": "new-password-456"},
        )
        assert response.status_code == 204

        login_response = client.post(
            "/api/v1/auth/login",
            json={"phone_or_email": "+919876540041", "password": "new-password-456"},
        )
        assert login_response.status_code == 200

    def test_invalid_token_returns_410(self, client):
        response = client.post(
            "/api/v1/auth/password/reset",
            json={"token": "not-a-real-token", "new_password": "new-password-456"},
        )

        assert response.status_code == 410
        assert response.json()["error"]["code"] == "TOKEN_EXPIRED"

    def test_weak_new_password_returns_422(self, client, db_session):
        user = make_user(db_session, phone="+919876540042", password="old-password-123")
        token = create_password_reset_token(user.id, user.password_hash, 30)

        response = client.post(
            "/api/v1/auth/password/reset",
            json={"token": token, "new_password": "whatever"},
        )

        assert response.status_code == 422


class TestAuthRateLimiting:
    def test_sixth_login_request_within_a_minute_returns_429(self, client, db_session):
        make_user(db_session, phone="+919876540050", password="correct-horse-battery-staple")

        for _ in range(5):
            response = client.post(
                "/api/v1/auth/login",
                json={"phone_or_email": "+919876540050", "password": "wrong-password"},
            )
            assert response.status_code == 401

        sixth = client.post(
            "/api/v1/auth/login",
            json={"phone_or_email": "+919876540050", "password": "wrong-password"},
        )

        assert sixth.status_code == 429
        assert sixth.json()["error"]["code"] == "RATE_LIMITED"
