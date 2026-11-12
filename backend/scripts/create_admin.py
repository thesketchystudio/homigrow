"""
backend/scripts/create_admin.py

Creates an admin account directly in the database. This is the only way
an admin can come into existence: the public signup endpoint only ever
accepts the client and broker roles. The password is read from a hidden
prompt (or from the ADMIN_PASSWORD environment variable for unattended
runs) and must pass the same strength check every other password does.
Refuses to touch an email or phone that already belongs to an account,
so it can never silently promote an existing user to admin.

Usage:
    python scripts/create_admin.py <email> <phone> "<full name>"
"""

import getpass
import os
import sys
from pathlib import Path

# Allows running this script directly without the backend root on PYTHONPATH.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy import or_  # noqa: E402

from app.core.phone import normalize_indian_mobile  # noqa: E402
from app.core.security import hash_password, validate_password_strength  # noqa: E402
from app.db.session import SessionLocal  # noqa: E402
from app.models.enums import UserRole  # noqa: E402
from app.models.user import User  # noqa: E402


def _read_password() -> str:
    """Hidden prompt with confirmation, unless ADMIN_PASSWORD is set for a non-interactive run."""
    from_env = os.environ.get("ADMIN_PASSWORD")
    if from_env:
        return from_env
    first = getpass.getpass("Admin password: ")
    if first != getpass.getpass("Confirm password: "):
        sys.exit("Passwords do not match.")
    return first


def create_admin(email: str, phone: str, full_name: str, password: str) -> None:
    """Inserts one verified admin account; exits without changes if the email/phone is taken or the password is weak."""
    email = email.strip().lower()
    canonical_phone = normalize_indian_mobile(phone)
    if canonical_phone is None:
        sys.exit("Phone must be a valid Indian mobile number.")
    try:
        validate_password_strength(password)
    except ValueError as exc:
        sys.exit(str(exc))

    db = SessionLocal()
    try:
        taken = db.query(User.id).filter(or_(User.email == email, User.phone == canonical_phone)).first()
        if taken is not None:
            sys.exit("An account with this email or phone already exists; no changes made.")
        db.add(
            User(
                email=email,
                phone=canonical_phone,
                full_name=full_name.strip(),
                password_hash=hash_password(password),
                role=UserRole.admin,
                is_email_verified=True,
            )
        )
        db.commit()
        print(f"Created admin {email}.")
    finally:
        db.close()


if __name__ == "__main__":
    if len(sys.argv) != 4:
        print('Usage: python scripts/create_admin.py <email> <phone> "<full name>"')
        sys.exit(1)
    create_admin(sys.argv[1], sys.argv[2], sys.argv[3], _read_password())
