"""
app/services/admin_dashboard_service.py

Builds the admin Dashboard in one read: KPI cards, the monthly views and
leads series, the listings-by-type distribution, the latest listings,
quick-action counts and the recent admin activity feed. Read-only.
"""

from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.boost_order import BoostOrder
from app.models.broker_profile import BrokerProfile
from app.models.enums import OrderStatus, PropertyStatus, UserRole, VerificationStatus
from app.models.lead import Lead
from app.models.property import Property
from app.models.property_view import PropertyView
from app.models.user import User
from app.schemas.admin import (
    AdminActivityItem,
    AdminKpi,
    AdminMonthlyPoint,
    AdminRecentListing,
    AdminSummary,
    AdminTypeCount,
)
from app.services import admin_audit_service
from app.services.admin_property_service import IST, start_of_today_ist

TRAFFIC_MONTHS = 12
RECENT_LISTINGS_LIMIT = 5
RECENT_ACTIVITY_LIMIT = 5
_TZ_NAME = "Asia/Kolkata"


def _month_start(moment: datetime) -> datetime:
    return moment.astimezone(IST).replace(day=1, hour=0, minute=0, second=0, microsecond=0)


def _shift_months(month_start: datetime, months: int) -> datetime:
    index = month_start.year * 12 + (month_start.month - 1) + months
    return month_start.replace(year=index // 12, month=index % 12 + 1)


def _quarter_start(moment: datetime) -> datetime:
    month = _month_start(moment)
    return month.replace(month=((month.month - 1) // 3) * 3 + 1)


def _count(db: Session, *conditions) -> int:
    return db.query(func.count(Property.id)).filter(*conditions).scalar() or 0


def _monthly_series(db: Session, column, since: datetime) -> dict[str, int]:
    """Row counts per IST calendar month ("YYYY-MM") of a timestamp column, from `since` onward."""
    bucket = func.to_char(func.timezone(_TZ_NAME, column), "YYYY-MM")
    rows = db.query(bucket, func.count()).filter(column >= since).group_by(bucket).all()
    return dict(rows)


def get_summary(db: Session) -> AdminSummary:
    """Everything the admin Dashboard renders, computed against the live tables."""
    now = datetime.now(timezone.utc)
    this_month = _month_start(now)
    today = start_of_today_ist(now)
    quarter = _quarter_start(now)

    total = _count(db)
    created_this_month = _count(db, Property.created_at >= this_month)
    active = _count(db, Property.status == PropertyStatus.active)
    active_this_month = _count(db, Property.status == PropertyStatus.active, Property.created_at >= this_month)
    pending = _count(db, Property.status == PropertyStatus.pending)
    pending_today = _count(db, Property.status == PropertyStatus.pending, Property.updated_at >= today)

    paid = db.query(func.coalesce(func.sum(BoostOrder.total_amount), 0)).filter(BoostOrder.status == OrderStatus.paid)
    revenue = Decimal(paid.scalar() or 0)
    revenue_quarter = Decimal(paid.filter(BoostOrder.created_at >= quarter).scalar() or 0)

    first_month = _shift_months(this_month, -(TRAFFIC_MONTHS - 1))
    views = _monthly_series(db, PropertyView.viewed_at, first_month)
    leads = _monthly_series(db, Lead.created_at, first_month)
    monthly = []
    for offset in range(TRAFFIC_MONTHS):
        key = _shift_months(first_month, offset).strftime("%Y-%m")
        monthly.append(AdminMonthlyPoint(month=key, views=views.get(key, 0), leads=leads.get(key, 0)))

    by_type = (
        db.query(Property.property_type, func.count(Property.id))
        .filter(Property.status != PropertyStatus.draft)
        .group_by(Property.property_type)
        .order_by(func.count(Property.id).desc())
        .all()
    )

    recent = (
        db.query(Property)
        .filter(Property.status != PropertyStatus.draft)
        .order_by(Property.created_at.desc(), Property.id)
        .limit(RECENT_LISTINGS_LIMIT)
        .all()
    )

    pending_verifications = (
        db.query(func.count(BrokerProfile.id))
        .join(User, User.id == BrokerProfile.user_id)
        .filter(User.role == UserRole.broker, BrokerProfile.verification_status == VerificationStatus.pending)
        .scalar()
        or 0
    )
    total_users = db.query(func.count(User.id)).filter(User.role.in_([UserRole.client, UserRole.broker])).scalar() or 0

    activity = [
        AdminActivityItem(
            id=entry.id,
            action=entry.action,
            target_type=entry.target_type,
            target_id=entry.target_id,
            summary=admin_audit_service.describe(entry),
            created_at=entry.created_at,
        )
        for entry in admin_audit_service.list_recent(db, RECENT_ACTIVITY_LIMIT)
    ]

    return AdminSummary(
        total_listings=AdminKpi(value=total, delta=created_this_month, delta_label="this month"),
        active_listings=AdminKpi(value=active, delta=active_this_month, delta_label="new this month"),
        pending_reviews=AdminKpi(value=pending, delta=pending_today, delta_label="submitted today"),
        total_revenue=AdminKpi(value=revenue, delta=revenue_quarter, delta_label="this quarter"),
        monthly_traffic=monthly,
        listings_by_type=[AdminTypeCount(property_type=ptype, count=count) for ptype, count in by_type],
        recent_listings=[
            AdminRecentListing(
                id=prop.id,
                title=prop.title,
                listing_type=prop.listing_type,
                property_type=prop.property_type,
                city=prop.city,
                locality=prop.locality,
                price=prop.price,
                status=prop.status,
                created_at=prop.created_at,
            )
            for prop in recent
        ],
        pending_broker_verifications=pending_verifications,
        total_users=total_users,
        recent_activity=activity,
    )
