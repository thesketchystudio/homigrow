"""
tests/api/v1/routes/test_users.py

Integration tests for the /api/v1/users/me* routes through the
TestClient — auth wiring and response shape; business-rule edge cases
live in tests/services/test_user_service.py.
"""

from app.core.security import create_access_token
from tests.conftest import make_user


def _auth_headers(user) -> dict:
    return {"Authorization": f"Bearer {create_access_token(user.id, user.role.value)}"}


class TestGetMe:
    def test_returns_the_callers_profile(self, client, db_session):
        user = make_user(db_session, phone="+919876570001", full_name="Asha Rao")

        response = client.get("/api/v1/users/me", headers=_auth_headers(user))

        assert response.status_code == 200
        body = response.json()
        assert body["phone"] == "+919876570001"
        assert body["full_name"] == "Asha Rao"
        assert body["broker_profile"] is None

    def test_without_a_token_returns_401(self, client):
        response = client.get("/api/v1/users/me")

        assert response.status_code == 401


class TestUpdateMe:
    def test_updates_full_name(self, client, db_session):
        user = make_user(db_session, phone="+919876570010")

        response = client.patch(
            "/api/v1/users/me", headers=_auth_headers(user), json={"full_name": "Updated Name"}
        )

        assert response.status_code == 200
        assert response.json()["full_name"] == "Updated Name"

    def test_duplicate_email_returns_409(self, client, db_session):
        make_user(db_session, phone="+919876570011", email="taken@example.com")
        user = make_user(db_session, phone="+919876570012")

        response = client.patch(
            "/api/v1/users/me", headers=_auth_headers(user), json={"email": "taken@example.com"}
        )

        assert response.status_code == 409
        assert response.json()["error"]["code"] == "EMAIL_TAKEN"


class TestChangePasswordRoute:
    def test_correct_current_password_returns_204(self, client, db_session):
        user = make_user(db_session, phone="+919876570020", password="old-password-123")

        response = client.patch(
            "/api/v1/users/me/password",
            headers=_auth_headers(user),
            json={"current_password": "old-password-123", "new_password": "new-password-456"},
        )

        assert response.status_code == 204

    def test_weak_new_password_returns_422(self, client, db_session):
        user = make_user(db_session, phone="+919876570021", password="old-password-123")

        response = client.patch(
            "/api/v1/users/me/password",
            headers=_auth_headers(user),
            json={"current_password": "old-password-123", "new_password": "whatever"},
        )

        assert response.status_code == 422

    def test_wrong_current_password_returns_401(self, client, db_session):
        user = make_user(db_session, phone="+919876570022", password="old-password-123")

        response = client.patch(
            "/api/v1/users/me/password",
            headers=_auth_headers(user),
            json={"current_password": "wrong-password", "new_password": "new-password-456"},
        )

        assert response.status_code == 401
        assert response.json()["error"]["code"] == "BAD_CURRENT_PASSWORD"


class TestSessionsRoutes:
    def test_list_sessions_includes_the_current_login_session(self, client, db_session):
        make_user(db_session, phone="+919876570030", password="correct-horse-battery-staple")
        login_response = client.post(
            "/api/v1/auth/login",
            json={"phone_or_email": "+919876570030", "password": "correct-horse-battery-staple"},
        )
        access_token = login_response.json()["access_token"]

        response = client.get(
            "/api/v1/users/me/sessions", headers={"Authorization": f"Bearer {access_token}"}
        )

        assert response.status_code == 200
        sessions = response.json()
        assert len(sessions) == 1
        assert "id" in sessions[0] and "created_at" in sessions[0]

    def test_revoke_unknown_session_returns_404(self, client, db_session):
        user = make_user(db_session, phone="+919876570031")

        response = client.delete(
            "/api/v1/users/me/sessions/00000000-0000-0000-0000-000000000000",
            headers=_auth_headers(user),
        )

        assert response.status_code == 404

    def test_revoke_all_sessions_returns_204(self, client, db_session):
        user = make_user(db_session, phone="+919876570032")

        response = client.post("/api/v1/users/me/sessions/revoke-all", headers=_auth_headers(user))

        assert response.status_code == 204


class TestDeactivateRoute:
    def test_deactivates_and_blocks_future_login(self, client, db_session):
        make_user(db_session, phone="+919876570040", password="correct-horse-battery-staple")
        login_response = client.post(
            "/api/v1/auth/login",
            json={"phone_or_email": "+919876570040", "password": "correct-horse-battery-staple"},
        )
        access_token = login_response.json()["access_token"]

        response = client.post(
            "/api/v1/users/me/deactivate", headers={"Authorization": f"Bearer {access_token}"}
        )
        assert response.status_code == 204

        relogin = client.post(
            "/api/v1/auth/login",
            json={"phone_or_email": "+919876570040", "password": "correct-horse-battery-staple"},
        )
        assert relogin.status_code == 403
        assert relogin.json()["error"]["code"] == "ACCOUNT_DEACTIVATED"
