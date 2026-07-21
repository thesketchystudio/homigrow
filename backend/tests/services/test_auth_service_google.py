"""
tests/services/test_auth_service_google.py

Covers app/services/auth_service.google_auth(): existing-account login
(role ignored), new-account creation (only when a role is supplied),
the login-page "no account, no role" rejection, and token/claim
validation. google_id_token.verify_oauth2_token is monkeypatched —
these tests never contact Google's real servers.
"""

import pytest

from app.core.exceptions import AppError
from app.models.broker_profile import BrokerProfile
from app.models.enums import UserRole
from app.models.refresh_token import RefreshToken
from app.models.user import User
from app.services import auth_service
from tests.conftest import make_user


def _mock_google_claims(monkeypatch, claims: dict) -> None:
    monkeypatch.setattr(
        "app.services.auth_service.google_id_token.verify_oauth2_token",
        lambda *args, **kwargs: claims,
    )


def _valid_claims(email: str, name: str = "Ravi Shankar") -> dict:
    return {"email": email, "email_verified": True, "name": name}


class TestGoogleAuthExistingAccount:
    def test_matching_email_logs_in_and_ignores_role(self, db_session, monkeypatch):
        user = make_user(db_session, phone="+919876543250", email="ravi@example.com", role=UserRole.client)
        _mock_google_claims(monkeypatch, _valid_claims("ravi@example.com"))

        access_token, refresh_token, logged_in_user = auth_service.google_auth(
            db_session, "fake-id-token", role=UserRole.broker
        )

        assert access_token and refresh_token
        assert logged_in_user.id == user.id
        assert logged_in_user.role == UserRole.client  # role param never changes an existing account

    def test_issues_a_refresh_token_row(self, db_session, monkeypatch):
        user = make_user(db_session, phone="+919876543251", email="asha@example.com")
        _mock_google_claims(monkeypatch, _valid_claims("asha@example.com"))

        _, raw_refresh_token, _ = auth_service.google_auth(db_session, "fake-id-token", role=None)

        row = db_session.query(RefreshToken).filter(RefreshToken.user_id == user.id).first()
        assert row is not None

    def test_deactivated_account_raises_403(self, db_session, monkeypatch):
        make_user(db_session, phone="+919876543252", email="kiran@example.com", is_active=False)
        _mock_google_claims(monkeypatch, _valid_claims("kiran@example.com"))

        with pytest.raises(AppError) as exc_info:
            auth_service.google_auth(db_session, "fake-id-token", role=None)

        assert exc_info.value.status_code == 403
        assert exc_info.value.code == "ACCOUNT_DEACTIVATED"


class TestGoogleAuthNewAccount:
    def test_no_role_raises_404_and_creates_nothing(self, db_session, monkeypatch):
        _mock_google_claims(monkeypatch, _valid_claims("newperson@example.com"))

        with pytest.raises(AppError) as exc_info:
            auth_service.google_auth(db_session, "fake-id-token", role=None)

        assert exc_info.value.status_code == 404
        assert exc_info.value.code == "GOOGLE_ACCOUNT_NOT_FOUND"
        assert db_session.query(User).filter(User.email == "newperson@example.com").first() is None

    def test_client_role_creates_a_usable_account(self, db_session, monkeypatch):
        _mock_google_claims(monkeypatch, _valid_claims("newclient@example.com", name="Priya Nair"))

        access_token, refresh_token, user = auth_service.google_auth(
            db_session, "fake-id-token", role=UserRole.client
        )

        assert access_token and refresh_token
        assert user.email == "newclient@example.com"
        assert user.full_name == "Priya Nair"
        assert user.phone is None
        assert user.password_hash is None
        assert user.is_email_verified is True
        assert user.role == UserRole.client

    def test_broker_role_also_creates_a_broker_profile(self, db_session, monkeypatch):
        _mock_google_claims(monkeypatch, _valid_claims("newbroker@example.com"))

        _, _, user = auth_service.google_auth(db_session, "fake-id-token", role=UserRole.broker)

        profile = db_session.query(BrokerProfile).filter(BrokerProfile.user_id == user.id).first()
        assert profile is not None

    def test_admin_role_is_rejected_by_the_schema_not_the_service(self):
        """
        The service itself has no admin guard — GoogleAuthRequest's
        field_validator (same pattern as SignupRequest) is what blocks
        admin creation before this function is ever called.
        """
        from app.schemas.auth import GoogleAuthRequest

        with pytest.raises(ValueError):
            GoogleAuthRequest(id_token="fake-id-token", role=UserRole.admin)


class TestGoogleAuthTokenValidation:
    def test_invalid_token_raises_401(self, db_session, monkeypatch):
        def _raise(*args, **kwargs):
            raise ValueError("Token used too early")

        monkeypatch.setattr("app.services.auth_service.google_id_token.verify_oauth2_token", _raise)

        with pytest.raises(AppError) as exc_info:
            auth_service.google_auth(db_session, "garbage-token", role=None)

        assert exc_info.value.status_code == 401
        assert exc_info.value.code == "GOOGLE_TOKEN_INVALID"

    def test_unverified_email_raises_401(self, db_session, monkeypatch):
        _mock_google_claims(monkeypatch, {"email": "unverified@example.com", "email_verified": False})

        with pytest.raises(AppError) as exc_info:
            auth_service.google_auth(db_session, "fake-id-token", role=UserRole.client)

        assert exc_info.value.status_code == 401
        assert exc_info.value.code == "GOOGLE_TOKEN_INVALID"
        assert db_session.query(User).filter(User.email == "unverified@example.com").first() is None
