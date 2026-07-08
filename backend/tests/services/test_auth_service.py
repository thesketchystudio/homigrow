"""
tests/services/test_auth_service.py

Covers signup (happy path, broker-profile creation, duplicate phone)
and login (happy path, bad credentials, lockout boundary) per the
P2 auth suite priority in 12_Testing.md.
"""

from datetime import datetime, timedelta, timezone

import pytest
from fastapi import HTTPException

from app.models.broker_profile import BrokerProfile
from app.models.enums import UserRole
from app.models.otp_code import OTPCode
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

        with pytest.raises(HTTPException) as exc_info:
            auth_service.signup(
                db_session,
                phone="+919876543214",
                role=UserRole.client,
                full_name=None,
                email=None,
                password="whatever",
            )

        assert exc_info.value.status_code == 409
        assert exc_info.value.detail["code"] == "PHONE_TAKEN"


class TestLogin:
    def test_correct_credentials_returns_a_token_and_user(self, db_session):
        user = make_user(db_session, phone="+919876543220", password="correct-horse-battery-staple")

        token, logged_in_user = auth_service.login(db_session, "+919876543220", "correct-horse-battery-staple")

        assert isinstance(token, str) and token
        assert logged_in_user.id == user.id

    def test_login_by_email_also_works(self, db_session):
        make_user(db_session, phone="+919876543221", email="ravi@example.com", password="correct-horse-battery-staple")

        token, _ = auth_service.login(db_session, "ravi@example.com", "correct-horse-battery-staple")

        assert token

    def test_unknown_identifier_raises_401(self, db_session):
        with pytest.raises(HTTPException) as exc_info:
            auth_service.login(db_session, "+919999999999", "whatever")

        assert exc_info.value.status_code == 401
        assert exc_info.value.detail["code"] == "BAD_CREDENTIALS"

    def test_wrong_password_raises_401_and_increments_counter(self, db_session):
        user = make_user(db_session, phone="+919876543222", password="correct-horse-battery-staple")

        with pytest.raises(HTTPException) as exc_info:
            auth_service.login(db_session, "+919876543222", "wrong-password")

        assert exc_info.value.status_code == 401
        db_session.refresh(user)
        assert user.failed_login_attempts == 1

    def test_fifth_consecutive_failure_locks_the_account(self, db_session):
        make_user(db_session, phone="+919876543223", password="correct-horse-battery-staple")

        for _ in range(4):
            with pytest.raises(HTTPException) as exc_info:
                auth_service.login(db_session, "+919876543223", "wrong-password")
            assert exc_info.value.status_code == 401

        # 5th failure crosses the threshold and locks the account.
        with pytest.raises(HTTPException) as exc_info:
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

        with pytest.raises(HTTPException) as exc_info:
            auth_service.login(db_session, "+919876543224", "correct-horse-battery-staple")

        assert exc_info.value.status_code == 423
        assert exc_info.value.detail["code"] == "ACCOUNT_LOCKED"

    def test_successful_login_resets_the_failure_counter(self, db_session):
        user = make_user(db_session, phone="+919876543225", password="correct-horse-battery-staple")
        user.failed_login_attempts = 3
        db_session.flush()

        auth_service.login(db_session, "+919876543225", "correct-horse-battery-staple")

        db_session.refresh(user)
        assert user.failed_login_attempts == 0
        assert user.locked_until is None
