"""
backend/scripts/create_test_user.py

Inserts a single test user directly into the dev database, with
is_email_verified already true and a real password hash — skips the
signup + email-OTP round trip entirely for manual UI testing. Counterpart
to delete_test_user.py; run that first if the email is already taken.

Usage:
    python scripts/create_test_user.py                                    # creates the default test user
    python scripts/create_test_user.py <email> <phone> <full_name> <password> [role]

    role defaults to "client" if omitted. With no arguments, creates
    DEFAULT_EMAIL/DEFAULT_PHONE/DEFAULT_FULL_NAME/DEFAULT_PASSWORD (plus
    DEFAULT_CITY/DEFAULT_STATE in preferences) so a delete_test_user.py +
    create_test_user.py round trip always leaves the same login-ready
    account behind — the one standing test user reused across manual
    testing and Playwright verification alike.
"""

import sys
from pathlib import Path

# Allows running this script directly (`python scripts/create_test_user.py`)
# without needing the backend root on PYTHONPATH already.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.core.security import hash_password  # noqa: E402
from app.db.session import SessionLocal  # noqa: E402
from app.models.enums import UserRole  # noqa: E402
from app.models.user import User  # noqa: E402

# Matches delete_test_user.py's DEFAULT_TEST_EMAIL, so the two scripts
# round-trip the same account.
DEFAULT_EMAIL = "hello@thesketchystudio.com"
DEFAULT_PHONE = "8789241225"
DEFAULT_FULL_NAME = "Preetham Kumar"
DEFAULT_PASSWORD = "Preetham-test"
DEFAULT_ROLE = "client"
DEFAULT_CITY = "Bengaluru"
DEFAULT_STATE = "Karnataka"


def create_test_user(
    email: str,
    phone: str,
    full_name: str,
    password: str,
    role: str = "client",
    city: str | None = None,
    state: str | None = None,
) -> None:
    db = SessionLocal()
    try:
        preferences = {}
        if city:
            preferences["city"] = city
        if state:
            preferences["state"] = state
        user = User(
            phone=phone,
            email=email,
            password_hash=hash_password(password),
            full_name=full_name,
            role=UserRole(role),
            is_email_verified=True,
            preferences=preferences,
        )
        db.add(user)
        db.commit()
        print(f"Created user {email} ({phone}, role={role}), is_email_verified=True")
    finally:
        db.close()


if __name__ == "__main__":
    if len(sys.argv) == 1:
        create_test_user(DEFAULT_EMAIL, DEFAULT_PHONE, DEFAULT_FULL_NAME, DEFAULT_PASSWORD, DEFAULT_ROLE, DEFAULT_CITY, DEFAULT_STATE)
        print(f"Log in with: {DEFAULT_EMAIL} / {DEFAULT_PASSWORD}")
    elif len(sys.argv) in (5, 6):
        create_test_user(*sys.argv[1:6])
    else:
        print("Usage: python scripts/create_test_user.py [<email> <phone> <full_name> <password> [role]]")
        sys.exit(1)
