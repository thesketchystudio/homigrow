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
        assert body["user"]["phone"] == "+919876540010"

    def test_bad_password_returns_401(self, client, db_session):
        make_user(db_session, phone="+919876540011", password="correct-horse-battery-staple")

        response = client.post(
            "/api/v1/auth/login",
            json={"phone_or_email": "+919876540011", "password": "wrong-password"},
        )

        assert response.status_code == 401
        assert response.json()["detail"]["code"] == "BAD_CREDENTIALS"
