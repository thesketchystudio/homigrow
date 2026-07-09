"""
app/api/v1/routes/auth.py

Auth endpoints: signup, login, refresh, and logout (password path).
Routes only parse/validate input and translate the service result into
a response schema — no business logic here (03_Backend_Architecture.md
layering rules). The refresh token itself never appears in a JSON
body; it travels only as the httpOnly cookie described in
14_Security.md §Token design.
"""

from fastapi import APIRouter, Depends, Request, Response
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import get_db
from app.schemas.auth import LoginRequest, SignupRequest, SignupResponse, TokenResponse, UserOut
from app.services import auth_service

router = APIRouter(prefix="/auth", tags=["auth"])

REFRESH_COOKIE_NAME = "refresh_token"
REFRESH_COOKIE_PATH = "/api/v1/auth"


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


@router.post("/signup", response_model=SignupResponse, status_code=201)
def signup(payload: SignupRequest, db: Session = Depends(get_db)) -> SignupResponse:
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
def refresh(request: Request, response: Response, db: Session = Depends(get_db)) -> TokenResponse:
    """
    Rotates the refresh-token cookie and issues a new access token.
    Reuse of an already-rotated token revokes every session belonging
    to that user (14_Security.md §Token design).
    """
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
def logout(request: Request, response: Response, db: Session = Depends(get_db)) -> None:
    """Revokes the current refresh-token session, if any, and clears the cookie. Idempotent."""
    auth_service.logout(db, request.cookies.get(REFRESH_COOKIE_NAME))
    response.delete_cookie(key=REFRESH_COOKIE_NAME, path=REFRESH_COOKIE_PATH)
