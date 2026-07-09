"""
tests/core/test_exceptions.py

Exercises the exception-handling infrastructure itself (envelope shape
for AppError, plain HTTPException, request validation, and unhandled
exceptions) against a minimal throwaway app, independent of any real
product route.
"""

from fastapi import FastAPI
from fastapi.testclient import TestClient
from pydantic import BaseModel

from app.core.exceptions import ConflictError, install_exception_handlers


class _Body(BaseModel):
    name: str


def _make_app() -> FastAPI:
    app = FastAPI()
    install_exception_handlers(app)

    @app.get("/app-error")
    def _raise_app_error():
        raise ConflictError("SOMETHING_TAKEN", "Something is already taken.")

    @app.get("/http-exception-with-fields")
    def _raise_http_exception_fields():
        from fastapi import HTTPException

        raise HTTPException(status_code=409, detail={"code": "CUSTOM_CODE", "message": "Custom message."})

    @app.post("/validate")
    def _validate(body: _Body):
        return {"name": body.name}

    @app.get("/boom")
    def _boom():
        raise RuntimeError("unexpected failure")

    return app


class TestExceptionEnvelopes:
    def test_app_error_uses_the_error_envelope(self):
        client = TestClient(_make_app(), raise_server_exceptions=False)
        response = client.get("/app-error")

        assert response.status_code == 409
        assert response.json() == {"error": {"code": "SOMETHING_TAKEN", "message": "Something is already taken."}}

    def test_http_exception_with_code_message_dict_is_passed_through(self):
        client = TestClient(_make_app(), raise_server_exceptions=False)
        response = client.get("/http-exception-with-fields")

        assert response.status_code == 409
        assert response.json() == {"error": {"code": "CUSTOM_CODE", "message": "Custom message."}}

    def test_framework_404_gets_wrapped_in_the_envelope(self):
        client = TestClient(_make_app(), raise_server_exceptions=False)
        response = client.get("/does-not-exist")

        assert response.status_code == 404
        body = response.json()
        assert body["error"]["code"] == "HTTP_ERROR"

    def test_request_validation_error_returns_fields(self):
        client = TestClient(_make_app(), raise_server_exceptions=False)
        response = client.post("/validate", json={})

        assert response.status_code == 422
        body = response.json()
        assert body["error"]["code"] == "VALIDATION_FAILED"
        assert "name" in body["error"]["fields"]

    def test_unhandled_exception_returns_a_generic_500(self):
        client = TestClient(_make_app(), raise_server_exceptions=False)
        response = client.get("/boom")

        assert response.status_code == 500
        assert response.json() == {"error": {"code": "INTERNAL_ERROR", "message": "An unexpected error occurred."}}
