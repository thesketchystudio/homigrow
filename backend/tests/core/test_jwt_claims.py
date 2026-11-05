"""
tests/core/test_jwt_claims.py

Covers the issuer/audience claims that keep access tokens and password-reset
tokens from being interchangeable, and the minimum JWT secret length.
"""

from datetime import datetime, timedelta, timezone
from uuid import uuid4

import jwt
import pytest

from app.core.config import MIN_JWT_SECRET_LENGTH, Settings, settings
from app.core.security import (
    ACCESS_TOKEN_AUDIENCE,
    JWT_ALGORITHM,
    JWT_ISSUER,
    RESET_TOKEN_AUDIENCE,
    create_access_token,
    create_password_reset_token,
    decode_access_token,
    decode_password_reset_token,
)


def _sign(**overrides) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(uuid4()),
        "role": "client",
        "iss": JWT_ISSUER,
        "aud": ACCESS_TOKEN_AUDIENCE,
        "iat": now,
        "exp": now + timedelta(minutes=5),
    }
    payload.update(overrides)
    payload = {key: value for key, value in payload.items() if value is not None}
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=JWT_ALGORITHM)


class TestTokenClaims:
    def test_access_token_carries_issuer_and_audience(self):
        payload = decode_access_token(create_access_token(uuid4(), "client"))
        assert payload["iss"] == JWT_ISSUER
        assert payload["aud"] == ACCESS_TOKEN_AUDIENCE

    def test_reset_token_carries_issuer_and_audience(self):
        payload = decode_password_reset_token(create_password_reset_token(uuid4(), "hash", 30))
        assert payload["iss"] == JWT_ISSUER
        assert payload["aud"] == RESET_TOKEN_AUDIENCE

    def test_reset_token_is_rejected_as_an_access_token(self):
        with pytest.raises(jwt.InvalidTokenError):
            decode_access_token(create_password_reset_token(uuid4(), "hash", 30))

    def test_access_token_is_rejected_as_a_reset_token(self):
        with pytest.raises(jwt.InvalidTokenError):
            decode_password_reset_token(create_access_token(uuid4(), "client"))

    def test_token_from_another_issuer_is_rejected(self):
        with pytest.raises(jwt.InvalidIssuerError):
            decode_access_token(_sign(iss="someone-else"))

    def test_token_without_audience_is_rejected(self):
        # What every token issued before audiences existed looks like.
        with pytest.raises(jwt.InvalidTokenError):
            decode_access_token(_sign(aud=None))

    def test_token_without_issuer_is_rejected(self):
        with pytest.raises(jwt.InvalidTokenError):
            decode_access_token(_sign(iss=None))

    def test_token_signed_with_another_secret_is_rejected(self):
        forged = jwt.encode(
            {"sub": "x", "iss": JWT_ISSUER, "aud": ACCESS_TOKEN_AUDIENCE, "iat": 1, "exp": 9999999999},
            "z" * 40,
            algorithm=JWT_ALGORITHM,
        )
        with pytest.raises(jwt.InvalidSignatureError):
            decode_access_token(forged)


class TestJwtSecretStrength:
    def test_short_secret_fails_startup(self):
        with pytest.raises(ValueError, match="JWT_SECRET"):
            Settings(JWT_SECRET="short-secret")

    def test_secret_at_minimum_length_is_accepted(self):
        assert Settings(JWT_SECRET="a" * MIN_JWT_SECRET_LENGTH).JWT_SECRET == "a" * MIN_JWT_SECRET_LENGTH
