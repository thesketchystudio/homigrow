"""
backend/scripts/create_test_user.py

Inserts a single test user directly into the dev database, with
is_email_verified already true and a real password hash — skips the
signup + email-OTP round trip entirely for manual UI testing. Counterpart
to delete_test_user.py; run that first if the email is already taken.

Usage:
    python scripts/create_test_user.py <email> <phone> <full_name> <password> [role]

    role defaults to "client" if omitted.
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


def create_test_user(email: str, phone: str, full_name: str, password: str, role: str = "client") -> None:
    db = SessionLocal()
    try:
        user = User(
            phone=phone,
            email=email,
            password_hash=hash_password(password),
            full_name=full_name,
            role=UserRole(role),
            is_email_verified=True,
        )
        db.add(user)
        db.commit()
        print(f"Created user {email} ({phone}, role={role}), is_email_verified=True")
    finally:
        db.close()


if __name__ == "__main__":
    if len(sys.argv) not in (5, 6):
        print("Usage: python scripts/create_test_user.py <email> <phone> <full_name> <password> [role]")
        sys.exit(1)
    create_test_user(*sys.argv[1:6])
