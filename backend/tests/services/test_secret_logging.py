"""
tests/services/test_secret_logging.py

One-time codes and password reset tokens must reach the log only when
DEBUG_LOG_SECRETS is explicitly enabled, and never in production.
"""

import pytest

from app.core.config import Settings
from app.models.enums import OTPPurpose
from app.services import auth_service
from tests.conftest import make_user


class TestSecretLogging:
    def test_otp_is_not_logged_by_default(self, db_session, caplog, monkeypatch):
        monkeypatch.setattr("app.core.config.settings.DEBUG_LOG_SECRETS", False)

        with caplog.at_level("INFO"):
            auth_service.request_otp(db_session, "nolog@example.com", OTPPurpose.signup)

        assert not any("OTP for" in record.message for record in caplog.records)

    def test_otp_is_logged_when_enabled(self, db_session, caplog):
        with caplog.at_level("INFO"):
            auth_service.request_otp(db_session, "dolog@example.com", OTPPurpose.signup)

        assert any("OTP for dolog@example.com" in record.message for record in caplog.records)

    def test_reset_token_is_not_logged_by_default(self, db_session, caplog, monkeypatch):
        monkeypatch.setattr("app.core.config.settings.DEBUG_LOG_SECRETS", False)
        make_user(db_session, phone="+919876547401", email="resetnolog@example.com")

        with caplog.at_level("INFO"):
            auth_service.forgot_password(db_session, "resetnolog@example.com")

        assert not any("Password reset token" in record.message for record in caplog.records)


class TestProductionGuard:
    def test_production_with_secret_logging_fails_startup(self):
        with pytest.raises(ValueError, match="DEBUG_LOG_SECRETS"):
            Settings(ENVIRONMENT="production", ALLOWED_HOSTS="api.homigrow.com", DEBUG_LOG_SECRETS=True)

    def test_default_is_off(self):
        assert Settings.model_fields["DEBUG_LOG_SECRETS"].default is False
