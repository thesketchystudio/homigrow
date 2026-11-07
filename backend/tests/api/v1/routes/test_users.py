"""
tests/api/v1/routes/test_users.py

Integration tests for the /api/v1/users/me* routes through the
TestClient — auth wiring and response shape; business-rule edge cases
live in tests/services/test_user_service.py.
"""

from app.core.security import create_access_token
from app.models.broker_profile import BrokerProfile
from app.models.enums import UserRole
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
        assert body["created_at"] is not None

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

    def test_updates_broker_profile_fields(self, client, db_session):
        broker = make_user(db_session, phone="+919876570013", role=UserRole.broker)
        db_session.add(BrokerProfile(user_id=broker.id))
        db_session.flush()

        response = client.patch(
            "/api/v1/users/me",
            headers=_auth_headers(broker),
            json={"broker_profile": {"bio": "8 years in residential real estate.", "specializations": ["Residential", "Luxury Villas"]}},
        )

        assert response.status_code == 200
        body = response.json()["broker_profile"]
        assert body["bio"] == "8 years in residential real estate."
        assert body["specializations"] == ["Residential", "Luxury Villas"]


class TestChangePasswordRoute:
    def test_correct_current_password_returns_a_fresh_session(self, client, db_session):
        user = make_user(db_session, phone="+919876570020", password="old-password-123")

        response = client.patch(
            "/api/v1/users/me/password",
            headers=_auth_headers(user),
            json={"current_password": "old-password-123", "new_password": "new-password-456"},
        )

        assert response.status_code == 200
        assert response.json()["access_token"]
        assert "refresh_token" in response.headers.get("set-cookie", "")

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


class TestEmailChangeRoutes:
    def test_patch_me_no_longer_changes_the_email(self, client, db_session):
        user = make_user(db_session, phone="+919876570101", email="keep@example.com")

        response = client.patch("/api/v1/users/me", headers=_auth_headers(user), json={"email": "hijack@example.com"})

        assert response.status_code == 200
        assert response.json()["email"] == "keep@example.com"

    def test_profile_reports_whether_the_account_has_a_password(self, client, db_session):
        with_password = make_user(db_session, phone="+919876570102")
        without_password = make_user(db_session, phone="+919876570103", password=None)

        assert client.get("/api/v1/users/me", headers=_auth_headers(with_password)).json()["has_password"] is True
        assert client.get("/api/v1/users/me", headers=_auth_headers(without_password)).json()["has_password"] is False

    def test_full_flow_swaps_the_email(self, client, db_session, caplog):
        user = make_user(db_session, phone="+919876570104", email="before@example.com", password="old-password-123")
        headers = _auth_headers(user)

        with caplog.at_level("INFO"):
            requested = client.post(
                "/api/v1/users/me/email-change",
                headers=headers,
                json={"new_email": "after@example.com", "current_password": "old-password-123"},
            )
        assert requested.status_code == 204
        code = next(
            record.message.rsplit(": ", 1)[1]
            for record in caplog.records
            if "OTP for after@example.com" in record.message
        )

        confirmed = client.post(
            "/api/v1/users/me/email-change/confirm",
            headers=headers,
            json={"new_email": "after@example.com", "code": code},
        )

        assert confirmed.status_code == 200
        assert confirmed.json()["email"] == "after@example.com"
        assert confirmed.json()["is_email_verified"] is True

    def test_wrong_password_is_refused_with_401(self, client, db_session):
        user = make_user(db_session, phone="+919876570105", email="guard@example.com", password="old-password-123")

        response = client.post(
            "/api/v1/users/me/email-change",
            headers=_auth_headers(user),
            json={"new_email": "other@example.com", "current_password": "wrong-password"},
        )

        assert response.status_code == 401
        assert response.json()["error"]["code"] == "BAD_CURRENT_PASSWORD"

    def test_malformed_new_email_is_rejected(self, client, db_session):
        user = make_user(db_session, phone="+919876570106", email="valid@example.com", password="old-password-123")

        response = client.post(
            "/api/v1/users/me/email-change",
            headers=_auth_headers(user),
            json={"new_email": "not-an-email", "current_password": "old-password-123"},
        )

        assert response.status_code == 422

    def test_endpoints_require_authentication(self, client):
        assert client.post("/api/v1/users/me/email-change", json={"new_email": "a@example.com"}).status_code == 401
        assert (
            client.post("/api/v1/users/me/email-change/confirm", json={"new_email": "a@example.com", "code": "123456"}).status_code
            == 401
        )


class TestPasswordChangeSessions:
    def test_other_sessions_stop_working_after_a_password_change(self, client, db_session):
        make_user(db_session, phone="+919876570110", password="old-password-123")
        first = client.post("/api/v1/auth/login", json={"phone_or_email": "+919876570110", "password": "old-password-123"})
        stolen_cookie = first.cookies.get("refresh_token")
        token = first.json()["access_token"]

        changed = client.patch(
            "/api/v1/users/me/password",
            headers={"Authorization": f"Bearer {token}"},
            json={"current_password": "old-password-123", "new_password": "new-password-456"},
        )
        assert changed.status_code == 200

        client.cookies.clear()
        client.cookies.set("refresh_token", stolen_cookie, path="/api/v1/auth")
        replay = client.post("/api/v1/auth/refresh")
        assert replay.status_code == 401
