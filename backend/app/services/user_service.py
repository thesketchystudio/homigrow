"""
app/services/user_service.py

Self-service account management for the authenticated user: profile
read/update, password change, active-session listing/revocation, and
soft account deactivation. Every function here operates on the
CurrentUser row already resolved by api/v1/deps.py — none of it
re-authenticates, it only authorizes and mutates.
"""

import logging
from datetime import datetime, timezone
from typing import Optional
from uuid import UUID

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.exceptions import AuthError, ConflictError, NotFoundError, ValidationFailed
from app.core.security import hash_password, verify_password
from app.models.enums import OTPPurpose, PropertyStatus, UserRole
from app.models.property import Property
from app.models.refresh_token import REVOKED_ENDED, RefreshToken
from app.models.user import User
from app.services import auth_service

logger = logging.getLogger(__name__)


def update_me(
    db: Session,
    user: User,
    *,
    full_name: Optional[str],
    avatar_url: Optional[str],
    preferences: Optional[dict],
    broker_profile: Optional[dict] = None,
) -> User:
    """
    Applies only the fields the caller actually supplied (None means
    "leave unchanged", not "clear"). Email is deliberately not editable
    here: changing it goes through request_email_change/confirm_email_change
    so it is re-authenticated and verified before it replaces the old one.
    """
    if broker_profile is not None and user.broker_profile is not None:
        for field, value in broker_profile.items():
            setattr(user.broker_profile, field, value)

    if full_name is not None:
        user.full_name = full_name
    if avatar_url is not None:
        user.avatar_url = avatar_url
    if preferences is not None:
        user.preferences = preferences

    db.commit()
    db.refresh(user)
    return user


def _verify_current_password(db: Session, user: User, current_password: Optional[str]) -> None:
    """
    Re-authenticates the caller with their password before a sensitive
    change. Enforces and feeds the same lockout as login, so a stolen
    access token cannot be used to guess the password without limit. An
    account with no password has nothing to guess and is always refused.
    """
    bad_current_password = AuthError("BAD_CURRENT_PASSWORD", "Current password is incorrect.")

    if user.password_hash is None or current_password is None:
        raise bad_current_password
    auth_service.ensure_not_locked(user)
    if not verify_password(current_password, user.password_hash):
        auth_service.record_failed_password(db, user)
        raise bad_current_password

    user.failed_login_attempts = 0
    user.locked_until = None


def change_password(
    db: Session,
    user: User,
    current_password: str,
    new_password: str,
    user_agent: Optional[str] = None,
    ip: Optional[str] = None,
) -> tuple[str, str]:
    """
    Verifies the current password, sets the new one and signs every session
    out, since whoever held a stolen session must not survive the change.
    The caller's own session is replaced by a fresh one, returned as
    (access_token, refresh_token); the refresh cookie's path keeps the
    current session's id out of reach of this endpoint, so replacing it is
    simpler and safer than trying to spare just that one.
    """
    _verify_current_password(db, user, current_password)

    user.password_hash = hash_password(new_password)
    auth_service.revoke_all_sessions(db, user.id)
    tokens = auth_service.issue_session(db, user, user_agent, ip)
    db.commit()
    return tokens


def request_email_change(db: Session, user: User, new_email: str, current_password: Optional[str]) -> None:
    """
    Starts an email change by sending a code to the new address. The change
    is re-authenticated first: a password account must supply its password,
    and an account without one (Google sign-in) additionally gets a code at
    its current address, which only the real mailbox owner can read. Without
    this a stolen session could swap the email and then use "forgot
    password" to take the account permanently.
    """
    if user.has_password:
        _verify_current_password(db, user, current_password)
        db.commit()

    if new_email == user.email:
        raise ValidationFailed(
            "EMAIL_UNCHANGED", "This is already your email address.", {"new_email": "This is already your email address."}
        )
    if db.query(User).filter(User.email == new_email, User.id != user.id).first() is not None:
        raise ConflictError("EMAIL_TAKEN", "This email is already registered.")

    auth_service.request_otp(db, new_email, OTPPurpose.email_change)
    if not user.has_password and user.email:
        auth_service.request_otp(db, user.email, OTPPurpose.email_change)


def confirm_email_change(
    db: Session, user: User, new_email: str, code: str, current_email_code: Optional[str]
) -> User:
    """
    Completes an email change once the code sent to the new address (and,
    for accounts without a password, the one sent to the current address)
    checks out. Both codes are verified before either is spent, so a wrong
    second code doesn't waste the first. The new address is marked verified
    since the code proves the owner reads that mailbox.
    """
    needs_current_code = not user.has_password and user.email is not None
    if needs_current_code and not current_email_code:
        message = "Enter the code sent to your current email."
        raise ValidationFailed("CURRENT_EMAIL_CODE_REQUIRED", message, {"current_email_code": message})

    if db.query(User).filter(User.email == new_email, User.id != user.id).first() is not None:
        raise ConflictError("EMAIL_TAKEN", "This email is already registered.")

    now = datetime.now(timezone.utc)
    new_row = auth_service.check_otp(db, new_email, code, OTPPurpose.email_change)
    current_row = (
        auth_service.check_otp(db, user.email, current_email_code, OTPPurpose.email_change) if needs_current_code else None
    )

    new_row.consumed_at = now
    if current_row is not None:
        current_row.consumed_at = now
    user.email = new_email
    user.is_email_verified = True

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise ConflictError("EMAIL_TAKEN", "This email is already registered.")

    db.refresh(user)
    return user


def list_sessions(db: Session, user: User) -> list[RefreshToken]:
    """Returns the user's active (unrevoked, unexpired) refresh-token sessions, newest first."""
    now = datetime.now(timezone.utc)
    return (
        db.query(RefreshToken)
        .filter(
            RefreshToken.user_id == user.id,
            RefreshToken.revoked_at.is_(None),
            RefreshToken.expires_at > now,
        )
        .order_by(RefreshToken.created_at.desc())
        .all()
    )


def revoke_session(db: Session, user: User, session_id: UUID) -> None:
    """Revokes one of the user's own sessions. 404s on a missing or not-owned id; idempotent if already revoked."""
    row = db.query(RefreshToken).filter(RefreshToken.id == session_id, RefreshToken.user_id == user.id).first()
    if row is None:
        raise NotFoundError("SESSION_NOT_FOUND", "Session not found.")

    if row.revoked_at is None:
        row.revoked_at = datetime.now(timezone.utc)
        row.revoked_reason = REVOKED_ENDED
        db.commit()


def revoke_all_sessions(db: Session, user: User) -> None:
    """Revokes every active session for the user (logout-all, powers the Security tab)."""
    db.query(RefreshToken).filter(
        RefreshToken.user_id == user.id,
        RefreshToken.revoked_at.is_(None),
    ).update({"revoked_at": datetime.now(timezone.utc), "revoked_reason": REVOKED_ENDED}, synchronize_session=False)
    db.commit()


def deactivate_account(db: Session, user: User) -> None:
    """
    Soft-deactivates the account (is_active=false) and revokes every
    session. A broker with a live (status=active) listing is blocked
    with 409 until those listings are transferred or closed via the
    broker flow — deactivating an account shouldn't be able to silently
    orphan an active marketplace listing.
    """
    if user.role == UserRole.broker:
        has_active_listing = (
            db.query(Property.id)
            .filter(Property.broker_id == user.id, Property.status == PropertyStatus.active)
            .first()
            is not None
        )
        if has_active_listing:
            raise ConflictError(
                "ACTIVE_LISTINGS_EXIST",
                "Close or transfer your active listings before deactivating your account.",
            )

    user.is_active = False
    db.query(RefreshToken).filter(
        RefreshToken.user_id == user.id,
        RefreshToken.revoked_at.is_(None),
    ).update({"revoked_at": datetime.now(timezone.utc), "revoked_reason": REVOKED_ENDED}, synchronize_session=False)
    db.commit()
