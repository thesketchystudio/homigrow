"""
app/core/cookies.py

Shared refresh-token cookie name, path and setter, referenced by every
route that sets or clears the cookie (auth login/refresh/logout, password
change, account deactivation) so they never drift apart.
"""

from fastapi import Response

from app.core.config import settings

REFRESH_COOKIE_NAME = "refresh_token"
REFRESH_COOKIE_PATH = "/api/v1/auth"


def set_refresh_cookie(response: Response, raw_token: str) -> None:
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
