"""
app/api/v1/routes/auth.py

Auth endpoints: signup, login, refresh, logout, and password
forgot/reset (password path). Routes only parse/validate input and
translate the service result into a response schema — no business
logic here (03_Backend_Architecture.md layering rules). The refresh
token itself never appears in a JSON body; it travels only as the
httpOnly cookie described in 14_Security.md §Token design. Every route
is rate-limited (P2-T08, ADR-010): 5/min/IP, per 03_Backend_Architecture.md.
"""

from fastapi import APIRouter, Depends, Request, Response
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.cookies import REFRESH_COOKIE_NAME, REFRESH_COOKIE_PATH
from app.core.middleware import limiter
from app.db.session import get_db
from app.schemas.auth import (
    ForgotPasswordRequest,
    LoginRequest,
    ResetPasswordRequest,
    SignupRequest,
    SignupResponse,
    TokenResponse,
    UserOut,
)
from app.services import auth_service

router = APIRouter(prefix="/auth", tags=["auth"])


def _set_refresh_cookie(response: Response, raw_token: str) -> None:
    """Sets the rotating refresh-token cookie per 14_Security.md: httpOnly, Secure in production, SameSite=Lax, scoped to the auth path."""
    response.set_cookie(
        key=REFRESH_COOKIE_NAME,
        value=raw_token,
        max_age=settings.JWT_REFRESH_TTL_DAYS * 24 * 3600,
        httponly=True,
        secure=settings.ENVIRONMENT == "production",
        samesite="lax",
        path=REFRESH_COOKIE_PATH,
    )


def _client_ip(request: Request) -> str | None:
    return request.client.host if request.client else None


def _validate_refresh_origin(request: Request) -> None:
    """
    CSRF defense-in-depth for the one cookie-authenticated endpoint
    (14_Security.md CSRF stance): SameSite=Lax already blocks the
    cookie from being sent on most cross-site requests, but browsers
    still attach it on some same-site-adjacent navigations. A present
    but mismatched Origin header is rejected outright; a same-origin or
    browser-omitted Origin (non-browser clients don't always send one)
    is allowed through.
    """
    origin = request.headers.get("origin")
    if origin is not None and origin != settings.FRONTEND_ORIGIN:
        raise auth_service.REFRESH_INVALID


@router.post("/signup", response_model=SignupResponse, status_code=201)
@limiter.limit("5/minute")
def signup(payload: SignupRequest, request: Request, db: Session = Depends(get_db)) -> SignupResponse:
    """Creates a client or broker account and triggers a signup OTP."""
    user = auth_service.signup(
        db,
        phone=payload.phone,
        role=payload.role,
        full_name=payload.full_name,
        email=payload.email,
        password=payload.password,
    )
    return SignupResponse(user_id=user.id)


@router.post("/login", response_model=TokenResponse)
@limiter.limit("5/minute")
def login(payload: LoginRequest, request: Request, response: Response, db: Session = Depends(get_db)) -> TokenResponse:
    """Authenticates by phone or email + password; enforces lockout; issues an access token and a refresh-token cookie."""
    access_token, refresh_token, user = auth_service.login(
        db,
        payload.phone_or_email,
        payload.password,
        user_agent=request.headers.get("user-agent"),
        ip=_client_ip(request),
    )
    _set_refresh_cookie(response, refresh_token)
    return TokenResponse(
        access_token=access_token,
        expires_in=settings.JWT_ACCESS_TTL_MIN * 60,
        user=UserOut.model_validate(user),
    )


@router.post("/refresh", response_model=TokenResponse)
@limiter.limit("5/minute")
def refresh(request: Request, response: Response, db: Session = Depends(get_db)) -> TokenResponse:
    """
    Rotates the refresh-token cookie and issues a new access token.
    Reuse of an already-rotated token revokes every session belonging
    to that user (14_Security.md §Token design).
    """
    _validate_refresh_origin(request)
    access_token, new_refresh_token, user = auth_service.refresh(
        db,
        request.cookies.get(REFRESH_COOKIE_NAME),
        user_agent=request.headers.get("user-agent"),
        ip=_client_ip(request),
    )
    _set_refresh_cookie(response, new_refresh_token)
    return TokenResponse(
        access_token=access_token,
        expires_in=settings.JWT_ACCESS_TTL_MIN * 60,
        user=UserOut.model_validate(user),
    )


@router.post("/logout", status_code=204)
@limiter.limit("5/minute")
def logout(request: Request, response: Response, db: Session = Depends(get_db)) -> None:
    """Revokes the current refresh-token session, if any, and clears the cookie. Idempotent."""
    auth_service.logout(db, request.cookies.get(REFRESH_COOKIE_NAME))
    response.delete_cookie(key=REFRESH_COOKIE_NAME, path=REFRESH_COOKIE_PATH)


@router.post("/password/forgot", status_code=204)
@limiter.limit("5/minute")
def forgot_password(payload: ForgotPasswordRequest, request: Request, db: Session = Depends(get_db)) -> None:
    """Always 204, regardless of whether the email is registered (no enumeration, per 05_API_Design.md)."""
    auth_service.forgot_password(db, payload.email)


@router.post("/password/reset", status_code=204)
@limiter.limit("5/minute")
def reset_password(payload: ResetPasswordRequest, request: Request, db: Session = Depends(get_db)) -> None:
    """Verifies the reset token, sets the new password, and revokes every active session for that user."""
    auth_service.reset_password(db, payload.token, payload.new_password)
