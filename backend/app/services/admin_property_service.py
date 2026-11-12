"""
app/services/admin_property_service.py

Admin listing management and moderation. One list query serves both the
All Listings page and the Review Queue (the queue is just status=pending).
Moderation moves a pending listing to active or rejected through the
lifecycle state machine, notifies the broker, and writes the audit row
in the same transaction.
"""

from datetime import datetime, timedelta, timezone
from typing import Optional
from uuid import UUID

from sqlalchemy import exists, func, or_, select
from sqlalchemy.orm import Session

from app.core.exceptions import ConflictError, NotFoundError
from app.models.admin_audit_log import AdminAuditLog
from app.models.boost_order import BoostOrder
from app.models.broker_profile import BrokerProfile
from app.models.enums import (
    AdminAction,
    AdminAuditTarget,
    MediaType,
    NotificationType,
    OrderStatus,
    PropertyStatus,
)
from app.models.property import Property, PropertyMedia
from app.models.user import User
from app.schemas.admin import (
    AdminBrokerSummary,
    AdminModerationStats,
    AdminPropertyItem,
    AdminPropertyList,
    AdminPropertyStatusCounts,
    ModerateRequest,
    ModerationAction,
)
from app.services import admin_audit_service, notification_service
from app.services._property_query_helpers import cover_image_subquery
from app.services.property_lifecycle import transition_property_status
from app.services.property_service import LIKE_ESCAPE, _contains_pattern

# "Today" for the moderation counters is the Indian business day, since
# the marketplace and its admins operate on IST, not UTC.
IST = timezone(timedelta(hours=5, minutes=30))


def start_of_today_ist(now: Optional[datetime] = None) -> datetime:
    """Midnight IST of the current day, as an aware datetime, for "today" counters."""
    current = (now or datetime.now(timezone.utc)).astimezone(IST)
    return current.replace(hour=0, minute=0, second=0, microsecond=0)


def is_featured_expression(now: datetime):
    """
    SQL boolean: the property has a paid boost whose window covers `now`.
    Correlated on Property, for use as an extra selected column.
    """
    return exists(
        select(BoostOrder.id).where(
            BoostOrder.property_id == Property.id,
            BoostOrder.status == OrderStatus.paid,
            BoostOrder.starts_at <= now,
            BoostOrder.ends_at > now,
        )
    )


def _photo_count_subquery():
    return (
        select(func.count(PropertyMedia.id))
        .where(PropertyMedia.property_id == Property.id, PropertyMedia.media_type == MediaType.image)
        .correlate(Property)
        .scalar_subquery()
    )


def _has_video_expression():
    return exists(
        select(PropertyMedia.id).where(PropertyMedia.property_id == Property.id, PropertyMedia.media_type == MediaType.video)
    )


def _filter_conditions(q: Optional[str], broker_id: Optional[UUID]) -> list:
    """Search/broker filters shared by the list query and its per-status counts."""
    conditions = []
    if broker_id is not None:
        conditions.append(Property.broker_id == broker_id)
    if q and q.strip():
        pattern = _contains_pattern(q.strip())
        conditions.append(
            or_(
                func.lower(Property.title).like(pattern, escape=LIKE_ESCAPE),
                func.lower(Property.city).like(pattern, escape=LIKE_ESCAPE),
                func.lower(Property.locality).like(pattern, escape=LIKE_ESCAPE),
                func.lower(func.coalesce(User.full_name, "")).like(pattern, escape=LIKE_ESCAPE),
                func.lower(func.coalesce(User.email, "")).like(pattern, escape=LIKE_ESCAPE),
            )
        )
    return conditions


def _status_counts(db: Session, conditions: list) -> AdminPropertyStatusCounts:
    rows = (
        db.query(Property.status, func.count(Property.id))
        .join(User, User.id == Property.broker_id)
        .filter(*conditions)
        .group_by(Property.status)
        .all()
    )
    by_status = {status.value: count for status, count in rows}
    return AdminPropertyStatusCounts(
        all=sum(by_status.values()),
        **{status.value: by_status.get(status.value, 0) for status in PropertyStatus},
    )


def list_properties(
    db: Session,
    *,
    status: Optional[PropertyStatus],
    q: Optional[str],
    broker_id: Optional[UUID],
    page: int,
    page_size: int,
) -> AdminPropertyList:
    """
    Every listing regardless of status (admins see drafts and rejected ones
    too), newest first, with the per-status counts the filter tabs show.
    """
    now = datetime.now(timezone.utc)
    conditions = _filter_conditions(q, broker_id)
    listed = conditions + ([Property.status == status] if status is not None else [])

    base = db.query(Property).join(User, User.id == Property.broker_id).filter(*listed)
    total = base.count()

    rows = (
        db.query(
            Property,
            User,
            BrokerProfile.verification_status,
            cover_image_subquery().label("cover_image_url"),
            is_featured_expression(now).label("is_featured"),
            _photo_count_subquery().label("photo_count"),
            _has_video_expression().label("has_video"),
        )
        .join(User, User.id == Property.broker_id)
        .outerjoin(BrokerProfile, BrokerProfile.user_id == User.id)
        .filter(*listed)
        .order_by(Property.created_at.desc(), Property.id)
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    items = [
        AdminPropertyItem(
            id=prop.id,
            title=prop.title,
            listing_type=prop.listing_type,
            property_type=prop.property_type,
            status=prop.status,
            price=prop.price,
            bhk=prop.bhk,
            bathrooms=prop.bathrooms,
            area_sqft=prop.area_sqft,
            city=prop.city,
            locality=prop.locality,
            cover_image_url=cover,
            is_featured=bool(featured),
            photo_count=photo_count or 0,
            has_video=bool(has_video),
            has_jv_agreement=bool((prop.jv_details or {}).get("agreement_document_key")),
            moderation_note=prop.moderation_note,
            broker=AdminBrokerSummary(
                id=broker.id,
                full_name=broker.full_name,
                email=broker.email,
                verification_status=verification_status,
            ),
            created_at=prop.created_at,
            updated_at=prop.updated_at,
        )
        for prop, broker, verification_status, cover, featured, photo_count, has_video in rows
    ]

    return AdminPropertyList(
        items=items,
        page=page,
        page_size=page_size,
        total=total,
        counts=_status_counts(db, conditions),
    )


def moderation_stats(db: Session) -> AdminModerationStats:
    """Review Queue header counters: listings waiting now, and today's (IST) decisions."""
    since = start_of_today_ist()
    decided = dict(
        db.query(AdminAuditLog.action, func.count(AdminAuditLog.id))
        .filter(
            AdminAuditLog.created_at >= since,
            AdminAuditLog.action.in_([AdminAction.property_approved.value, AdminAction.property_rejected.value]),
        )
        .group_by(AdminAuditLog.action)
        .all()
    )
    awaiting = db.query(func.count(Property.id)).filter(Property.status == PropertyStatus.pending).scalar() or 0
    return AdminModerationStats(
        awaiting_review=awaiting,
        approved_today=decided.get(AdminAction.property_approved.value, 0),
        rejected_today=decided.get(AdminAction.property_rejected.value, 0),
    )


def moderate_property(db: Session, admin: User, property_id: UUID, data: ModerateRequest) -> Property:
    """
    Approves (pending -> active) or rejects (pending -> rejected) a listing.
    The row is locked first so two admins deciding the same listing at
    once serialize, and the second sees it is no longer pending (409)
    instead of overwriting the first decision. The broker is notified and
    the audit row is staged before the single commit.
    """
    property_ = db.query(Property).filter(Property.id == property_id).with_for_update().first()
    if property_ is None:
        raise NotFoundError("PROPERTY_NOT_FOUND", "Property not found.")

    target = PropertyStatus.active if data.action == ModerationAction.approve else PropertyStatus.rejected
    if property_.status != PropertyStatus.pending or not transition_property_status(property_.status, target):
        raise ConflictError(
            "INVALID_TRANSITION",
            f"Only listings awaiting review can be moderated; this one is {property_.status.value}.",
        )

    previous = property_.status
    property_.status = target
    property_.moderation_note = data.note
    if target == PropertyStatus.active and property_.published_at is None:
        property_.published_at = datetime.now(timezone.utc)

    approved = target == PropertyStatus.active
    notification_service.create_notification(
        db,
        user_id=property_.broker_id,
        type=NotificationType.listing_status,
        title="Your listing is live" if approved else "Your listing needs changes",
        body=(
            f'"{property_.title}" has been approved and is now visible to buyers.'
            if approved
            else f'"{property_.title}" was not approved. Reason: {data.note}'
        ),
        data={"property_id": str(property_.id), "status": target.value},
    )
    admin_audit_service.record_admin_action(
        db,
        admin=admin,
        action=AdminAction.property_approved if approved else AdminAction.property_rejected,
        target_type=AdminAuditTarget.property,
        target_id=property_.id,
        meta={"label": property_.title, "from": previous.value, "to": target.value, "note": data.note},
    )

    db.commit()
    db.refresh(property_)
    return property_
