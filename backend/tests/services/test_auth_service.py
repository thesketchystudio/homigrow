"""
tests/services/test_auth_service.py

Covers signup (happy path, broker-profile creation, duplicate phone)
and login (happy path, bad credentials, lockout boundary) per the
P2 auth suite priority in 12_Testing.md.
"""

from datetime import datetime, timedelta, timezone

import pytest

from app.core.exceptions import AppError
from app.core.security import hash_refresh_token
from app.models.broker_profile import BrokerProfile
from app.models.enums import UserRole
from app.models.otp_code import OTPCode
from app.models.refresh_token import RefreshToken
from app.models.user import User
from app.services import auth_service
from tests.conftest import make_user


class TestSignup:
    def test_creates_a_client_user(self, db_session):
        user = auth_service.signup(
            db_session,
            phone="+919876543210",
            role=UserRole.client,
            full_name="Asha Rao",
            email="asha@example.com",
            password="s3cure-pass",
        )

        assert user.id is not None
        assert user.role == UserRole.client
        assert user.password_hash is not None

    def test_broker_role_also_creates_a_broker_profile(self, db_session):
        user = auth_service.signup(
            db_session,
            phone="+919876543211",
            role=UserRole.broker,
            full_name="Vikram Shah",
            email=None,
            password="s3cure-pass",
        )

        profile = db_session.query(BrokerProfile).filter(BrokerProfile.user_id == user.id).first()
        assert profile is not None

    def test_client_role_does_not_create_a_broker_profile(self, db_session):
        user = auth_service.signup(
            db_session, phone="+919876543212", role=UserRole.client, full_name=None, email=None, password=None
        )

        assert db_session.query(BrokerProfile).filter(BrokerProfile.user_id == user.id).first() is None

    def test_issues_a_signup_otp(self, db_session):
        user = auth_service.signup(
            db_session, phone="+919876543213", role=UserRole.client, full_name=None, email=None, password=None
        )

        otp = db_session.query(OTPCode).filter(OTPCode.phone == user.phone).first()
        assert otp is not None
        assert otp.purpose.value == "signup"

    def test_duplicate_phone_raises_409(self, db_session):
        make_user(db_session, phone="+919876543214")

        with pytest.raises(AppError) as exc_info:
            auth_service.signup(
                db_session,
                phone="+919876543214",
                role=UserRole.client,
                full_name=None,
                email=None,
                password="whatever",
            )

        assert exc_info.value.status_code == 409
        assert exc_info.value.code == "PHONE_TAKEN"


class TestLogin:
    def test_correct_credentials_returns_a_token_and_user(self, db_session):
        user = make_user(db_session, phone="+919876543220", password="correct-horse-battery-staple")

        access_token, refresh_token, logged_in_user = auth_service.login(
            db_session, "+919876543220", "correct-horse-battery-staple"
        )

        assert isinstance(access_token, str) and access_token
        assert isinstance(refresh_token, str) and refresh_token
        assert logged_in_user.id == user.id

    def test_login_by_email_also_works(self, db_session):
        make_user(db_session, phone="+919876543221", email="ravi@example.com", password="correct-horse-battery-staple")

        access_token, _, _ = auth_service.login(db_session, "ravi@example.com", "correct-horse-battery-staple")

        assert access_token

    def test_issues_a_refresh_token_row(self, db_session):
        user = make_user(db_session, phone="+919876543226", password="correct-horse-battery-staple")

        _, raw_refresh_token, _ = auth_service.login(db_session, "+919876543226", "correct-horse-battery-staple")

        row = db_session.query(RefreshToken).filter(RefreshToken.user_id == user.id).first()
        assert row is not None
        assert row.revoked_at is None
        assert row.token_hash == hash_refresh_token(raw_refresh_token)

    def test_unknown_identifier_raises_401(self, db_session):
        with pytest.raises(AppError) as exc_info:
            auth_service.login(db_session, "+919999999999", "whatever")

        assert exc_info.value.status_code == 401
        assert exc_info.value.code == "BAD_CREDENTIALS"

    def test_wrong_password_raises_401_and_increments_counter(self, db_session):
        user = make_user(db_session, phone="+919876543222", password="correct-horse-battery-staple")

        with pytest.raises(AppError) as exc_info:
            auth_service.login(db_session, "+919876543222", "wrong-password")

        assert exc_info.value.status_code == 401
        db_session.refresh(user)
        assert user.failed_login_attempts == 1

    def test_fifth_consecutive_failure_locks_the_account(self, db_session):
        make_user(db_session, phone="+919876543223", password="correct-horse-battery-staple")

        for _ in range(4):
            with pytest.raises(AppError) as exc_info:
                auth_service.login(db_session, "+919876543223", "wrong-password")
            assert exc_info.value.status_code == 401

        # 5th failure crosses the threshold and locks the account.
        with pytest.raises(AppError) as exc_info:
            auth_service.login(db_session, "+919876543223", "wrong-password")
        assert exc_info.value.status_code == 401

        locked_user = db_session.query(User).filter(User.phone == "+919876543223").first()
        assert locked_user.failed_login_attempts == 5
        assert locked_user.locked_until is not None
        assert locked_user.locked_until > datetime.now(timezone.utc)

    def test_locked_account_rejects_even_correct_password_with_423(self, db_session):
        user = make_user(db_session, phone="+919876543224", password="correct-horse-battery-staple")
        user.failed_login_attempts = 5
        user.locked_until = datetime.now(timezone.utc) + timedelta(minutes=15)
        db_session.flush()

        with pytest.raises(AppError) as exc_info:
            auth_service.login(db_session, "+919876543224", "correct-horse-battery-staple")

        assert exc_info.value.status_code == 423
        assert exc_info.value.code == "ACCOUNT_LOCKED"

    def test_successful_login_resets_the_failure_counter(self, db_session):
        user = make_user(db_session, phone="+919876543225", password="correct-horse-battery-staple")
        user.failed_login_attempts = 3
        db_session.flush()

        auth_service.login(db_session, "+919876543225", "correct-horse-battery-staple")

        db_session.refresh(user)
        assert user.failed_login_attempts == 0
        assert user.locked_until is None


class TestRefresh:
    def test_rotates_the_token_and_returns_a_new_pair(self, db_session):
        user = make_user(db_session, phone="+919876543230", password="correct-horse-battery-staple")
        _, raw_refresh_token, _ = auth_service.login(db_session, "+919876543230", "correct-horse-battery-staple")

        access_token, new_raw_refresh_token, refreshed_user = auth_service.refresh(db_session, raw_refresh_token)

        assert access_token
        assert new_raw_refresh_token != raw_refresh_token
        assert refreshed_user.id == user.id

        old_row = (
            db_session.query(RefreshToken)
            .filter(RefreshToken.token_hash == hash_refresh_token(raw_refresh_token))
            .first()
        )
        assert old_row.revoked_at is not None

        new_row = (
            db_session.query(RefreshToken)
            .filter(RefreshToken.token_hash == hash_refresh_token(new_raw_refresh_token))
            .first()
        )
        assert new_row is not None
        assert new_row.revoked_at is None

    def test_missing_token_raises_401(self, db_session):
        with pytest.raises(AppError) as exc_info:
            auth_service.refresh(db_session, None)

        assert exc_info.value.status_code == 401
        assert exc_info.value.code == "REFRESH_INVALID"

    def test_unknown_token_raises_401(self, db_session):
        with pytest.raises(AppError) as exc_info:
            auth_service.refresh(db_session, "not-a-real-token")

        assert exc_info.value.status_code == 401

    def test_expired_token_raises_401(self, db_session):
        make_user(db_session, phone="+919876543231", password="correct-horse-battery-staple")
        _, raw_refresh_token, _ = auth_service.login(db_session, "+919876543231", "correct-horse-battery-staple")

        row = (
            db_session.query(RefreshToken)
            .filter(RefreshToken.token_hash == hash_refresh_token(raw_refresh_token))
            .first()
        )
        row.expires_at = datetime.now(timezone.utc) - timedelta(days=1)
        db_session.flush()

        with pytest.raises(AppError) as exc_info:
            auth_service.refresh(db_session, raw_refresh_token)

        assert exc_info.value.status_code == 401

    def test_reusing_a_rotated_token_revokes_every_session(self, db_session):
        user = make_user(db_session, phone="+919876543232", password="correct-horse-battery-staple")
        _, raw_refresh_token, _ = auth_service.login(db_session, "+919876543232", "correct-horse-battery-staple")
        # A second, independent session for the same user (e.g. a different device).
        _, second_raw_refresh_token, _ = auth_service.login(db_session, "+919876543232", "correct-horse-battery-staple")

        auth_service.refresh(db_session, raw_refresh_token)

        # Replaying the now-rotated (revoked) original token is the theft signal.
        with pytest.raises(AppError) as exc_info:
            auth_service.refresh(db_session, raw_refresh_token)
        assert exc_info.value.status_code == 401

        active_rows = (
            db_session.query(RefreshToken)
            .filter(RefreshToken.user_id == user.id, RefreshToken.revoked_at.is_(None))
            .all()
        )
        assert active_rows == []

        second_row = (
            db_session.query(RefreshToken)
            .filter(RefreshToken.token_hash == hash_refresh_token(second_raw_refresh_token))
            .first()
        )
        assert second_row.revoked_at is not None


class TestLogout:
    def test_revokes_the_presented_session(self, db_session):
        make_user(db_session, phone="+919876543233", password="correct-horse-battery-staple")
        _, raw_refresh_token, _ = auth_service.login(db_session, "+919876543233", "correct-horse-battery-staple")

        auth_service.logout(db_session, raw_refresh_token)

        row = (
            db_session.query(RefreshToken)
            .filter(RefreshToken.token_hash == hash_refresh_token(raw_refresh_token))
            .first()
        )
        assert row.revoked_at is not None

    def test_is_idempotent_for_a_missing_token(self, db_session):
        auth_service.logout(db_session, None)

    def test_is_idempotent_for_an_unknown_token(self, db_session):
        auth_service.logout(db_session, "not-a-real-token")
