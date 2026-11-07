"""
tests/core/test_exceptions.py

Exercises the exception-handling infrastructure itself (envelope shape
for AppError, plain HTTPException, request validation, and unhandled
exceptions) against a minimal throwaway app, independent of any real
product route.
"""

from fastapi import FastAPI
from fastapi.testclient import TestClient
from pydantic import BaseModel, Field, field_validator

from app.core.exceptions import ConflictError, install_exception_handlers


class _Body(BaseModel):
    name: str


class _CheckedBody(BaseModel):
    code: str

    @field_validator("code")
    @classmethod
    def _must_be_upper(cls, value: str) -> str:
        if value != value.upper():
            raise ValueError("Code must be upper case.")
        return value


class _LimitedBody(BaseModel):
    title: str = Field(max_length=10)
    tags: list[str] = Field(max_length=3)


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

    @app.post("/validate-limited")
    def _validate_limited(body: _LimitedBody):
        return {"title": body.title}

    @app.post("/validate-checked")
    def _validate_checked(body: _CheckedBody):
        return {"code": body.code}

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

    def test_custom_validator_message_has_no_pydantic_prefix(self):
        client = TestClient(_make_app(), raise_server_exceptions=False)
        response = client.post("/validate-checked", json={"code": "abc"})

        assert response.status_code == 422
        assert response.json()["error"]["fields"]["code"] == "Code must be upper case."

    def test_technical_pydantic_messages_become_plain_language(self):
        client = TestClient(_make_app(), raise_server_exceptions=False)

        missing = client.post("/validate", json={}).json()["error"]["fields"]["name"]
        wrong_type = client.post("/validate", json={"name": 5}).json()["error"]["fields"]["name"]

        assert missing == "This field is required."
        assert wrong_type == "Enter a valid value."

    def test_length_limits_name_the_limit(self):
        client = TestClient(_make_app(), raise_server_exceptions=False)

        response = client.post("/validate-limited", json={"title": "x" * 11, "tags": ["a"] * 4})

        fields = response.json()["error"]["fields"]
        assert fields["title"] == "Must be 10 characters or fewer."
        assert fields["tags"] == "Choose or enter at most 3 items."

    def test_unhandled_exception_returns_a_generic_500(self):
        client = TestClient(_make_app(), raise_server_exceptions=False)
        response = client.get("/boom")

        assert response.status_code == 500
        assert response.json() == {"error": {"code": "INTERNAL_ERROR", "message": "An unexpected error occurred."}}
