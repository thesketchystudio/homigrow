"""
backend/scripts/delete_test_user.py

Deletes all data tied to a single email address from the dev database,
so that one address can be reused repeatedly for manual signup testing
(Resend's sandbox only delivers real email to one verified address).
Removes otp_codes rows for that email (keyed by email, not user_id, so
not covered by any cascade) and the users row itself, which cascades to
broker_profiles and refresh_tokens via each table's ondelete=CASCADE.

Usage:
    python scripts/delete_test_user.py hello@thesketchystudio.com
"""

import sys
from pathlib import Path

# Allows running this script directly (`python scripts/delete_test_user.py`)
# without needing the backend root on PYTHONPATH already.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.db.session import SessionLocal  # noqa: E402
from app.models.otp_code import OTPCode  # noqa: E402
from app.models.user import User  # noqa: E402


def delete_test_user(email: str) -> None:
    db = SessionLocal()
    try:
        otp_deleted = db.query(OTPCode).filter(OTPCode.email == email).delete(synchronize_session=False)
        user_deleted = db.query(User).filter(User.email == email).delete(synchronize_session=False)
        db.commit()
        print(f"Deleted {user_deleted} user row(s) and {otp_deleted} otp_codes row(s) for {email}")
    finally:
        db.close()


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python scripts/delete_test_user.py <email>")
        sys.exit(1)
    delete_test_user(sys.argv[1])
