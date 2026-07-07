"""
tests/conftest.py

Shared pytest fixtures. db_session wraps each test in a transaction
that is rolled back afterward, so tests never leave data behind or
affect one another. client wires a TestClient to reuse that same
session via dependency override, so route tests run within the same
rollback boundary.
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import sessionmaker

from app.db.session import engine, get_db
from app.main import app


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
