"""
app/api/v1/deps.py

FastAPI dependency callables for authentication and role-based access
control. Every non-public route depends on CurrentUser or one of the
RequireX role aliases defined here (03_Backend_Architecture.md
§Authorization) rather than decoding tokens or checking roles inline.
"""

from typing import Annotated, Optional
from uuid import UUID

import jwt
from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.exceptions import AuthError, ForbiddenError
from app.core.security import decode_access_token
from app.db.session import get_db
from app.models.enums import UserRole
from app.models.user import User

_bearer_scheme = HTTPBearer(auto_error=False)

_AUTH_REQUIRED = AuthError("AUTH_REQUIRED", "Authentication required.")


def get_current_user(
    credentials: Annotated[Optional[HTTPAuthorizationCredentials], Depends(_bearer_scheme)],
    db: Session = Depends(get_db),
) -> User:
    """Decodes the Authorization: Bearer access JWT and loads the corresponding user; 401 on any failure."""
    if credentials is None:
        raise _AUTH_REQUIRED

    try:
        payload = decode_access_token(credentials.credentials)
        user_id = UUID(payload["sub"])
    except jwt.ExpiredSignatureError:
        raise AuthError("TOKEN_EXPIRED", "Access token has expired.")
    except (jwt.InvalidTokenError, KeyError, ValueError):
        raise _AUTH_REQUIRED

    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise _AUTH_REQUIRED
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


def require_role(*roles: UserRole):
    """Dependency factory: 403s unless the current user's role is one of `roles`."""

    def _check_role(user: CurrentUser) -> User:
        if user.role not in roles:
            raise ForbiddenError("FORBIDDEN", "You do not have permission to perform this action.")
        return user

    return _check_role


RequireBroker = Annotated[User, Depends(require_role(UserRole.broker))]
RequireAdmin = Annotated[User, Depends(require_role(UserRole.admin))]
