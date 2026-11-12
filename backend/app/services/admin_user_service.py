"""
app/services/admin_user_service.py

Admin user management: list and inspect client/broker accounts, suspend
an account (signs it out everywhere and takes its live listings off the
market) and reinstate it (restores exactly the listings the suspension
took down). Admin accounts are never listed or actionable here, so one
admin cannot suspend another through the portal.
"""

from datetime import datetime, timezone
from typing import Optional
from uuid import UUID

from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app.core.exceptions import ConflictError, NotFoundError
from app.models.broker_profile import BrokerProfile
from app.models.enums import AdminAction, AdminAuditTarget, PropertyStatus, UserRole, VerificationStatus
from app.models.lead import Lead
from app.models.property import Property
from app.models.user import User
from app.schemas.admin import (
    AdminAccountStatus,
    AdminUserDetail,
    AdminUserItem,
    AdminUserList,
    AdminUserStats,
)
from app.services import admin_audit_service, auth_service
from app.services.property_lifecycle import transition_property_status
from app.services.property_service import LIKE_ESCAPE, _contains_pattern

MANAGED_ROLES = (UserRole.client, UserRole.broker)


def account_status(user: User) -> AdminAccountStatus:
    """Derives the single status the Users table shows from the account's flags."""
    if user.suspended_at is not None:
        return AdminAccountStatus.suspended
    if not user.is_active:
        return AdminAccountStatus.deactivated
    if not user.is_email_verified:
        return AdminAccountStatus.pending
    return AdminAccountStatus.active


def _label(user: User) -> str:
    return user.full_name or user.email or user.phone or str(user.id)


def _listing_counts(db: Session, user_ids: list[UUID]) -> dict[UUID, int]:
    if not user_ids:
        return {}
    rows = (
        db.query(Property.broker_id, func.count(Property.id))
        .filter(Property.broker_id.in_(user_ids))
        .group_by(Property.broker_id)
        .all()
    )
    return dict(rows)


def _stats(db: Session) -> AdminUserStats:
    total = db.query(func.count(User.id)).filter(User.role.in_(MANAGED_ROLES)).scalar() or 0
    active_brokers = (
        db.query(func.count(User.id))
        .filter(
            User.role == UserRole.broker,
            User.is_active.is_(True),
            User.suspended_at.is_(None),
            User.is_email_verified.is_(True),
        )
        .scalar()
        or 0
    )
    pending_verification = (
        db.query(func.count(BrokerProfile.id))
        .join(User, User.id == BrokerProfile.user_id)
        .filter(User.role == UserRole.broker, BrokerProfile.verification_status == VerificationStatus.pending)
        .scalar()
        or 0
    )
    return AdminUserStats(total_users=total, active_brokers=active_brokers, pending_verification=pending_verification)


def list_users(
    db: Session,
    *,
    role: Optional[UserRole],
    q: Optional[str],
    page: int,
    page_size: int,
) -> AdminUserList:
    """Client and broker accounts, newest first, with the header stats; admins are excluded."""
    query = db.query(User, BrokerProfile.verification_status).outerjoin(BrokerProfile, BrokerProfile.user_id == User.id)
    query = query.filter(User.role == role) if role is not None else query.filter(User.role.in_(MANAGED_ROLES))
    if q and q.strip():
        pattern = _contains_pattern(q.strip())
        query = query.filter(
            or_(
                func.lower(func.coalesce(User.full_name, "")).like(pattern, escape=LIKE_ESCAPE),
                func.lower(func.coalesce(User.email, "")).like(pattern, escape=LIKE_ESCAPE),
                func.lower(func.coalesce(User.phone, "")).like(pattern, escape=LIKE_ESCAPE),
            )
        )

    total = query.count()
    rows = query.order_by(User.created_at.desc(), User.id).offset((page - 1) * page_size).limit(page_size).all()
    counts = _listing_counts(db, [user.id for user, _ in rows])

    items = [
        AdminUserItem(
            id=user.id,
            full_name=user.full_name,
            email=user.email,
            phone=user.phone,
            role=user.role,
            status=account_status(user),
            listings_count=counts.get(user.id, 0),
            verification_status=verification_status,
            created_at=user.created_at,
        )
        for user, verification_status in rows
    ]
    return AdminUserList(items=items, page=page, page_size=page_size, total=total, stats=_stats(db))


def _get_managed_user(db: Session, user_id: UUID, *, lock: bool = False) -> User:
    """Loads a client/broker account; admins and unknown ids are both 404 so the portal never acts on an admin."""
    query = db.query(User).filter(User.id == user_id, User.role.in_(MANAGED_ROLES))
    if lock:
        query = query.with_for_update()
    user = query.first()
    if user is None:
        raise NotFoundError("USER_NOT_FOUND", "User not found.")
    return user


def get_user(db: Session, user_id: UUID) -> AdminUserDetail:
    """One account's profile, broker details and listing/lead totals for the View Profile panel."""
    user = _get_managed_user(db, user_id)
    profile = user.broker_profile
    listings_count = db.query(func.count(Property.id)).filter(Property.broker_id == user.id).scalar() or 0
    active_count = (
        db.query(func.count(Property.id))
        .filter(Property.broker_id == user.id, Property.status == PropertyStatus.active)
        .scalar()
        or 0
    )
    leads_count = db.query(func.count(Lead.id)).filter(Lead.broker_id == user.id).scalar() or 0
    return AdminUserDetail(
        id=user.id,
        full_name=user.full_name,
        email=user.email,
        phone=user.phone,
        role=user.role,
        status=account_status(user),
        listings_count=listings_count,
        verification_status=profile.verification_status if profile else None,
        created_at=user.created_at,
        is_email_verified=user.is_email_verified,
        suspended_at=user.suspended_at,
        suspension_reason=user.suspension_reason,
        company_name=profile.company_name if profile else None,
        rera_number=profile.rera_number if profile else None,
        experience_years=profile.experience_years if profile else None,
        active_listings_count=active_count,
        leads_count=leads_count,
    )


def suspend_user(db: Session, admin: User, user_id: UUID, reason: str) -> AdminUserDetail:
    """
    Suspends a client/broker account. Every session is revoked so the
    suspension takes effect on the next request (get_current_user already
    rejects inactive accounts), and a broker's live listings move to
    expired so they leave public search. The ids of those listings go into
    the audit row, which is what reinstatement reads to restore them.
    A self-deactivated account is refused (409): suspending it would let a
    later reinstatement reopen an account its owner chose to close.
    """
    user = _get_managed_user(db, user_id, lock=True)
    if user.suspended_at is not None:
        raise ConflictError("ALREADY_SUSPENDED", "This account is already suspended.")
    if not user.is_active:
        raise ConflictError("ACCOUNT_DEACTIVATED", "This account was closed by its owner and can't be suspended.")

    expired_ids: list[str] = []
    live_listings = (
        db.query(Property)
        .filter(Property.broker_id == user.id, Property.status == PropertyStatus.active)
        .with_for_update()
        .all()
    )
    for listing in live_listings:
        if transition_property_status(listing.status, PropertyStatus.expired):
            listing.status = PropertyStatus.expired
            expired_ids.append(str(listing.id))

    user.is_active = False
    user.suspended_at = datetime.now(timezone.utc)
    user.suspension_reason = reason
    auth_service.revoke_all_sessions(db, user.id)

    admin_audit_service.record_admin_action(
        db,
        admin=admin,
        action=AdminAction.user_suspended,
        target_type=AdminAuditTarget.user,
        target_id=user.id,
        meta={"label": _label(user), "reason": reason, "expired_property_ids": expired_ids},
    )
    db.commit()
    return get_user(db, user.id)


def reinstate_user(db: Session, admin: User, user_id: UUID) -> AdminUserDetail:
    """
    Lifts an admin suspension and restores the listings that suspension
    took down, but only those still expired — anything the broker has
    changed since is left alone. Accounts that are not suspended get 409.
    """
    user = _get_managed_user(db, user_id, lock=True)
    if user.suspended_at is None:
        raise ConflictError("NOT_SUSPENDED", "This account is not suspended.")

    suspension = admin_audit_service.latest_for_target(db, AdminAction.user_suspended, AdminAuditTarget.user, user.id)
    taken_down = [UUID(value) for value in ((suspension.meta or {}).get("expired_property_ids", []) if suspension else [])]

    restored_ids: list[str] = []
    if taken_down:
        listings = (
            db.query(Property)
            .filter(Property.id.in_(taken_down), Property.broker_id == user.id, Property.status == PropertyStatus.expired)
            .with_for_update()
            .all()
        )
        for listing in listings:
            if transition_property_status(listing.status, PropertyStatus.active):
                listing.status = PropertyStatus.active
                restored_ids.append(str(listing.id))

    user.is_active = True
    user.suspended_at = None
    user.suspension_reason = None

    admin_audit_service.record_admin_action(
        db,
        admin=admin,
        action=AdminAction.user_reinstated,
        target_type=AdminAuditTarget.user,
        target_id=user.id,
        meta={"label": _label(user), "restored_property_ids": restored_ids},
    )
    db.commit()
    return get_user(db, user.id)
