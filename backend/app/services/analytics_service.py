"""
app/services/analytics_service.py

Aggregates a broker's own properties, leads, and property views into the
KPIs, trend, and breakdowns behind the Analytics page. Every number here
is computed from real rows (Lead.created_at, PropertyView.viewed_at) —
there is no seeded or fabricated data. "vs previous period" comparisons
are omitted (None) whenever the previous period has no baseline (0),
since a percentage change against zero is undefined, not "infinite%".
"""

from datetime import datetime, timedelta, timezone
from typing import Optional
from uuid import UUID

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.enums import LeadStatus
from app.models.lead import Lead
from app.models.property import Property
from app.models.property_view import PropertyView
from app.models.user import User
from app.schemas.analytics import (
    AnalyticsRange,
    AnalyticsTrendPoint,
    BrokerAnalyticsKpis,
    BrokerAnalyticsResponse,
    CityLeadCount,
    PropertyTypeBreakdownItem,
    TopListingItem,
)

# "Enquiry Calls" KPI — see BrokerAnalyticsKpis.enquiry_calls docstring.
_CALL_SOURCE = "number_request"

_RANGE_DAYS = {"7d": 7, "30d": 30, "6m": 180}

# Top Performing Listings table row cap — a layout constraint (Figma
# shows 5 rows), not a pagination limit.
_TOP_LISTINGS_LIMIT = 5
_CITY_BREAKDOWN_LIMIT = 6


def _pct_change(current: float, previous: float) -> Optional[float]:
    """None when there's no baseline to compare against (previous == 0) rather than a misleading infinite/undefined percentage."""
    if previous == 0:
        return None
    return round((current - previous) / previous * 100, 1)


def _property_ids_for_broker(db: Session, broker_id: UUID) -> list[UUID]:
    return [row[0] for row in db.query(Property.id).filter(Property.broker_id == broker_id).all()]


def _count_views(db: Session, property_ids: list[UUID], start: datetime, end: datetime) -> int:
    if not property_ids:
        return 0
    return (
        db.query(func.count(PropertyView.id))
        .filter(PropertyView.property_id.in_(property_ids), PropertyView.viewed_at >= start, PropertyView.viewed_at < end)
        .scalar()
        or 0
    )


def _count_leads(db: Session, broker_id: UUID, start: datetime, end: datetime, *, source: Optional[str] = None) -> int:
    query = db.query(func.count(Lead.id)).filter(Lead.broker_id == broker_id, Lead.created_at >= start, Lead.created_at < end)
    if source is not None:
        query = query.filter(Lead.source == source)
    return query.scalar() or 0


def _sum_closed_won_revenue(db: Session, broker_id: UUID, start: datetime, end: datetime) -> float:
    total = (
        db.query(func.coalesce(func.sum(Property.price), 0))
        .join(Lead, Lead.property_id == Property.id)
        .filter(
            Lead.broker_id == broker_id,
            Lead.status == LeadStatus.closed_won,
            Lead.created_at >= start,
            Lead.created_at < end,
        )
        .scalar()
        or 0
    )
    return float(total)


def _trend_bucket_starts(range_: AnalyticsRange, now: datetime) -> list[datetime]:
    """Ascending bucket start timestamps covering the requested range, ending at `now`'s bucket."""
    if range_ == "6m":
        starts = []
        year, month = now.year, now.month
        for offset in range(5, -1, -1):
            m = month - offset
            y = year
            while m <= 0:
                m += 12
                y -= 1
            starts.append(datetime(y, m, 1, tzinfo=timezone.utc))
        return starts
    days = _RANGE_DAYS[range_]
    start_day = (now - timedelta(days=days - 1)).date()
    return [datetime.combine(start_day + timedelta(days=i), datetime.min.time(), tzinfo=timezone.utc) for i in range(days)]


def _bucket_key(dt: datetime, range_: AnalyticsRange):
    """Matches a bucket start (or a raw DB date_trunc result) to a comparable key, sidestepping exact-datetime/timezone equality."""
    return (dt.year, dt.month) if range_ == "6m" else dt.date()


def _build_trend(db: Session, broker_id: UUID, property_ids: list[UUID], range_: AnalyticsRange, period_start: datetime, now: datetime) -> list[AnalyticsTrendPoint]:
    trunc_unit = "month" if range_ == "6m" else "day"
    buckets = _trend_bucket_starts(range_, now)

    views_by_bucket: dict = {}
    if property_ids:
        views_rows = (
            db.query(func.date_trunc(trunc_unit, PropertyView.viewed_at).label("bucket"), func.count(PropertyView.id))
            .filter(PropertyView.property_id.in_(property_ids), PropertyView.viewed_at >= period_start)
            .group_by("bucket")
            .all()
        )
        views_by_bucket = {_bucket_key(bucket, range_): count for bucket, count in views_rows}

    leads_rows = (
        db.query(func.date_trunc(trunc_unit, Lead.created_at).label("bucket"), func.count(Lead.id))
        .filter(Lead.broker_id == broker_id, Lead.created_at >= period_start)
        .group_by("bucket")
        .all()
    )
    leads_by_bucket = {_bucket_key(bucket, range_): count for bucket, count in leads_rows}

    label_format = "%b" if range_ == "6m" else "%d %b"
    return [
        AnalyticsTrendPoint(
            label=bucket_start.strftime(label_format),
            views=views_by_bucket.get(_bucket_key(bucket_start, range_), 0),
            leads=leads_by_bucket.get(_bucket_key(bucket_start, range_), 0),
        )
        for bucket_start in buckets
    ]


def _build_property_type_breakdown(db: Session, broker_id: UUID, start: datetime, end: datetime) -> list[PropertyTypeBreakdownItem]:
    rows = (
        db.query(Property.property_type, func.count(Lead.id))
        .join(Lead, Lead.property_id == Property.id)
        .filter(Lead.broker_id == broker_id, Lead.created_at >= start, Lead.created_at < end)
        .group_by(Property.property_type)
        .all()
    )
    total = sum(count for _, count in rows)
    if total == 0:
        return []
    ranked = sorted(rows, key=lambda row: row[1], reverse=True)
    return [
        PropertyTypeBreakdownItem(property_type=property_type, count=count, percent=round(count / total * 100, 1))
        for property_type, count in ranked
    ]


def _build_leads_by_city(db: Session, broker_id: UUID, start: datetime, end: datetime) -> list[CityLeadCount]:
    rows = (
        db.query(Property.city, func.count(Lead.id).label("lead_count"))
        .join(Lead, Lead.property_id == Property.id)
        .filter(Lead.broker_id == broker_id, Lead.created_at >= start, Lead.created_at < end)
        .group_by(Property.city)
        .order_by(func.count(Lead.id).desc())
        .limit(_CITY_BREAKDOWN_LIMIT)
        .all()
    )
    return [CityLeadCount(city=city, count=count) for city, count in rows]


def _build_top_listings(db: Session, broker_id: UUID, start: datetime, end: datetime) -> list[TopListingItem]:
    properties = db.query(Property).filter(Property.broker_id == broker_id).all()
    if not properties:
        return []
    property_ids = [property_.id for property_ in properties]

    views_by_property = dict(
        db.query(PropertyView.property_id, func.count(PropertyView.id))
        .filter(PropertyView.property_id.in_(property_ids), PropertyView.viewed_at >= start, PropertyView.viewed_at < end)
        .group_by(PropertyView.property_id)
        .all()
    )
    leads_by_property = dict(
        db.query(Lead.property_id, func.count(Lead.id))
        .filter(Lead.property_id.in_(property_ids), Lead.created_at >= start, Lead.created_at < end)
        .group_by(Lead.property_id)
        .all()
    )

    items = []
    for property_ in properties:
        views = views_by_property.get(property_.id, 0)
        leads = leads_by_property.get(property_.id, 0)
        if views == 0 and leads == 0:
            continue
        conversion_rate = round(leads / views * 100, 1) if views > 0 else 0.0
        items.append(
            TopListingItem(
                property_id=property_.id,
                title=property_.title,
                locality=property_.locality,
                city=property_.city,
                price=float(property_.price),
                listing_type=property_.listing_type,
                views=views,
                leads=leads,
                conversion_rate=conversion_rate,
            )
        )

    items.sort(key=lambda item: (item.conversion_rate, item.leads), reverse=True)
    return items[:_TOP_LISTINGS_LIMIT]


def get_broker_analytics(db: Session, broker: User, range_: AnalyticsRange) -> BrokerAnalyticsResponse:
    """Returns KPIs, trend, and breakdowns across every property/lead the broker owns, scoped to `range_`."""
    now = datetime.now(timezone.utc)
    days = _RANGE_DAYS[range_]
    period_start = now - timedelta(days=days)
    previous_start = period_start - timedelta(days=days)

    property_ids = _property_ids_for_broker(db, broker.id)

    current_views = _count_views(db, property_ids, period_start, now)
    previous_views = _count_views(db, property_ids, previous_start, period_start)
    current_leads = _count_leads(db, broker.id, period_start, now)
    previous_leads = _count_leads(db, broker.id, previous_start, period_start)
    current_calls = _count_leads(db, broker.id, period_start, now, source=_CALL_SOURCE)
    previous_calls = _count_leads(db, broker.id, previous_start, period_start, source=_CALL_SOURCE)
    current_revenue = _sum_closed_won_revenue(db, broker.id, period_start, now)
    previous_revenue = _sum_closed_won_revenue(db, broker.id, previous_start, period_start)

    kpis = BrokerAnalyticsKpis(
        total_views=current_views,
        total_views_change_pct=_pct_change(current_views, previous_views),
        total_leads=current_leads,
        total_leads_change_pct=_pct_change(current_leads, previous_leads),
        enquiry_calls=current_calls,
        enquiry_calls_change_pct=_pct_change(current_calls, previous_calls),
        est_revenue=current_revenue,
        est_revenue_change_pct=_pct_change(current_revenue, previous_revenue),
    )

    return BrokerAnalyticsResponse(
        range=range_,
        kpis=kpis,
        trend=_build_trend(db, broker.id, property_ids, range_, period_start, now),
        property_type_breakdown=_build_property_type_breakdown(db, broker.id, period_start, now),
        leads_by_city=_build_leads_by_city(db, broker.id, period_start, now),
        top_listings=_build_top_listings(db, broker.id, period_start, now),
    )
