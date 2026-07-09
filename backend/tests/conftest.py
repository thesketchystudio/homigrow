"""
tests/conftest.py

Shared pytest fixtures. db_session wraps each test in a transaction
that is rolled back afterward, so tests never leave data behind or
affect one another. client wires a TestClient to reuse that same
session via dependency override, so route tests run within the same
rollback boundary. The rate limiter is a process-wide singleton
(app/core/middleware.py), so its counters are reset before every test —
otherwise unrelated tests that happen to call the same auth endpoint
would accumulate against one another's request budget.
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import sessionmaker

from app.core.middleware import limiter
from app.core.security import hash_password
from app.db.session import engine, get_db
from app.main import app
from app.models.enums import UserRole
from app.models.user import User


@pytest.fixture(autouse=True)
def _reset_rate_limiter():
    """Clears slowapi's in-memory counters before each test so per-test rate-limit assertions don't leak across the suite."""
    limiter.reset()


@pytest.fixture()
def db_session():
    """Yields a database session bound to a transaction that is rolled back after the test."""
    connection = engine.connect()
    transaction = connection.begin()
    session = sessionmaker(bind=connection)()

    yield session

    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture()
def client(db_session):
    """Yields a TestClient with get_db overridden to use the transactional db_session."""

    def _get_db_override():
        yield db_session

    app.dependency_overrides[get_db] = _get_db_override
    yield TestClient(app)
    app.dependency_overrides.clear()


def make_user(
    db_session,
    *,
    phone: str = "+919876500000",
    role: UserRole = UserRole.client,
    password: str | None = "correct-horse-battery-staple",
    **kwargs,
) -> User:
    """
    Creates and flushes a User row for tests that need one already
    persisted, without going through the signup service/OTP flow.
    """
    user = User(
        phone=phone,
        role=role,
        password_hash=hash_password(password) if password else None,
        **kwargs,
    )
    db_session.add(user)
    db_session.flush()
    return user
