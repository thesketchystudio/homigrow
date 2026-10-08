"""
backend/scripts/create_test_broker.py

Inserts a single broker test user (+ a verified BrokerProfile) directly
into the dev database, with is_email_verified already true and a real
password hash — skips the signup + email-OTP round trip entirely for
manual broker-portal UI testing. Counterpart to delete_test_broker.py;
run that first if the email is already taken.

Deliberately a SEPARATE identity from create_test_property.py's
DEFAULT_BROKER_EMAIL ("vikram.broker.test@homigrow.local") — that
broker owns 11 real demo listings used across the homepage/listings
pages, so treating it as a disposable login-test account would risk
either confusing shared demo data with throwaway test state, or a
delete_test_broker.py run failing loudly on the properties.broker_id
RESTRICT constraint. This script's account exists purely for manual
broker-portal login testing and owns no properties.

Usage:
    python scripts/create_test_broker.py                                   # creates the default test broker
    python scripts/create_test_broker.py <email> <phone> <full_name> <password>
"""

import sys
from pathlib import Path

# Allows running this script directly (`python scripts/create_test_broker.py`)
# without needing the backend root on PYTHONPATH already.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.core.security import hash_password  # noqa: E402
from app.db.session import SessionLocal  # noqa: E402
from app.models.broker_profile import BrokerProfile  # noqa: E402
from app.models.enums import UserRole, VerificationStatus  # noqa: E402
from app.models.user import User  # noqa: E402

DEFAULT_EMAIL = "broker.login.test@homigrow.local"
DEFAULT_PHONE = "9900022233"
DEFAULT_FULL_NAME = "Test Broker"
DEFAULT_PASSWORD = "Preetham-test"
DEFAULT_COMPANY_NAME = "Test Realty"


def create_test_broker(
    email: str,
    phone: str,
    full_name: str,
    password: str,
    company_name: str = DEFAULT_COMPANY_NAME,
) -> None:
    db = SessionLocal()
    try:
        user = User(
            phone=phone,
            email=email,
            password_hash=hash_password(password),
            full_name=full_name,
            role=UserRole.broker,
            is_email_verified=True,
        )
        db.add(user)
        db.flush()

        db.add(
            BrokerProfile(
                user_id=user.id,
                verification_status=VerificationStatus.verified,
                company_name=company_name,
            )
        )
        db.commit()
        print(f"Created broker {email} ({phone}), is_email_verified=True, verification_status=verified")
    finally:
        db.close()


if __name__ == "__main__":
    if len(sys.argv) == 1:
        create_test_broker(DEFAULT_EMAIL, DEFAULT_PHONE, DEFAULT_FULL_NAME, DEFAULT_PASSWORD)
        print(f"Log in with: {DEFAULT_EMAIL} / {DEFAULT_PASSWORD}")
    elif len(sys.argv) == 5:
        create_test_broker(*sys.argv[1:5])
    else:
        print("Usage: python scripts/create_test_broker.py [<email> <phone> <full_name> <password>]")
        sys.exit(1)
