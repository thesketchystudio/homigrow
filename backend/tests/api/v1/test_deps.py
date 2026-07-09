"""
tests/api/v1/test_deps.py

Unit tests for get_current_user and require_role — called directly as
plain functions rather than through a route, since no protected
product route exists yet (deps.py itself is P2-T06's whole deliverable;
protected routes land with later tasks).
"""

from datetime import datetime, timedelta, timezone
from uuid import uuid4

import jwt
import pytest
from fastapi.security import HTTPAuthorizationCredentials

from app.api.v1.deps import get_current_user, require_role
from app.core.config import settings
from app.core.exceptions import AppError
from app.core.security import JWT_ALGORITHM, create_access_token
from app.models.enums import UserRole
from tests.conftest import make_user


def _bearer(token: str) -> HTTPAuthorizationCredentials:
    return HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)


class TestGetCurrentUser:
    def test_valid_token_returns_the_user(self, db_session):
        user = make_user(db_session, phone="+919876550001")
        token = create_access_token(user.id, user.role.value)

        resolved = get_current_user(_bearer(token), db_session)

        assert resolved.id == user.id

    def test_missing_credentials_raises_401(self, db_session):
        with pytest.raises(AppError) as exc_info:
            get_current_user(None, db_session)

        assert exc_info.value.status_code == 401
        assert exc_info.value.code == "AUTH_REQUIRED"

    def test_garbage_token_raises_401(self, db_session):
        with pytest.raises(AppError) as exc_info:
            get_current_user(_bearer("not-a-real-jwt"), db_session)

        assert exc_info.value.status_code == 401
        assert exc_info.value.code == "AUTH_REQUIRED"

    def test_expired_token_raises_401_token_expired(self, db_session):
        user = make_user(db_session, phone="+919876550002")
        expired_payload = {
            "sub": str(user.id),
            "role": user.role.value,
            "iat": datetime.now(timezone.utc) - timedelta(minutes=30),
            "exp": datetime.now(timezone.utc) - timedelta(minutes=15),
            "jti": str(uuid4()),
        }
        expired_token = jwt.encode(expired_payload, settings.JWT_SECRET, algorithm=JWT_ALGORITHM)

        with pytest.raises(AppError) as exc_info:
            get_current_user(_bearer(expired_token), db_session)

        assert exc_info.value.status_code == 401
        assert exc_info.value.code == "TOKEN_EXPIRED"

    def test_token_for_a_nonexistent_user_raises_401(self, db_session):
        token = create_access_token(uuid4(), UserRole.client.value)

        with pytest.raises(AppError) as exc_info:
            get_current_user(_bearer(token), db_session)

        assert exc_info.value.status_code == 401
        assert exc_info.value.code == "AUTH_REQUIRED"


class TestRequireRole:
    def test_matching_role_passes_through(self, db_session):
        broker = make_user(db_session, phone="+919876550003", role=UserRole.broker)
        check_broker = require_role(UserRole.broker)

        assert check_broker(broker).id == broker.id

    def test_mismatched_role_raises_403(self, db_session):
        client_user = make_user(db_session, phone="+919876550004", role=UserRole.client)
        check_broker = require_role(UserRole.broker)

        with pytest.raises(AppError) as exc_info:
            check_broker(client_user)

        assert exc_info.value.status_code == 403
        assert exc_info.value.code == "FORBIDDEN"

    def test_accepts_multiple_allowed_roles(self, db_session):
        admin = make_user(db_session, phone="+919876550005", role=UserRole.admin)
        check_broker_or_admin = require_role(UserRole.broker, UserRole.admin)

        assert check_broker_or_admin(admin).id == admin.id
