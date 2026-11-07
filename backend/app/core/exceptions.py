"""
app/core/exceptions.py

The AppError hierarchy services raise for expected failures, plus the
global FastAPI handlers that translate every error path (AppError,
plain HTTPException, request validation, and unhandled exceptions)
into a single standard envelope:
{"error": {"code", "message", "fields"?}}.
"""

import logging
from typing import Optional

import sentry_sdk
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from slowapi.errors import RateLimitExceeded
from starlette.exceptions import HTTPException as StarletteHTTPException

logger = logging.getLogger(__name__)


class AppError(Exception):
    """
    Base class for expected, service-raised errors. Subclasses fix the
    HTTP status; `code` and `message` are supplied per raise site since
    they vary by resource (e.g. "PROPERTY_NOT_FOUND" vs "USER_NOT_FOUND").
    """

    status_code: int = 500

    def __init__(self, code: str, message: str, fields: Optional[dict] = None):
        self.code = code
        self.message = message
        self.fields = fields
        super().__init__(message)


class NotFoundError(AppError):
    status_code = 404


class ConflictError(AppError):
    status_code = 409


class ValidationFailed(AppError):
    status_code = 422


class AuthError(AppError):
    status_code = 401


class ForbiddenError(AppError):
    status_code = 403


class LockedError(AppError):
    """423 — used for account lockout (ACCOUNT_LOCKED)."""

    status_code = 423


class ExpiredError(AppError):
    """410 — a one-shot credential (password-reset token, later OTP) past its lifetime or already used."""

    status_code = 410


class RateLimited(AppError):
    status_code = 429


class ServiceUnavailable(AppError):
    """503: a dependency the request needs (file storage) failed; the request is safe to retry."""

    status_code = 503


def _error_response(status_code: int, code: str, message: str, fields: Optional[dict] = None) -> JSONResponse:
    body = {"code": code, "message": message}
    if fields:
        body["fields"] = fields
    return JSONResponse(status_code=status_code, content={"error": body})


# Pydantic prepends this to the message of any error raised from a custom
# validator; it is noise for end users, who see the message verbatim.
_VALUE_ERROR_PREFIX = "Value error, "


def _friendly_message(error: dict) -> str:
    """
    Turns pydantic's technical message into plain language a user can act
    on ("String should have at most 100 characters" -> "Must be 100
    characters or fewer"). Types without a rewrite keep pydantic's text, with
    the custom-validator prefix removed.
    """
    ctx = error.get("ctx") or {}
    kind = error["type"]
    if kind == "missing":
        return "This field is required."
    if kind == "string_too_long":
        return f"Must be {ctx['max_length']} characters or fewer."
    if kind == "string_too_short":
        return f"Must be at least {ctx['min_length']} characters."
    if kind == "too_long":
        return f"Choose or enter at most {ctx['max_length']} items."
    if kind == "too_short":
        return f"Enter at least {ctx['min_length']} items."
    if kind in ("greater_than", "greater_than_equal"):
        bound = ctx.get("gt", ctx.get("ge"))
        return f"Must be {'greater than' if kind == 'greater_than' else 'at least'} {bound}."
    if kind in ("less_than", "less_than_equal"):
        bound = ctx.get("lt", ctx.get("le"))
        return f"Must be {'less than' if kind == 'less_than' else 'at most'} {bound}."
    if kind in ("string_type", "int_type", "int_parsing", "float_type", "float_parsing", "bool_type", "enum", "literal_error"):
        return "Enter a valid value."
    return error["msg"].removeprefix(_VALUE_ERROR_PREFIX)


def _validation_fields(exc: RequestValidationError) -> dict:
    """Maps pydantic's error list to {field_path: plain-language message}, dropping the leading body/query/path location marker."""
    fields: dict = {}
    for error in exc.errors():
        loc = [str(part) for part in error["loc"] if part not in ("body", "query", "path")]
        key = ".".join(loc) or "__root__"
        fields[key] = _friendly_message(error)
    return fields


def app_error_handler(request: Request, exc: AppError) -> JSONResponse:
    return _error_response(exc.status_code, exc.code, exc.message, exc.fields)


def http_exception_handler(request: Request, exc: StarletteHTTPException) -> JSONResponse:
    """Wraps any plain HTTPException — ours use a {"code", "message"} detail dict; framework-raised ones (e.g. 404 route-not-found) carry a plain string."""
    if isinstance(exc.detail, dict) and "code" in exc.detail and "message" in exc.detail:
        return _error_response(exc.status_code, exc.detail["code"], exc.detail["message"])
    return _error_response(exc.status_code, "HTTP_ERROR", str(exc.detail))


def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    return _error_response(422, "VALIDATION_FAILED", "Request validation failed.", _validation_fields(exc))


def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Catch-all for anything not raised deliberately: logs, reports to Sentry, never leaks the stack trace to the client."""
    logger.exception("Unhandled exception")
    sentry_sdk.capture_exception(exc)
    return _error_response(500, "INTERNAL_ERROR", "An unexpected error occurred.")


def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded) -> JSONResponse:
    """Translates slowapi's exception into a RateLimited AppError so its status/code/message flow through app_error_handler like every other AppError subclass, rather than being duplicated here as literals."""
    return app_error_handler(request, RateLimited("RATE_LIMITED", "Too many requests. Please try again shortly."))


def install_exception_handlers(app: FastAPI) -> None:
    app.add_exception_handler(AppError, app_error_handler)
    app.add_exception_handler(StarletteHTTPException, http_exception_handler)
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    app.add_exception_handler(RateLimitExceeded, rate_limit_exceeded_handler)
    app.add_exception_handler(Exception, unhandled_exception_handler)
