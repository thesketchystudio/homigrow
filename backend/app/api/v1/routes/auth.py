"""
app/api/v1/routes/auth.py

Auth endpoints: signup, login, Google Sign-In, refresh, logout,
email-OTP request/verify, and password forgot/reset (password path).
Routes only parse/validate input and translate the service result into
a response schema — no business logic here. The refresh token itself
never appears in a JSON body; it travels only as an httpOnly cookie.
Every route is rate-limited: 5/min/IP except otp/request at 3/min/IP.
"""

from fastapi import APIRouter, Depends, Request, Response
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.cookies import REFRESH_COOKIE_NAME, REFRESH_COOKIE_PATH
from app.core.middleware import limiter
from app.db.session import get_db
from app.schemas.auth import (
    ForgotPasswordRequest,
    GoogleAuthRequest,
    LoginRequest,
    OTPRequestRequest,
    OTPVerifyRequest,
    ResetPasswordRequest,
    SignupRequest,
    SignupResponse,
    TokenResponse,
    UserOut,
)
from app.services import auth_service

router = APIRouter(prefix="/auth", tags=["auth"])


def _set_refresh_cookie(response: Response, raw_token: str) -> None:
    """Sets the rotating refresh-token cookie: httpOnly, Secure in production, SameSite=Lax, scoped to the auth path."""
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


@router.post("/signup", response_model=SignupResponse, status_code=201)
@limiter.limit("5/minute")
def signup(payload: SignupRequest, request: Request, db: Session = Depends(get_db)) -> SignupResponse:
    """Creates a client or broker account and emails a signup-verification OTP."""
    user = auth_service.signup(
        db,
        phone=payload.phone,
        role=payload.role,
        full_name=payload.full_name,
        email=payload.email,
        password=payload.password,
        city=payload.city,
        state=payload.state,
        company_name=payload.company_name,
        rera_number=payload.rera_number,
        service_area=payload.service_area,
    )
    return SignupResponse(user_id=user.id)


@router.post("/otp/request", status_code=204)
@limiter.limit("3/minute")
def request_otp(payload: OTPRequestRequest, request: Request, db: Session = Depends(get_db)) -> None:
    """(Re)issues an email OTP for the given purpose — powers the signup screen's 'Resend OTP' action."""
    auth_service.request_otp(db, payload.email, payload.purpose)


@router.post("/otp/verify")
@limiter.limit("5/minute")
def verify_otp(payload: OTPVerifyRequest, request: Request, response: Response, db: Session = Depends(get_db)):
    """
    Verifies a submitted OTP; 401 OTP_INVALID on a wrong code, 410
    OTP_EXPIRED once no valid code remains. For OTPPurpose.signup,
    returns the same TokenResponse shape as /login (200) and sets the
    refresh cookie, logging the user straight in; every other purpose
    still returns 204.
    """
    session = auth_service.verify_otp(
        db,
        payload.email,
        payload.code,
        payload.purpose,
        user_agent=request.headers.get("user-agent"),
        ip=_client_ip(request),
    )
    if session is None:
        return Response(status_code=204)

    access_token, refresh_token, user = session
    _set_refresh_cookie(response, refresh_token)
    return TokenResponse(
        access_token=access_token,
        expires_in=settings.JWT_ACCESS_TTL_MIN * 60,
        user=UserOut.model_validate(user),
    )


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


@router.post("/google", response_model=TokenResponse)
@limiter.limit("5/minute")
def google_auth(payload: GoogleAuthRequest, request: Request, response: Response, db: Session = Depends(get_db)) -> TokenResponse:
    """
    Google Sign-In. Verifies the ID token from Google Identity Services;
    logs in if the email matches an existing account (role is ignored),
    or creates one if payload.role is supplied (signup Step 2 only —
    the login page sends no role, so an unmatched email 404s instead of
    silently creating an account).
    """
    access_token, refresh_token, user = auth_service.google_auth(
        db,
        payload.id_token,
        payload.role,
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
    to that user.
    """
    auth_service.validate_refresh_origin(request.headers.get("origin"))
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
    """Always 204, regardless of whether the email is registered (avoids leaking which emails have accounts)."""
    auth_service.forgot_password(db, payload.email)


@router.post("/password/reset", status_code=204)
@limiter.limit("5/minute")
def reset_password(payload: ResetPasswordRequest, request: Request, db: Session = Depends(get_db)) -> None:
    """Verifies the reset token, sets the new password, and revokes every active session for that user."""
    auth_service.reset_password(db, payload.token, payload.new_password)
