"""
tests/api/v1/routes/test_auth.py

Integration tests for POST /api/v1/auth/signup and /login through the
TestClient — status codes and response shape, not business-rule edge
cases (those live in tests/services/test_auth_service.py).
"""

from tests.conftest import make_user


class TestSignupRoute:
    def test_signup_returns_201_with_user_id(self, client):
        response = client.post(
            "/api/v1/auth/signup",
            json={"phone": "+919876540001", "role": "client", "full_name": "Test User", "password": "s3cure-pass"},
        )

        assert response.status_code == 201
        assert "user_id" in response.json()

    def test_signup_rejects_admin_role_with_422(self, client):
        response = client.post(
            "/api/v1/auth/signup",
            json={"phone": "+919876540002", "role": "admin"},
        )

        assert response.status_code == 422

    def test_duplicate_phone_returns_409(self, client, db_session):
        make_user(db_session, phone="+919876540003")

        response = client.post(
            "/api/v1/auth/signup",
            json={"phone": "+919876540003", "role": "client"},
        )

        assert response.status_code == 409
        assert response.json()["detail"]["code"] == "PHONE_TAKEN"


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
        assert response.json()["detail"]["code"] == "BAD_CREDENTIALS"

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
        assert response.json()["detail"]["code"] == "REFRESH_INVALID"

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
        assert response.json()["detail"]["code"] == "REFRESH_INVALID"


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
