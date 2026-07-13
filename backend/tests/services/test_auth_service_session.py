"""
tests/services/test_auth_service_session.py

Covers session lifecycle and credential recovery in app/services/
auth_service.py: login (happy path, bad credentials, lockout boundary),
refresh (rotation, reuse-attack), logout, and password forgot/reset.
"""

from datetime import datetime, timedelta, timezone
from uuid import uuid4

import jwt
import pytest

from app.core.config import settings
from app.core.exceptions import AppError
from app.core.security import (
    JWT_ALGORITHM,
    create_password_reset_token,
    hash_refresh_token,
    password_fingerprint,
    verify_password,
)
from app.models.refresh_token import RefreshToken
from app.models.user import User
from app.services import auth_service
from tests.conftest import make_user


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

    def test_deactivated_account_raises_403(self, db_session):
        make_user(db_session, phone="+919876543227", password="correct-horse-battery-staple", is_active=False)

        with pytest.raises(AppError) as exc_info:
            auth_service.login(db_session, "+919876543227", "correct-horse-battery-staple")

        assert exc_info.value.status_code == 403
        assert exc_info.value.code == "ACCOUNT_DEACTIVATED"

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


class TestForgotPassword:
    def test_unknown_email_does_not_raise(self, db_session):
        auth_service.forgot_password(db_session, "nobody@example.com")

    def test_known_email_logs_a_reset_token(self, db_session, caplog):
        user = make_user(db_session, phone="+919876543240", email="asha@example.com")

        with caplog.at_level("INFO"):
            auth_service.forgot_password(db_session, "asha@example.com")

        assert any("Password reset token for asha@example.com" in record.message for record in caplog.records)
        assert user.password_hash is not None  # untouched by forgot_password itself


class TestResetPassword:
    def test_valid_token_changes_the_password_and_revokes_sessions(self, db_session):
        user = make_user(db_session, phone="+919876543241", password="old-password-123")
        _, raw_refresh_token, _ = auth_service.login(db_session, "+919876543241", "old-password-123")
        token = create_password_reset_token(user.id, user.password_hash, 30)

        auth_service.reset_password(db_session, token, "new-password-456")

        db_session.refresh(user)
        assert verify_password("new-password-456", user.password_hash)
        assert not verify_password("old-password-123", user.password_hash)

        row = (
            db_session.query(RefreshToken)
            .filter(RefreshToken.token_hash == hash_refresh_token(raw_refresh_token))
            .first()
        )
        assert row.revoked_at is not None

    def test_reusing_a_consumed_token_raises_410(self, db_session):
        user = make_user(db_session, phone="+919876543242", password="old-password-123")
        token = create_password_reset_token(user.id, user.password_hash, 30)

        auth_service.reset_password(db_session, token, "new-password-456")

        with pytest.raises(AppError) as exc_info:
            auth_service.reset_password(db_session, token, "yet-another-password")

        assert exc_info.value.status_code == 410
        assert exc_info.value.code == "TOKEN_EXPIRED"

    def test_expired_token_raises_410(self, db_session):
        user = make_user(db_session, phone="+919876543243", password="old-password-123")
        expired_payload = {
            "sub": str(user.id),
            "purpose": "password_reset",
            "pwd_fp": password_fingerprint(user.password_hash),
            "iat": datetime.now(timezone.utc) - timedelta(minutes=60),
            "exp": datetime.now(timezone.utc) - timedelta(minutes=30),
        }
        expired_token = jwt.encode(expired_payload, settings.JWT_SECRET, algorithm=JWT_ALGORITHM)

        with pytest.raises(AppError) as exc_info:
            auth_service.reset_password(db_session, expired_token, "new-password-456")

        assert exc_info.value.status_code == 410
        assert exc_info.value.code == "TOKEN_EXPIRED"

    def test_garbage_token_raises_410(self, db_session):
        with pytest.raises(AppError) as exc_info:
            auth_service.reset_password(db_session, "not-a-real-token", "new-password-456")

        assert exc_info.value.status_code == 410

    def test_an_access_token_cannot_be_used_as_a_reset_token(self, db_session):
        make_user(db_session, phone="+919876543244", password="old-password-123")
        access_token, _, _ = auth_service.login(db_session, "+919876543244", "old-password-123")

        with pytest.raises(AppError) as exc_info:
            auth_service.reset_password(db_session, access_token, "new-password-456")

        assert exc_info.value.status_code == 410

    def test_unknown_user_raises_410(self, db_session):
        token = create_password_reset_token(uuid4(), None, 30)

        with pytest.raises(AppError) as exc_info:
            auth_service.reset_password(db_session, token, "new-password-456")

        assert exc_info.value.status_code == 410
