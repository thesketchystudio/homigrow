"""
tests/services/test_user_service_security.py

Covers the account-takeover protections on the self-service account
endpoints: a password change signs every other session out, the password
check shares the login lockout, and an email change is re-authenticated and
verified by one-time codes before it replaces the old address.
"""

import re

import pytest

from app.core.exceptions import AppError
from app.core.security import verify_password
from app.models.otp_code import OTPCode
from app.models.refresh_token import RefreshToken
from app.services import auth_service, user_service
from tests.conftest import make_user

_PASSWORD = "old-password-123"
_NEW_PASSWORD = "new-password-456"


def _logged_code(caplog, email: str) -> str:
    """Reads the most recent one-time code logged for an email (secret logging is on for the suite)."""
    matches = [
        re.search(r": (\d{6})$", record.message)
        for record in caplog.records
        if f"OTP for {email} " in record.message
    ]
    codes = [match.group(1) for match in matches if match]
    assert codes, f"No OTP logged for {email}"
    return codes[-1]


def _active_sessions(db_session, user):
    return (
        db_session.query(RefreshToken)
        .filter(RefreshToken.user_id == user.id, RefreshToken.revoked_at.is_(None))
        .all()
    )


class TestPasswordChangeSignsOutOtherSessions:
    def test_every_other_session_is_revoked_and_a_fresh_one_issued(self, db_session):
        user = make_user(db_session, phone="+919876580001", password=_PASSWORD)
        _, stolen_refresh, _ = auth_service.login(db_session, "+919876580001", _PASSWORD)
        auth_service.login(db_session, "+919876580001", _PASSWORD)
        assert len(_active_sessions(db_session, user)) == 2

        access_token, new_refresh = user_service.change_password(db_session, user, _PASSWORD, _NEW_PASSWORD)

        assert access_token and new_refresh != stolen_refresh
        assert len(_active_sessions(db_session, user)) == 1
        with pytest.raises(AppError) as exc_info:
            auth_service.refresh(db_session, stolen_refresh)
        assert exc_info.value.status_code == 401

    def test_the_returned_refresh_token_keeps_the_caller_signed_in(self, db_session):
        user = make_user(db_session, phone="+919876580002", password=_PASSWORD)

        _, new_refresh = user_service.change_password(db_session, user, _PASSWORD, _NEW_PASSWORD)

        access_token, _, refreshed_user = auth_service.refresh(db_session, new_refresh)
        assert access_token and refreshed_user.id == user.id
        assert verify_password(_NEW_PASSWORD, user.password_hash)


class TestEndedSessionsAreNotTreatedAsTheft:
    def test_an_old_device_refreshing_after_a_password_change_keeps_the_new_session(self, db_session):
        user = make_user(db_session, phone="+919876580006", password=_PASSWORD)
        _, old_device_refresh, _ = auth_service.login(db_session, "+919876580006", _PASSWORD)
        _, new_refresh = user_service.change_password(db_session, user, _PASSWORD, _NEW_PASSWORD)

        with pytest.raises(AppError) as exc_info:
            auth_service.refresh(db_session, old_device_refresh)
        assert exc_info.value.status_code == 401

        access_token, _, refreshed_user = auth_service.refresh(db_session, new_refresh)
        assert access_token and refreshed_user.id == user.id

    def test_replaying_a_rotated_token_still_revokes_every_session(self, db_session):
        user = make_user(db_session, phone="+919876580007", password=_PASSWORD)
        _, first_refresh, _ = auth_service.login(db_session, "+919876580007", _PASSWORD)
        _, second_refresh, _ = auth_service.login(db_session, "+919876580007", _PASSWORD)
        auth_service.refresh(db_session, first_refresh)

        with pytest.raises(AppError):
            auth_service.refresh(db_session, first_refresh)

        assert _active_sessions(db_session, user) == []
        with pytest.raises(AppError):
            auth_service.refresh(db_session, second_refresh)

    def test_a_logged_out_token_presented_again_does_not_end_other_sessions(self, db_session):
        user = make_user(db_session, phone="+919876580008", password=_PASSWORD)
        _, logged_out_refresh, _ = auth_service.login(db_session, "+919876580008", _PASSWORD)
        _, other_device_refresh, _ = auth_service.login(db_session, "+919876580008", _PASSWORD)
        auth_service.logout(db_session, logged_out_refresh)

        with pytest.raises(AppError):
            auth_service.refresh(db_session, logged_out_refresh)

        assert len(_active_sessions(db_session, user)) == 1
        access_token, _, _ = auth_service.refresh(db_session, other_device_refresh)
        assert access_token


class TestPasswordCheckSharesTheLoginLockout:
    def test_repeated_wrong_passwords_lock_the_account(self, db_session):
        user = make_user(db_session, phone="+919876580003", password=_PASSWORD)

        for _ in range(auth_service.LOCKOUT_THRESHOLD):
            with pytest.raises(AppError) as exc_info:
                user_service.change_password(db_session, user, "wrong-password", _NEW_PASSWORD)
            assert exc_info.value.code == "BAD_CURRENT_PASSWORD"

        with pytest.raises(AppError) as exc_info:
            user_service.change_password(db_session, user, _PASSWORD, _NEW_PASSWORD)
        assert exc_info.value.status_code == 423
        assert exc_info.value.code == "ACCOUNT_LOCKED"
        assert verify_password(_PASSWORD, user.password_hash)

    def test_failures_here_also_lock_login(self, db_session):
        user = make_user(db_session, phone="+919876580004", password=_PASSWORD)
        for _ in range(auth_service.LOCKOUT_THRESHOLD):
            with pytest.raises(AppError):
                user_service.change_password(db_session, user, "wrong-password", _NEW_PASSWORD)

        with pytest.raises(AppError) as exc_info:
            auth_service.login(db_session, "+919876580004", _PASSWORD)

        assert exc_info.value.code == "ACCOUNT_LOCKED"

    def test_a_correct_password_resets_the_failure_count(self, db_session):
        user = make_user(db_session, phone="+919876580005", password=_PASSWORD)
        with pytest.raises(AppError):
            user_service.change_password(db_session, user, "wrong-password", _NEW_PASSWORD)
        assert user.failed_login_attempts == 1

        user_service.change_password(db_session, user, _PASSWORD, _NEW_PASSWORD)

        assert user.failed_login_attempts == 0


class TestRequestEmailChangeForPasswordAccounts:
    def test_wrong_password_sends_no_code(self, db_session):
        user = make_user(db_session, phone="+919876580010", email="old10@example.com", password=_PASSWORD)

        with pytest.raises(AppError) as exc_info:
            user_service.request_email_change(db_session, user, "new10@example.com", "wrong-password")

        assert exc_info.value.code == "BAD_CURRENT_PASSWORD"
        assert db_session.query(OTPCode).filter(OTPCode.email == "new10@example.com").count() == 0

    def test_missing_password_is_refused(self, db_session):
        user = make_user(db_session, phone="+919876580011", email="old11@example.com", password=_PASSWORD)

        with pytest.raises(AppError) as exc_info:
            user_service.request_email_change(db_session, user, "new11@example.com", None)

        assert exc_info.value.code == "BAD_CURRENT_PASSWORD"

    def test_correct_password_sends_a_code_only_to_the_new_address(self, db_session):
        user = make_user(db_session, phone="+919876580012", email="old12@example.com", password=_PASSWORD)

        user_service.request_email_change(db_session, user, "new12@example.com", _PASSWORD)

        assert db_session.query(OTPCode).filter(OTPCode.email == "new12@example.com").count() == 1
        assert db_session.query(OTPCode).filter(OTPCode.email == "old12@example.com").count() == 0
        assert user.email == "old12@example.com"

    def test_the_same_email_is_rejected(self, db_session):
        user = make_user(db_session, phone="+919876580013", email="same13@example.com", password=_PASSWORD)

        with pytest.raises(AppError) as exc_info:
            user_service.request_email_change(db_session, user, "same13@example.com", _PASSWORD)

        assert exc_info.value.status_code == 422
        assert exc_info.value.code == "EMAIL_UNCHANGED"

    def test_an_email_owned_by_someone_else_is_rejected(self, db_session):
        make_user(db_session, phone="+919876580014", email="taken14@example.com")
        user = make_user(db_session, phone="+919876580015", email="mine15@example.com", password=_PASSWORD)

        with pytest.raises(AppError) as exc_info:
            user_service.request_email_change(db_session, user, "taken14@example.com", _PASSWORD)

        assert exc_info.value.status_code == 409
        assert exc_info.value.code == "EMAIL_TAKEN"


class TestConfirmEmailChangeForPasswordAccounts:
    def test_the_right_code_swaps_and_verifies_the_email(self, db_session, caplog):
        user = make_user(db_session, phone="+919876580020", email="old20@example.com", password=_PASSWORD)
        with caplog.at_level("INFO"):
            user_service.request_email_change(db_session, user, "new20@example.com", _PASSWORD)
        code = _logged_code(caplog, "new20@example.com")

        updated = user_service.confirm_email_change(db_session, user, "new20@example.com", code, None)

        assert updated.email == "new20@example.com"
        assert updated.is_email_verified is True

    def test_a_code_cannot_be_replayed(self, db_session, caplog):
        user = make_user(db_session, phone="+919876580021", email="old21@example.com", password=_PASSWORD)
        with caplog.at_level("INFO"):
            user_service.request_email_change(db_session, user, "new21@example.com", _PASSWORD)
        code = _logged_code(caplog, "new21@example.com")
        user_service.confirm_email_change(db_session, user, "new21@example.com", code, None)

        with pytest.raises(AppError) as exc_info:
            user_service.confirm_email_change(db_session, user, "new21@example.com", code, None)

        assert exc_info.value.code == "OTP_EXPIRED"

    def test_a_wrong_code_leaves_the_email_unchanged(self, db_session):
        user = make_user(db_session, phone="+919876580022", email="old22@example.com", password=_PASSWORD)
        user_service.request_email_change(db_session, user, "new22@example.com", _PASSWORD)

        with pytest.raises(AppError) as exc_info:
            user_service.confirm_email_change(db_session, user, "new22@example.com", "000000", None)

        assert exc_info.value.code == "OTP_INVALID"
        assert user.email == "old22@example.com"

    def test_confirming_without_a_requested_code_fails(self, db_session):
        user = make_user(db_session, phone="+919876580023", email="old23@example.com", password=_PASSWORD)

        with pytest.raises(AppError) as exc_info:
            user_service.confirm_email_change(db_session, user, "never-asked@example.com", "123456", None)

        assert exc_info.value.code == "OTP_EXPIRED"
        assert user.email == "old23@example.com"

    def test_a_signup_code_is_not_accepted_for_an_email_change(self, db_session, caplog):
        user = make_user(db_session, phone="+919876580024", email="old24@example.com", password=_PASSWORD)
        with caplog.at_level("INFO"):
            auth_service.request_otp(db_session, "new24@example.com", auth_service.OTPPurpose.signup)
        code = _logged_code(caplog, "new24@example.com")

        with pytest.raises(AppError) as exc_info:
            user_service.confirm_email_change(db_session, user, "new24@example.com", code, None)

        assert exc_info.value.code == "OTP_EXPIRED"


class TestEmailChangeForAccountsWithoutAPassword:
    def _google_user(self, db_session, phone, email):
        return make_user(db_session, phone=phone, email=email, password=None)

    def test_codes_go_to_both_the_new_and_the_current_address(self, db_session):
        user = self._google_user(db_session, "+919876580030", "old30@example.com")

        user_service.request_email_change(db_session, user, "new30@example.com", None)

        assert db_session.query(OTPCode).filter(OTPCode.email == "new30@example.com").count() == 1
        assert db_session.query(OTPCode).filter(OTPCode.email == "old30@example.com").count() == 1

    def test_the_current_address_code_is_required(self, db_session, caplog):
        user = self._google_user(db_session, "+919876580031", "old31@example.com")
        with caplog.at_level("INFO"):
            user_service.request_email_change(db_session, user, "new31@example.com", None)
        new_code = _logged_code(caplog, "new31@example.com")

        with pytest.raises(AppError) as exc_info:
            user_service.confirm_email_change(db_session, user, "new31@example.com", new_code, None)

        assert exc_info.value.status_code == 422
        assert exc_info.value.code == "CURRENT_EMAIL_CODE_REQUIRED"
        assert user.email == "old31@example.com"

    def test_both_codes_swap_the_email(self, db_session, caplog):
        user = self._google_user(db_session, "+919876580032", "old32@example.com")
        with caplog.at_level("INFO"):
            user_service.request_email_change(db_session, user, "new32@example.com", None)
        new_code = _logged_code(caplog, "new32@example.com")
        old_code = _logged_code(caplog, "old32@example.com")

        updated = user_service.confirm_email_change(db_session, user, "new32@example.com", new_code, old_code)

        assert updated.email == "new32@example.com"
        assert updated.is_email_verified is True

    def test_a_wrong_current_code_does_not_spend_the_new_code(self, db_session, caplog):
        user = self._google_user(db_session, "+919876580033", "old33@example.com")
        with caplog.at_level("INFO"):
            user_service.request_email_change(db_session, user, "new33@example.com", None)
        new_code = _logged_code(caplog, "new33@example.com")
        old_code = _logged_code(caplog, "old33@example.com")

        with pytest.raises(AppError) as exc_info:
            user_service.confirm_email_change(db_session, user, "new33@example.com", new_code, "000000")
        assert exc_info.value.code == "OTP_INVALID"
        assert user.email == "old33@example.com"

        updated = user_service.confirm_email_change(db_session, user, "new33@example.com", new_code, old_code)
        assert updated.email == "new33@example.com"
