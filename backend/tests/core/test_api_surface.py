"""
tests/core/test_api_surface.py

Covers what the API exposes publicly: interactive docs only outside
production, and a CORS policy limited to the methods and headers the
frontend actually uses.
"""

from fastapi.testclient import TestClient

from app.main import app, docs_config

_ORIGIN = "http://localhost:3000"


def _preflight(method: str, headers: str):
    return TestClient(app, base_url="http://localhost").options(
        "/api/v1/properties",
        headers={
            "Origin": _ORIGIN,
            "Access-Control-Request-Method": method,
            "Access-Control-Request-Headers": headers,
        },
    )


class TestDocsConfig:
    def test_docs_are_disabled_in_production(self):
        assert docs_config("production") == {"docs_url": None, "redoc_url": None, "openapi_url": None}

    def test_docs_are_enabled_outside_production(self):
        config = docs_config("dev")
        assert config["docs_url"] == "/docs"
        assert config["openapi_url"] == "/openapi.json"

    def test_dev_app_serves_docs(self):
        assert TestClient(app, base_url="http://localhost").get("/openapi.json").status_code == 200


class TestCorsPolicy:
    def test_used_method_and_headers_are_allowed(self):
        response = _preflight("DELETE", "authorization,content-type")
        assert response.status_code == 200
        assert response.headers["access-control-allow-origin"] == _ORIGIN

    def test_unused_method_is_rejected(self):
        assert _preflight("TRACE", "content-type").status_code == 400

    def test_unknown_header_is_rejected(self):
        assert _preflight("POST", "x-evil-header").status_code == 400

    def test_other_origin_gets_no_cors_approval(self):
        response = TestClient(app, base_url="http://localhost").options(
            "/api/v1/properties",
            headers={"Origin": "http://evil.example", "Access-Control-Request-Method": "POST"},
        )
        assert "access-control-allow-origin" not in response.headers
