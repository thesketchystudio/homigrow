"""
app/core/cookies.py

Shared refresh-token cookie name and path, referenced by every route
that sets or clears the cookie (auth login/refresh/logout, account
deactivation) so the two never drift apart.
"""

REFRESH_COOKIE_NAME = "refresh_token"
REFRESH_COOKIE_PATH = "/api/v1/auth"
