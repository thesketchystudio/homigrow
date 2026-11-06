"""
tests/services/test_auth_service_otp_limits.py

Covers the per-email OTP abuse limits (resend cooldown, daily cap, failed
attempts that survive a resend) and the keyed-digest storage of codes.
"""

from datetime import datetime, timedelta, timezone

import pytest

from app.core.exceptions import AppError
from app.core.security import hash_otp, verify_otp_hash
from app.models.enums import OTPPurpose
from app.models.otp_code import OTPCode
from app.services import auth_service
from tests.conftest import age_otp_codes, make_user

EMAIL = "limits@example.com"


def _add_code(db, email=EMAIL, purpose=OTPPurpose.signup, age_seconds=120, attempts=0):
    db.add(
        OTPCode(
            email=email,
            code_hash=hash_otp("123456", email),
            purpose=purpose,
            attempts=attempts,
            expires_at=datetime.now(timezone.utc) + timedelta(minutes=10),
            created_at=datetime.now(timezone.utc) - timedelta(seconds=age_seconds),
        )
    )
    db.flush()


class TestResendCooldown:
    def test_second_request_within_a_minute_is_rejected(self, db_session):
        auth_service.request_otp(db_session, EMAIL, OTPPurpose.signup)

        with pytest.raises(AppError) as exc_info:
            auth_service.request_otp(db_session, EMAIL, OTPPurpose.signup)

        assert exc_info.value.status_code == 429
        assert exc_info.value.code == "OTP_RESEND_COOLDOWN"

    def test_request_is_allowed_after_the_cooldown(self, db_session):
        auth_service.request_otp(db_session, EMAIL, OTPPurpose.signup)
        age_otp_codes(db_session, EMAIL)

        auth_service.request_otp(db_session, EMAIL, OTPPurpose.signup)

        assert db_session.query(OTPCode).filter(OTPCode.email == EMAIL).count() == 2

    def test_switching_purpose_does_not_bypass_the_cooldown(self, db_session):
        auth_service.request_otp(db_session, EMAIL, OTPPurpose.signup)

        with pytest.raises(AppError) as exc_info:
            auth_service.request_otp(db_session, EMAIL, OTPPurpose.broker_verification)

        assert exc_info.value.code == "OTP_RESEND_COOLDOWN"

    def test_other_emails_are_unaffected(self, db_session):
        auth_service.request_otp(db_session, EMAIL, OTPPurpose.signup)
        auth_service.request_otp(db_session, "someone-else@example.com", OTPPurpose.signup)


class TestDailyCap:
    def test_request_is_rejected_after_ten_codes_in_a_day(self, db_session):
        for _ in range(auth_service.OTP_MAX_CODES_PER_DAY):
            _add_code(db_session)

        with pytest.raises(AppError) as exc_info:
            auth_service.request_otp(db_session, EMAIL, OTPPurpose.signup)

        assert exc_info.value.status_code == 429
        assert exc_info.value.code == "OTP_DAILY_LIMIT"

    def test_codes_older_than_a_day_do_not_count(self, db_session):
        for _ in range(auth_service.OTP_MAX_CODES_PER_DAY):
            _add_code(db_session, age_seconds=25 * 3600)

        auth_service.request_otp(db_session, EMAIL, OTPPurpose.signup)


class TestFailedAttemptsSurviveResend:
    def test_ten_failures_across_two_codes_lock_verification(self, db_session):
        _add_code(db_session, age_seconds=300, attempts=5)  # first code, burned out
        _add_code(db_session, age_seconds=120, attempts=4)  # resent code, one failure left in the budget

        with pytest.raises(AppError) as exc_info:
            auth_service.verify_otp(db_session, EMAIL, "000000", OTPPurpose.signup)
        assert exc_info.value.code == "OTP_INVALID"

        with pytest.raises(AppError) as exc_info:
            auth_service.verify_otp(db_session, EMAIL, "123456", OTPPurpose.signup)
        assert exc_info.value.status_code == 429
        assert exc_info.value.code == "OTP_ATTEMPTS_EXCEEDED"

    def test_failures_older_than_an_hour_do_not_count(self, db_session):
        _add_code(db_session, age_seconds=2 * 3600, attempts=5)
        _add_code(db_session, age_seconds=2 * 3600, attempts=5)
        _add_code(db_session, age_seconds=90)

        auth_service.verify_otp(db_session, EMAIL, "123456", OTPPurpose.signup)


class TestOtpStorage:
    def test_stored_hash_is_a_keyed_digest_not_the_code(self, db_session):
        auth_service.request_otp(db_session, EMAIL, OTPPurpose.signup)

        stored = db_session.query(OTPCode).filter(OTPCode.email == EMAIL).one().code_hash

        assert len(stored) == 64 and all(c in "0123456789abcdef" for c in stored)

    def test_digest_is_bound_to_the_email(self):
        assert hash_otp("123456", "a@example.com") != hash_otp("123456", "b@example.com")
        assert verify_otp_hash("123456", "a@example.com", hash_otp("123456", "a@example.com"))
        assert not verify_otp_hash("123456", "b@example.com", hash_otp("123456", "a@example.com"))
        assert not verify_otp_hash("654321", "a@example.com", hash_otp("123456", "a@example.com"))


class TestLoginStillReportsUnverifiedWhenLimited:
    def test_second_login_inside_the_cooldown_still_returns_email_not_verified(self, db_session):
        make_user(db_session, phone="+919876547301", email="loginlimit@example.com", is_email_verified=False)
        for _ in range(2):
            with pytest.raises(AppError) as exc_info:
                auth_service.login(db_session, "loginlimit@example.com", "correct-horse-battery-staple")
            assert exc_info.value.code == "EMAIL_NOT_VERIFIED"

        assert db_session.query(OTPCode).filter(OTPCode.email == "loginlimit@example.com").count() == 1
