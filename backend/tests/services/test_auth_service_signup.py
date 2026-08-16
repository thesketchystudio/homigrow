"""
tests/services/test_auth_service_signup.py

Covers account creation and identity verification in app/services/
auth_service.py: signup (happy path, broker-profile creation, duplicate
phone) and email-OTP request/verify (expiry, attempt cap, replay, resend).
"""

import re
from datetime import datetime, timedelta, timezone

import pytest

from app.core.exceptions import AppError
from app.models.broker_profile import BrokerProfile
from app.models.enums import OTPPurpose, UserRole
from app.models.otp_code import OTPCode
from app.services import auth_service
from tests.conftest import make_user


def _extract_otp_code(caplog, email: str) -> str:
    """Pulls the plaintext OTP out of the dev-mode log line _issue_otp writes, mirroring the reset-token test pattern."""
    for record in caplog.records:
        match = re.search(rf"OTP for {re.escape(email)} \(\w+\): (\d{{6}})", record.message)
        if match:
            return match.group(1)
    raise AssertionError(f"No OTP logged for {email}")


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
            email="vikram@example.com",
            password="s3cure-pass",
        )

        profile = db_session.query(BrokerProfile).filter(BrokerProfile.user_id == user.id).first()
        assert profile is not None

    def test_client_role_does_not_create_a_broker_profile(self, db_session):
        user = auth_service.signup(
            db_session,
            phone="+919876543212",
            role=UserRole.client,
            full_name=None,
            email="noBroker@example.com",
            password=None,
        )

        assert db_session.query(BrokerProfile).filter(BrokerProfile.user_id == user.id).first() is None

    def test_issues_a_signup_otp(self, db_session):
        user = auth_service.signup(
            db_session,
            phone="+919876543213",
            role=UserRole.client,
            full_name=None,
            email="signupotp@example.com",
            password=None,
        )

        otp = db_session.query(OTPCode).filter(OTPCode.email == user.email).first()
        assert otp is not None
        assert otp.purpose.value == "signup"

    def test_city_and_state_land_in_preferences(self, db_session):
        user = auth_service.signup(
            db_session,
            phone="+919876543260",
            role=UserRole.client,
            full_name="Meera Nair",
            email="meera@example.com",
            password="s3cure-pass",
            city="Bengaluru",
            state="Karnataka",
        )

        assert user.preferences == {"city": "Bengaluru", "state": "Karnataka"}

    def test_omitting_city_and_state_leaves_preferences_empty(self, db_session):
        user = auth_service.signup(
            db_session,
            phone="+919876543261",
            role=UserRole.client,
            full_name="No City",
            email="nocity@example.com",
            password="s3cure-pass",
        )

        assert user.preferences == {}

    def test_broker_verification_details_are_stored_on_broker_profile(self, db_session):
        user = auth_service.signup(
            db_session,
            phone="+919876543262",
            role=UserRole.broker,
            full_name="Rohan Iyer",
            email="rohan@example.com",
            password="s3cure-pass",
            company_name="Iyer Realty Group",
            rera_number="RERA-KA-99887",
            service_area="Bengaluru",
        )

        profile = db_session.query(BrokerProfile).filter(BrokerProfile.user_id == user.id).first()
        assert profile.company_name == "Iyer Realty Group"
        assert profile.rera_number == "RERA-KA-99887"
        assert profile.service_areas == ["Bengaluru"]
        assert profile.verification_status.value == "unverified"

    def test_omitting_verification_details_leaves_broker_profile_blank(self, db_session):
        user = auth_service.signup(
            db_session,
            phone="+919876543263",
            role=UserRole.broker,
            full_name="No Details",
            email="nodetails@example.com",
            password="s3cure-pass",
        )

        profile = db_session.query(BrokerProfile).filter(BrokerProfile.user_id == user.id).first()
        assert profile.company_name is None
        assert profile.rera_number is None
        assert profile.service_areas == []

    def test_duplicate_phone_raises_409(self, db_session):
        make_user(db_session, phone="+919876543214")

        with pytest.raises(AppError) as exc_info:
            auth_service.signup(
                db_session,
                phone="+919876543214",
                role=UserRole.client,
                full_name=None,
                email="dupphone@example.com",
                password="whatever",
            )

        assert exc_info.value.status_code == 409
        assert exc_info.value.code == "PHONE_TAKEN"


class TestRequestOtp:
    def test_issues_and_logs_a_new_otp(self, db_session, caplog):
        with caplog.at_level("INFO"):
            auth_service.request_otp(db_session, "otpreq@example.com", OTPPurpose.signup)

        assert any("OTP for otpreq@example.com" in r.message for r in caplog.records)
        otp = db_session.query(OTPCode).filter(OTPCode.email == "otpreq@example.com").first()
        assert otp is not None

    def test_invalidates_the_prior_unconsumed_code(self, db_session):
        auth_service.request_otp(db_session, "otpreq2@example.com", OTPPurpose.signup)
        first = (
            db_session.query(OTPCode)
            .filter(OTPCode.email == "otpreq2@example.com")
            .order_by(OTPCode.created_at.desc())
            .first()
        )

        auth_service.request_otp(db_session, "otpreq2@example.com", OTPPurpose.signup)

        db_session.refresh(first)
        assert first.consumed_at is not None


class TestVerifyOtp:
    def test_correct_code_succeeds_and_flips_is_email_verified(self, db_session, caplog):
        with caplog.at_level("INFO"):
            user = auth_service.signup(
                db_session,
                phone="+919876543250",
                role=UserRole.client,
                full_name=None,
                email="verifyme@example.com",
                password=None,
            )
        code = _extract_otp_code(caplog, "verifyme@example.com")

        auth_service.verify_otp(db_session, "verifyme@example.com", code, OTPPurpose.signup)

        db_session.refresh(user)
        assert user.is_email_verified is True

    def test_wrong_code_raises_401_and_increments_attempts(self, db_session, caplog):
        with caplog.at_level("INFO"):
            auth_service.signup(
                db_session,
                phone="+919876543251",
                role=UserRole.client,
                full_name=None,
                email="wrongcode@example.com",
                password=None,
            )

        with pytest.raises(AppError) as exc_info:
            auth_service.verify_otp(db_session, "wrongcode@example.com", "000000", OTPPurpose.signup)

        assert exc_info.value.status_code == 401
        assert exc_info.value.code == "OTP_INVALID"

        otp = db_session.query(OTPCode).filter(OTPCode.email == "wrongcode@example.com").first()
        assert otp.attempts == 1

    def test_five_wrong_attempts_then_raises_expired(self, db_session, caplog):
        with caplog.at_level("INFO"):
            auth_service.signup(
                db_session,
                phone="+919876543252",
                role=UserRole.client,
                full_name=None,
                email="capped@example.com",
                password=None,
            )

        for _ in range(5):
            with pytest.raises(AppError) as exc_info:
                auth_service.verify_otp(db_session, "capped@example.com", "000000", OTPPurpose.signup)
            assert exc_info.value.code == "OTP_INVALID"

        with pytest.raises(AppError) as exc_info:
            auth_service.verify_otp(db_session, "capped@example.com", "000000", OTPPurpose.signup)
        assert exc_info.value.status_code == 410
        assert exc_info.value.code == "OTP_EXPIRED"

    def test_expired_code_raises_410(self, db_session, caplog):
        with caplog.at_level("INFO"):
            auth_service.signup(
                db_session,
                phone="+919876543253",
                role=UserRole.client,
                full_name=None,
                email="expiredotp@example.com",
                password=None,
            )
        code = _extract_otp_code(caplog, "expiredotp@example.com")

        otp = db_session.query(OTPCode).filter(OTPCode.email == "expiredotp@example.com").first()
        otp.expires_at = datetime.now(timezone.utc) - timedelta(minutes=1)
        db_session.flush()

        with pytest.raises(AppError) as exc_info:
            auth_service.verify_otp(db_session, "expiredotp@example.com", code, OTPPurpose.signup)
        assert exc_info.value.status_code == 410
        assert exc_info.value.code == "OTP_EXPIRED"

    def test_no_code_ever_issued_raises_410(self, db_session):
        with pytest.raises(AppError) as exc_info:
            auth_service.verify_otp(db_session, "nocodeever@example.com", "123456", OTPPurpose.signup)
        assert exc_info.value.status_code == 410
        assert exc_info.value.code == "OTP_EXPIRED"

    def test_replaying_a_consumed_code_raises_410(self, db_session, caplog):
        with caplog.at_level("INFO"):
            auth_service.signup(
                db_session,
                phone="+919876543254",
                role=UserRole.client,
                full_name=None,
                email="replayotp@example.com",
                password=None,
            )
        code = _extract_otp_code(caplog, "replayotp@example.com")

        auth_service.verify_otp(db_session, "replayotp@example.com", code, OTPPurpose.signup)

        with pytest.raises(AppError) as exc_info:
            auth_service.verify_otp(db_session, "replayotp@example.com", code, OTPPurpose.signup)
        assert exc_info.value.status_code == 410
        assert exc_info.value.code == "OTP_EXPIRED"

    def test_resend_invalidates_the_prior_code(self, db_session, caplog):
        """
        After a resend, the prior code's row is marked consumed, so it
        no longer matches the (now different) active row's hash — the
        old code is rejected as OTP_INVALID (wrong code against the
        current code), not OTP_EXPIRED (that's reserved for "no active
        code exists at all").
        """
        with caplog.at_level("INFO"):
            auth_service.signup(
                db_session,
                phone="+919876543255",
                role=UserRole.client,
                full_name=None,
                email="resendcode@example.com",
                password=None,
            )
            old_code = _extract_otp_code(caplog, "resendcode@example.com")
            auth_service.request_otp(db_session, "resendcode@example.com", OTPPurpose.signup)

        old_otp_row = (
            db_session.query(OTPCode)
            .filter(OTPCode.email == "resendcode@example.com")
            .order_by(OTPCode.created_at.asc())
            .first()
        )
        assert old_otp_row.consumed_at is not None

        with pytest.raises(AppError) as exc_info:
            auth_service.verify_otp(db_session, "resendcode@example.com", old_code, OTPPurpose.signup)
        assert exc_info.value.code == "OTP_INVALID"

    def test_broker_verification_purpose_also_flips_is_email_verified(self, db_session, caplog):
        user = make_user(db_session, phone="+919876543256", email="brokerverify@example.com")
        with caplog.at_level("INFO"):
            auth_service.request_otp(db_session, "brokerverify@example.com", OTPPurpose.broker_verification)
        code = _extract_otp_code(caplog, "brokerverify@example.com")

        auth_service.verify_otp(db_session, "brokerverify@example.com", code, OTPPurpose.broker_verification)

        db_session.refresh(user)
        assert user.is_email_verified is True
