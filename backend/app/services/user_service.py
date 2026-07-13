"""
app/services/user_service.py

Self-service account management for the authenticated user: profile
read/update, password change, active-session listing/revocation, and
soft account deactivation (05_API_Design.md §users/me). Every function
here operates on the CurrentUser row already resolved by
api/v1/deps.py — none of it re-authenticates, it only authorizes and
mutates.
"""

import logging
from datetime import datetime, timezone
from typing import Optional
from uuid import UUID

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.exceptions import AuthError, ConflictError, NotFoundError
from app.core.security import hash_password, verify_password
from app.models.enums import PropertyStatus, UserRole
from app.models.property import Property
from app.models.refresh_token import RefreshToken
from app.models.user import User

logger = logging.getLogger(__name__)


def update_me(
    db: Session,
    user: User,
    *,
    full_name: Optional[str],
    email: Optional[str],
    avatar_url: Optional[str],
    preferences: Optional[dict],
) -> User:
    """
    Applies only the fields the caller actually supplied (None means
    "leave unchanged", not "clear"). Changing email resets
    is_email_verified — real verification-email delivery is P2-T30, so
    for now (like the existing OTP/reset-token paths) this only logs
    the notice in non-production environments.
    """
    if email is not None and email != user.email:
        if db.query(User).filter(User.email == email, User.id != user.id).first() is not None:
            raise ConflictError("EMAIL_TAKEN", "This email is already registered.")
        user.email = email
        user.is_email_verified = False
        if settings.ENVIRONMENT != "production":
            logger.info("Email verification needed for %s: %s", user.id, email)

    if full_name is not None:
        user.full_name = full_name
    if avatar_url is not None:
        user.avatar_url = avatar_url
    if preferences is not None:
        user.preferences = preferences

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise ConflictError("EMAIL_TAKEN", "This email is already registered.")

    db.refresh(user)
    return user


def change_password(db: Session, user: User, current_password: str, new_password: str) -> None:
    """
    Verifies the caller's current password before setting a new one.
    An OTP-only account (password_hash is None) has no current password
    to match against, so any current_password value is rejected as a
    mismatch rather than allowed through.
    """
    bad_current_password = AuthError("BAD_CURRENT_PASSWORD", "Current password is incorrect.")

    if user.password_hash is None or not verify_password(current_password, user.password_hash):
        raise bad_current_password

    user.password_hash = hash_password(new_password)
    db.commit()


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
        db.commit()


def revoke_all_sessions(db: Session, user: User) -> None:
    """Revokes every active session for the user (logout-all, powers the Security tab)."""
    db.query(RefreshToken).filter(
        RefreshToken.user_id == user.id,
        RefreshToken.revoked_at.is_(None),
    ).update({"revoked_at": datetime.now(timezone.utc)}, synchronize_session=False)
    db.commit()


def deactivate_account(db: Session, user: User) -> None:
    """
    Soft-deactivates the account (is_active=false) and revokes every
    session, per 05_API_Design.md. A broker with a live (status=active)
    listing is blocked with 409 until those listings are transferred or
    closed via the broker flow — deactivating an account shouldn't be
    able to silently orphan an active marketplace listing.
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
    ).update({"revoked_at": datetime.now(timezone.utc)}, synchronize_session=False)
    db.commit()
