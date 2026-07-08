"""
app/core/security.py

Password hashing and access-JWT encode/decode — the only place auth
code touches bcrypt or JWT internals directly, so the hashing scheme
or token format can change without touching services/routes.
"""

from datetime import datetime, timedelta, timezone
from uuid import UUID, uuid4

import jwt
from passlib.context import CryptContext

from app.core.config import settings

_pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

JWT_ALGORITHM = "HS256"


def hash_password(password: str) -> str:
    """Hashes a plaintext password with bcrypt for storage."""
    return _pwd_context.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    """Checks a plaintext password against a stored bcrypt hash."""
    return _pwd_context.verify(password, password_hash)


def create_access_token(user_id: UUID, role: str) -> str:
    """
    Issues a signed access JWT. Claims per 14_Security.md token design:
    sub (user id), role, exp, jti — jti lets a specific token be
    identified later even though access tokens are never persisted.
    """
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(user_id),
        "role": role,
        "iat": now,
        "exp": now + timedelta(minutes=settings.JWT_ACCESS_TTL_MIN),
        "jti": str(uuid4()),
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_access_token(token: str) -> dict:
    """Verifies and decodes an access JWT. Raises a jwt exception on invalid/expired tokens."""
    return jwt.decode(token, settings.JWT_SECRET, algorithms=[JWT_ALGORITHM])
