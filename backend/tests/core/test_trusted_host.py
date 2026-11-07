"""
tests/core/test_trusted_host.py

Covers the Host-header allow-list and the production guard on
ALLOWED_HOSTS.
"""

import pytest
from fastapi.testclient import TestClient

from app.core.config import Settings
from app.main import app


class TestTrustedHost:
    def test_allowed_host_is_served(self):
        response = TestClient(app, base_url="http://localhost").get("/health")
        assert response.status_code == 200

    def test_unknown_host_is_rejected(self):
        response = TestClient(app, base_url="http://evil.example").get("/health")
        assert response.status_code == 400


class TestAllowedHostsSetting:
    def test_comma_separated_value_is_split_and_trimmed(self):
        settings = Settings(ALLOWED_HOSTS="api.homigrow.com, www.api.homigrow.com ,")
        assert settings.allowed_hosts_list == ["api.homigrow.com", "www.api.homigrow.com"]

    def test_production_with_default_hosts_fails_startup(self):
        with pytest.raises(ValueError, match="ALLOWED_HOSTS"):
            Settings(ENVIRONMENT="production", DEBUG_LOG_SECRETS=False)

    def test_production_with_explicit_hosts_is_accepted(self):
        settings = Settings(
            ENVIRONMENT="production",
            ALLOWED_HOSTS="api.homigrow.com",
            DEBUG_LOG_SECRETS=False,
            SUPABASE_URL="https://example.supabase.co",
        )
        assert settings.allowed_hosts_list == ["api.homigrow.com"]


class TestStorageUrlSetting:
    def test_production_without_a_storage_url_fails_startup(self):
        with pytest.raises(ValueError, match="SUPABASE_URL"):
            Settings(ENVIRONMENT="production", ALLOWED_HOSTS="api.homigrow.com", DEBUG_LOG_SECRETS=False, SUPABASE_URL="")

    def test_production_with_a_plain_http_storage_url_fails_startup(self):
        with pytest.raises(ValueError, match="SUPABASE_URL"):
            Settings(
                ENVIRONMENT="production",
                ALLOWED_HOSTS="api.homigrow.com",
                DEBUG_LOG_SECRETS=False,
                SUPABASE_URL="http://example.supabase.co",
            )

    def test_development_does_not_need_a_storage_url(self):
        assert Settings(ENVIRONMENT="dev", SUPABASE_URL="").SUPABASE_URL == ""

