"""
app/core/security.py

Password hashing, access-JWT encode/decode, refresh-token
generation/hashing, and password-reset token encode/decode — the only
place auth code touches bcrypt, JWT, or token internals directly, so
the hashing scheme or token format can change without touching
services/routes.
"""

import hashlib
import hmac
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional
from uuid import UUID, uuid4

import jwt
from passlib.context import CryptContext
from zxcvbn import zxcvbn

from app.core.config import settings

_pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

JWT_ALGORITHM = "HS256"
# Issuer and per-token-type audiences. Decoding requires them, so a token
# minted for one purpose (or by anything other than this API) is rejected
# by every other decoder even though they share one signing key.
JWT_ISSUER = "homigrow-api"
ACCESS_TOKEN_AUDIENCE = "homigrow:access"
RESET_TOKEN_AUDIENCE = "homigrow:password-reset"
_REQUIRED_CLAIMS = ["exp", "iat", "iss", "aud", "sub"]
PASSWORD_RESET_PURPOSE = "password_reset"
MIN_PASSWORD_STRENGTH_SCORE = 3


def hash_password(password: str) -> str:
    """Hashes a plaintext password with bcrypt for storage."""
    return _pwd_context.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    """Checks a plaintext password against a stored bcrypt hash."""
    return _pwd_context.verify(password, password_hash)


def _otp_key() -> bytes:
    """Derives a dedicated HMAC key for OTP codes from JWT_SECRET, so OTP digests share no key material with token signing."""
    return hashlib.sha256(b"otp-code:" + settings.JWT_SECRET.encode()).digest()


def hash_otp(code: str, email: str) -> str:
    """
    Digests a 6-digit OTP with HMAC-SHA256 keyed by a server secret. The
    code space is only a million values, so a slow hash adds little: it
    can be brute-forced offline if the table leaks, and it makes every
    legitimate check cost CPU. A keyed digest is cheap to verify and
    useless to an attacker without the secret. The email is mixed in so
    the same code never produces the same digest for two addresses.
    """
    return hmac.new(_otp_key(), f"{email}:{code}".encode(), hashlib.sha256).hexdigest()


def verify_otp_hash(code: str, email: str, expected_hash: str) -> bool:
    """Constant-time check of a submitted OTP against its stored digest."""
    return hmac.compare_digest(hash_otp(code, email), expected_hash)


def validate_password_strength(password: str) -> None:
    """
    Enforces a minimum zxcvbn strength score of 3 (of 0-4) server-side,
    independent of whatever a frontend meter shows, since client-side
    validation can always be bypassed. Raises
    ValueError (not an AppError) so pydantic field_validators can call
    this directly and let it fold into the normal 422 validation-error
    envelope alongside every other field-level check.
    """
    if zxcvbn(password)["score"] < MIN_PASSWORD_STRENGTH_SCORE:
        raise ValueError("Password is too weak. Try a longer, less predictable phrase.")


def create_access_token(user_id: UUID, role: str) -> str:
    """
    Issues a signed access JWT. Claims: sub (user id), role, exp, jti —
    jti lets a specific token be identified later even though access
    tokens are never persisted.
    """
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(user_id),
        "role": role,
        "iss": JWT_ISSUER,
        "aud": ACCESS_TOKEN_AUDIENCE,
        "iat": now,
        "exp": now + timedelta(minutes=settings.JWT_ACCESS_TTL_MIN),
        "jti": str(uuid4()),
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_access_token(token: str) -> dict:
    """Verifies and decodes an access JWT. Raises a jwt exception on invalid/expired tokens."""
    return jwt.decode(
        token,
        settings.JWT_SECRET,
        algorithms=[JWT_ALGORITHM],
        audience=ACCESS_TOKEN_AUDIENCE,
        issuer=JWT_ISSUER,
        options={"require": _REQUIRED_CLAIMS},
    )


def create_refresh_token() -> str:
    """Generates an opaque 256-bit random refresh token (the raw value handed to the client, never stored)."""
    return secrets.token_urlsafe(32)


def hash_refresh_token(token: str) -> str:
    """
    Hashes an opaque refresh token for storage/lookup. A fast digest is
    sufficient here (unlike passwords): the input is already a 256-bit
    random value, not a low-entropy secret that needs bcrypt's cost
    factor to resist brute-forcing.
    """
    return hashlib.sha256(token.encode()).hexdigest()


def password_fingerprint(password_hash: Optional[str]) -> str:
    """
    Short, non-reversible fingerprint of a user's current password_hash.
    Embedding this in a password-reset token lets the token
    self-invalidate the moment the password actually changes, without a
    dedicated reset_tokens table: once reset_password() overwrites
    password_hash, replaying the same token no longer fingerprint-matches.
    """
    return hashlib.sha256((password_hash or "").encode()).hexdigest()[:16]


def create_password_reset_token(user_id: UUID, password_hash: Optional[str], ttl_minutes: int) -> str:
    """Issues a signed, short-lived, purpose-scoped password-reset token — never accepted as an access token or vice versa."""
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(user_id),
        "iss": JWT_ISSUER,
        "aud": RESET_TOKEN_AUDIENCE,
        "purpose": PASSWORD_RESET_PURPOSE,
        "pwd_fp": password_fingerprint(password_hash),
        "iat": now,
        "exp": now + timedelta(minutes=ttl_minutes),
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_password_reset_token(token: str) -> dict:
    """
    Verifies and decodes a password-reset token. Raises a jwt exception
    on invalid/expired tokens, or if the token's purpose claim doesn't
    match — an access token can never be replayed as a reset token.
    """
    payload = jwt.decode(
        token,
        settings.JWT_SECRET,
        algorithms=[JWT_ALGORITHM],
        audience=RESET_TOKEN_AUDIENCE,
        issuer=JWT_ISSUER,
        options={"require": _REQUIRED_CLAIMS},
    )
    if payload.get("purpose") != PASSWORD_RESET_PURPOSE:
        raise jwt.InvalidTokenError("Not a password-reset token.")
    return payload
