"""
tests/services/test_auth_service_unverified_accounts.py

Covers how auth_service treats accounts whose email was never verified:
password login is refused until verification, a fresh signup can take
over an abandoned or squatted unverified account (but never a verified
one or one holding data), and Google sign-in or a password reset hands
such an account to the proven mailbox owner. Together these close the
pre-registration account-takeover path.
"""

import pytest

from app.core.exceptions import AppError
from app.core.security import hash_password, verify_password
from app.models.enums import OTPPurpose, UserRole
from app.models.lead import Lead
from app.models.otp_code import OTPCode
from app.models.property import Property
from app.models.refresh_token import RefreshToken
from app.services import auth_service
from tests.conftest import make_user

PASSWORD = "correct-horse-battery-staple"


def _signup(db_session, **overrides):
    params = {
        "phone": "+919876547001",
        "role": UserRole.client,
        "full_name": "New Owner",
        "email": "owner@example.com",
        "password": PASSWORD,
    }
    params.update(overrides)
    return auth_service.signup(db_session, **params)


def _mock_google(monkeypatch, email: str) -> None:
    monkeypatch.setattr(
        "app.services.auth_service.google_id_token.verify_oauth2_token",
        lambda *args, **kwargs: {"email": email, "email_verified": True, "name": "Real Owner"},
    )


class TestLoginRequiresVerifiedEmail:
    def test_correct_password_on_unverified_account_returns_403_and_sends_otp(self, db_session):
        make_user(db_session, phone="+919876547002", email="half@example.com", is_email_verified=False)

        with pytest.raises(AppError) as exc_info:
            auth_service.login(db_session, "half@example.com", PASSWORD)

        assert exc_info.value.status_code == 403
        assert exc_info.value.code == "EMAIL_NOT_VERIFIED"
        assert db_session.query(OTPCode).filter(OTPCode.email == "half@example.com").count() == 1

    def test_no_session_is_issued_for_unverified_account(self, db_session):
        user = make_user(db_session, phone="+919876547003", email="nosess@example.com", is_email_verified=False)

        with pytest.raises(AppError):
            auth_service.login(db_session, "nosess@example.com", PASSWORD)

        assert db_session.query(RefreshToken).filter(RefreshToken.user_id == user.id).count() == 0

    def test_wrong_password_never_reveals_verification_state(self, db_session):
        make_user(db_session, phone="+919876547004", email="wrongpw@example.com", is_email_verified=False)

        with pytest.raises(AppError) as exc_info:
            auth_service.login(db_session, "wrongpw@example.com", "not-the-password")

        assert exc_info.value.code == "BAD_CREDENTIALS"
        assert db_session.query(OTPCode).filter(OTPCode.email == "wrongpw@example.com").count() == 0

    def test_login_works_again_after_otp_verification(self, db_session):
        make_user(db_session, phone="+919876547005", email="later@example.com", is_email_verified=False)
        with pytest.raises(AppError):
            auth_service.login(db_session, "later@example.com", PASSWORD)

        row = db_session.query(OTPCode).filter(OTPCode.email == "later@example.com").one()
        row.code_hash = hash_password("123456")
        auth_service.verify_otp(db_session, "later@example.com", "123456", OTPPurpose.signup)

        access_token, _, user = auth_service.login(db_session, "later@example.com", PASSWORD)
        assert access_token and user.is_email_verified is True


class TestSignupTakesOverUnverifiedAccounts:
    def test_resignup_with_unverified_email_reuses_the_account_with_new_password(self, db_session):
        squatter = make_user(
            db_session,
            phone="+919876547010",
            email="victim@example.com",
            password="attacker-chosen-password-1",
            is_email_verified=False,
        )
        db_session.add(RefreshToken(user_id=squatter.id, token_hash="old-session", expires_at=squatter.created_at))

        user = _signup(db_session, phone="+919876547011", email="victim@example.com", password="owner-own-password-xyz9")

        assert user.id == squatter.id
        assert user.phone == "+919876547011"
        assert verify_password("owner-own-password-xyz9", user.password_hash)
        assert not verify_password("attacker-chosen-password-1", user.password_hash)
        assert db_session.query(RefreshToken).filter(RefreshToken.user_id == user.id, RefreshToken.revoked_at.is_(None)).count() == 0

    def test_resignup_with_unverified_phone_reuses_the_account(self, db_session):
        squatter = make_user(db_session, phone="+919876547012", email="old@example.com", is_email_verified=False)

        user = _signup(db_session, phone="+919876547012", email="new@example.com")

        assert user.id == squatter.id
        assert user.email == "new@example.com"

    def test_verified_account_still_conflicts(self, db_session):
        make_user(db_session, phone="+919876547013", email="taken@example.com")

        with pytest.raises(AppError) as exc_info:
            _signup(db_session, phone="+919876547014", email="taken@example.com")

        assert exc_info.value.code == "EMAIL_TAKEN"

    def test_unverified_account_holding_a_lead_is_not_taken_over(self, db_session):
        owner = make_user(db_session, phone="+919876547015", role=UserRole.broker, email="legacy@example.com", is_email_verified=False)
        prop = Property(
            broker_id=owner.id, title="t", listing_type="sale", property_type="apartment", price=1,
            address_line="a", locality="l", city="c", state="s", pincode="560001",
        )
        db_session.add(prop)
        db_session.flush()
        db_session.add(Lead(property_id=prop.id, broker_id=owner.id, source="tour_request", contact_name="x", contact_phone="1"))
        db_session.flush()

        with pytest.raises(AppError) as exc_info:
            _signup(db_session, phone="+919876547016", email="legacy@example.com")

        assert exc_info.value.code == "EMAIL_TAKEN"

    def test_phone_and_email_belonging_to_different_accounts_conflict(self, db_session):
        make_user(db_session, phone="+919876547017", email="a@example.com", is_email_verified=False)
        make_user(db_session, phone="+919876547018", email="b@example.com", is_email_verified=False)

        with pytest.raises(AppError) as exc_info:
            _signup(db_session, phone="+919876547017", email="b@example.com")

        assert exc_info.value.code == "PHONE_TAKEN"

    def test_takeover_can_switch_role_from_broker_to_client(self, db_session):
        first = _signup(db_session, phone="+919876547019", email="switch@example.com", role=UserRole.broker, rera_number="RERA-12345")
        assert first.broker_profile is not None

        second = _signup(db_session, phone="+919876547019", email="switch@example.com", role=UserRole.client)

        assert second.id == first.id
        assert second.role == UserRole.client
        db_session.refresh(second)
        assert second.broker_profile is None


class TestGoogleAndResetProveMailboxOwnership:
    def test_google_login_into_unverified_account_removes_the_password_and_sessions(self, db_session, monkeypatch):
        squatted = make_user(
            db_session, phone="+919876547020", email="real@example.com",
            password="attacker-chosen-password-1", is_email_verified=False,
        )
        db_session.add(RefreshToken(user_id=squatted.id, token_hash="attacker-session", expires_at=squatted.created_at))
        _mock_google(monkeypatch, "real@example.com")

        _, _, user = auth_service.google_auth(db_session, "fake-id-token", role=None)

        assert user.id == squatted.id
        assert user.is_email_verified is True
        assert user.password_hash is None
        attacker_session = db_session.query(RefreshToken).filter(RefreshToken.token_hash == "attacker-session").one()
        assert attacker_session.revoked_at is not None

    def test_google_login_into_verified_account_keeps_the_password(self, db_session, monkeypatch):
        make_user(db_session, phone="+919876547021", email="fine@example.com")
        _mock_google(monkeypatch, "fine@example.com")

        _, _, user = auth_service.google_auth(db_session, "fake-id-token", role=None)

        assert user.password_hash is not None

    def test_password_reset_marks_email_verified(self, db_session, monkeypatch):
        user = make_user(db_session, phone="+919876547022", email="reset@example.com", is_email_verified=False)
        sent = {}
        monkeypatch.setattr(
            "app.services.auth_service.email_service.send_password_reset_email",
            lambda to, url: sent.update(url=url),
        )
        auth_service.forgot_password(db_session, "reset@example.com")
        token = sent["url"].split("token=")[1]

        auth_service.reset_password(db_session, token, "a-brand-new-strong-pass-7")

        db_session.refresh(user)
        assert user.is_email_verified is True
