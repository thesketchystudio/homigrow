"""
tests/test_conftest_fixtures.py

Verifies the db_session fixture's core guarantee: rows created inside
a test do not survive past it.
"""

from sqlalchemy import text

from app.db.session import engine
from app.models.enums import UserRole
from app.models.user import User


def test_row_created_in_session_is_visible_within_the_test(db_session):
    """A row inserted through db_session is queryable within the same test."""
    user = User(phone="+919999999998", role=UserRole.client, full_name="Rollback Check")
    db_session.add(user)
    db_session.flush()

    found = db_session.query(User).filter(User.phone == "+919999999998").first()
    assert found is not None
    assert found.full_name == "Rollback Check"


def test_previous_test_row_did_not_persist():
    """
    Queries through a separate connection, outside any fixture's
    transaction, to confirm the previous test's row was rolled back.
    """
    with engine.connect() as conn:
        count = conn.execute(
            text("SELECT count(*) FROM users WHERE phone = :phone"),
            {"phone": "+919999999998"},
        ).scalar()
    assert count == 0
