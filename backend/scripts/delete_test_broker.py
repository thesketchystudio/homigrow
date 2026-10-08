"""
backend/scripts/delete_test_broker.py

Deletes all data tied to a single broker test-user email from the dev
database. Removes otp_codes rows for that email (keyed by email, not
user_id, so not covered by any cascade) and the users row itself, which
cascades to broker_profiles and refresh_tokens via each table's
ondelete=CASCADE. Counterpart to create_test_broker.py.

The default account owns no properties, so this always succeeds
cleanly. If pointed at a different broker email that does own
listings, note that properties.broker_id is RESTRICT (not CASCADE) —
the delete would fail loudly rather than orphaning/cascading them,
which is the right behavior; use delete_test_property.py for those
first.

Usage:
    python scripts/delete_test_broker.py                          # deletes DEFAULT_EMAIL
    python scripts/delete_test_broker.py someone@example.com       # deletes a specific email
"""

import sys
from pathlib import Path

# Allows running this script directly (`python scripts/delete_test_broker.py`)
# without needing the backend root on PYTHONPATH already.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.db.session import SessionLocal  # noqa: E402
from app.models.otp_code import OTPCode  # noqa: E402
from app.models.user import User  # noqa: E402

# Matches create_test_broker.py's DEFAULT_EMAIL, so the two scripts
# round-trip the same account.
DEFAULT_EMAIL = "broker.login.test@homigrow.local"


def delete_test_broker(email: str) -> None:
    db = SessionLocal()
    try:
        otp_deleted = db.query(OTPCode).filter(OTPCode.email == email).delete(synchronize_session=False)
        user_deleted = db.query(User).filter(User.email == email).delete(synchronize_session=False)
        db.commit()
        print(f"Deleted {user_deleted} user row(s) and {otp_deleted} otp_codes row(s) for {email}")
    finally:
        db.close()


if __name__ == "__main__":
    if len(sys.argv) > 2:
        print("Usage: python scripts/delete_test_broker.py [email]")
        sys.exit(1)
    delete_test_broker(sys.argv[1] if len(sys.argv) == 2 else DEFAULT_EMAIL)
