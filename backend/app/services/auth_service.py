"""
app/services/auth_service.py

Password-path signup and login. Signup creates the user (and a
broker_profile row when role=broker) and issues a phone-verification
OTP; login checks credentials and enforces the lockout policy.
Refresh-token issuance is added on top of login's return value in
P2-T05 — this module intentionally does not touch refresh_tokens.
"""

import logging
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import HTTPException
from sqlalchemy import or_
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import create_access_token, hash_password, verify_password
from app.models.broker_profile import BrokerProfile
from app.models.enums import OTPPurpose, UserRole
from app.models.otp_code import OTPCode
from app.models.user import User

logger = logging.getLogger(__name__)

OTP_EXPIRE_MINUTES = 10
LOCKOUT_THRESHOLD = 5
LOCKOUT_MINUTES = 15


def _issue_otp(db: Session, phone: str, purpose: OTPPurpose) -> None:
    """
    Generates, hashes, and stores a 6-digit OTP. Real delivery
    (sms_service.py's MSG91 adapter) lands in P2-T10; until then this
    logs the code in non-production environments as the interim
    dev-mode delivery path the docs describe for that task.
    """
    code = f"{secrets.randbelow(1_000_000):06d}"
    db.add(
        OTPCode(
            phone=phone,
            code_hash=hash_password(code),
            purpose=purpose,
            expires_at=datetime.now(timezone.utc) + timedelta(minutes=OTP_EXPIRE_MINUTES),
        )
    )

    if settings.ENVIRONMENT != "production":
        logger.info("OTP for %s (%s): %s", phone, purpose.value, code)


def signup(
    db: Session,
    phone: str,
    role: UserRole,
    full_name: Optional[str],
    email: Optional[str],
    password: Optional[str],
) -> User:
    """
    Creates a user (and a broker_profile row when role=broker), then
    issues a signup OTP. Raises 409 PHONE_TAKEN if the phone is already
    registered, 409 EMAIL_TAKEN on a concurrent duplicate email.
    """
    if db.query(User).filter(User.phone == phone).first() is not None:
        raise HTTPException(
            status_code=409,
            detail={"code": "PHONE_TAKEN", "message": "This phone number is already registered."},
        )

    user = User(
        phone=phone,
        email=email,
        full_name=full_name,
        password_hash=hash_password(password) if password else None,
        role=role,
    )
    db.add(user)
    db.flush()  # assigns user.id for the broker_profile FK below

    if role == UserRole.broker:
        db.add(BrokerProfile(user_id=user.id))

    _issue_otp(db, phone, OTPPurpose.signup)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail={"code": "EMAIL_TAKEN", "message": "This email is already registered."},
        )

    db.refresh(user)
    return user


def login(db: Session, phone_or_email: str, password: str) -> tuple[str, User]:
    """
    Verifies credentials and enforces the lockout policy: 5 consecutive
    failures locks the account for 15 minutes, reset on success.
    Returns an access token and the authenticated user.
    """
    bad_credentials = HTTPException(
        status_code=401,
        detail={"code": "BAD_CREDENTIALS", "message": "Invalid phone/email or password."},
    )

    user = (
        db.query(User)
        .filter(or_(User.phone == phone_or_email, User.email == phone_or_email))
        .first()
    )
    if user is None or user.password_hash is None:
        raise bad_credentials

    now = datetime.now(timezone.utc)
    if user.locked_until is not None and user.locked_until > now:
        raise HTTPException(
            status_code=423,
            detail={
                "code": "ACCOUNT_LOCKED",
                "message": "Account temporarily locked due to repeated failed logins.",
            },
        )

    if not verify_password(password, user.password_hash):
        user.failed_login_attempts += 1
        if user.failed_login_attempts >= LOCKOUT_THRESHOLD:
            user.locked_until = now + timedelta(minutes=LOCKOUT_MINUTES)
        db.commit()
        raise bad_credentials

    user.failed_login_attempts = 0
    user.locked_until = None
    db.commit()
    db.refresh(user)

    token = create_access_token(user.id, user.role.value)
    return token, user
