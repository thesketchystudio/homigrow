"""
app/services/auth_service.py

Password-path signup and login, plus refresh-token issuance, rotation,
and revocation. Signup creates the user (and a broker_profile row when
role=broker) and issues a phone-verification OTP; login checks
credentials and enforces the lockout policy, then issues a session
(access token + refresh token). refresh() rotates a presented refresh
token and detects reuse of an already-rotated one as a theft signal
(14_Security.md §Token design).
"""

import ipaddress
import logging
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional

from sqlalchemy import or_
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.exceptions import AuthError, ConflictError, LockedError
from app.core.security import (
    create_access_token,
    create_refresh_token,
    hash_password,
    hash_refresh_token,
    verify_password,
)
from app.models.broker_profile import BrokerProfile
from app.models.enums import OTPPurpose, UserRole
from app.models.otp_code import OTPCode
from app.models.refresh_token import RefreshToken
from app.models.user import User

logger = logging.getLogger(__name__)

OTP_EXPIRE_MINUTES = 10
LOCKOUT_THRESHOLD = 5
LOCKOUT_MINUTES = 15

REFRESH_INVALID = AuthError("REFRESH_INVALID", "Session expired or invalid, please log in again.")


def _safe_ip(host: Optional[str]) -> Optional[str]:
    """
    Returns host if it parses as a valid IP address, else None. Guards
    the refresh_tokens.ip column (Postgres INET) against non-IP client
    hosts such as the test client's "testclient" placeholder.
    """
    if not host:
        return None
    try:
        ipaddress.ip_address(host)
        return host
    except ValueError:
        return None


def _issue_refresh_token(
    db: Session, user: User, user_agent: Optional[str], ip: Optional[str]
) -> str:
    """Creates a new refresh_tokens row and returns the raw (unhashed) token to hand to the client."""
    raw_token = create_refresh_token()
    db.add(
        RefreshToken(
            user_id=user.id,
            token_hash=hash_refresh_token(raw_token),
            user_agent=user_agent,
            ip=_safe_ip(ip),
            expires_at=datetime.now(timezone.utc) + timedelta(days=settings.JWT_REFRESH_TTL_DAYS),
        )
    )
    return raw_token


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
        raise ConflictError("PHONE_TAKEN", "This phone number is already registered.")

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
        raise ConflictError("EMAIL_TAKEN", "This email is already registered.")

    db.refresh(user)
    return user


def login(
    db: Session,
    phone_or_email: str,
    password: str,
    user_agent: Optional[str] = None,
    ip: Optional[str] = None,
) -> tuple[str, str, User]:
    """
    Verifies credentials and enforces the lockout policy: 5 consecutive
    failures locks the account for 15 minutes, reset on success.
    Returns an access token, a raw refresh token, and the authenticated
    user.
    """
    bad_credentials = AuthError("BAD_CREDENTIALS", "Invalid phone/email or password.")

    user = (
        db.query(User)
        .filter(or_(User.phone == phone_or_email, User.email == phone_or_email))
        .first()
    )
    if user is None or user.password_hash is None:
        raise bad_credentials

    now = datetime.now(timezone.utc)
    if user.locked_until is not None and user.locked_until > now:
        raise LockedError("ACCOUNT_LOCKED", "Account temporarily locked due to repeated failed logins.")

    if not verify_password(password, user.password_hash):
        user.failed_login_attempts += 1
        if user.failed_login_attempts >= LOCKOUT_THRESHOLD:
            user.locked_until = now + timedelta(minutes=LOCKOUT_MINUTES)
        db.commit()
        raise bad_credentials

    user.failed_login_attempts = 0
    user.locked_until = None

    access_token = create_access_token(user.id, user.role.value)
    refresh_token = _issue_refresh_token(db, user, user_agent, ip)
    db.commit()
    db.refresh(user)

    return access_token, refresh_token, user


def refresh(
    db: Session,
    raw_token: Optional[str],
    user_agent: Optional[str] = None,
    ip: Optional[str] = None,
) -> tuple[str, str, User]:
    """
    Rotates a presented refresh token: revokes it and issues a new
    access/refresh pair. Presenting a token whose row is already
    revoked is the reuse/theft signal from 14_Security.md — instead of
    just failing, it revokes every active refresh token belonging to
    that user, forcing re-login everywhere.
    """
    if not raw_token:
        raise REFRESH_INVALID

    row = db.query(RefreshToken).filter(RefreshToken.token_hash == hash_refresh_token(raw_token)).first()
    if row is None:
        raise REFRESH_INVALID

    now = datetime.now(timezone.utc)

    if row.revoked_at is not None:
        db.query(RefreshToken).filter(
            RefreshToken.user_id == row.user_id,
            RefreshToken.revoked_at.is_(None),
        ).update({"revoked_at": now}, synchronize_session=False)
        db.commit()
        raise REFRESH_INVALID

    if row.expires_at <= now:
        raise REFRESH_INVALID

    user = db.query(User).filter(User.id == row.user_id).first()
    if user is None:
        raise REFRESH_INVALID

    row.revoked_at = now
    access_token = create_access_token(user.id, user.role.value)
    new_refresh_token = _issue_refresh_token(db, user, user_agent, ip)
    db.commit()

    return access_token, new_refresh_token, user


def logout(db: Session, raw_token: Optional[str]) -> None:
    """
    Revokes the session identified by the presented refresh-token
    cookie, if any. Idempotent: a missing, unknown, or already-revoked
    token is not an error — the caller's intent (be logged out) is
    already satisfied.
    """
    if not raw_token:
        return

    row = db.query(RefreshToken).filter(RefreshToken.token_hash == hash_refresh_token(raw_token)).first()
    if row is not None and row.revoked_at is None:
        row.revoked_at = datetime.now(timezone.utc)
        db.commit()
