"""
app/schemas/analytics.py

Pydantic response shapes for the broker Analytics page: KPI cards, the
Views & Leads trend chart, property-type/city breakdowns, and the Top
Performing Listings table.
"""

from typing import Literal, Optional
from uuid import UUID

from pydantic import BaseModel

from app.models.enums import ListingType, PropertyType

AnalyticsRange = Literal["7d", "30d", "6m"]


class BrokerAnalyticsKpis(BaseModel):
    total_views: int
    total_views_change_pct: Optional[float]
    total_leads: int
    total_leads_change_pct: Optional[float]
    # "Enquiry Calls" maps to leads sourced from the Property Contact
    # Card's "Get Number" CTA (source="number_request") — the closest real
    # signal to a phone enquiry the schema tracks; there's no separate
    # call-log table.
    enquiry_calls: int
    enquiry_calls_change_pct: Optional[float]
    # Sum of listing price across this period's closed_won leads — an
    # estimate of commission-generating activity, not a real revenue/
    # commission figure (no commission or deal-value field exists yet).
    est_revenue: float
    est_revenue_change_pct: Optional[float]


class AnalyticsTrendPoint(BaseModel):
    label: str
    views: int
    leads: int


class PropertyTypeBreakdownItem(BaseModel):
    property_type: PropertyType
    count: int
    percent: float


class CityLeadCount(BaseModel):
    city: str
    count: int


class TopListingItem(BaseModel):
    property_id: UUID
    title: str
    locality: str
    city: str
    price: float
    listing_type: ListingType
    views: int
    leads: int
    conversion_rate: float


class BrokerAnalyticsResponse(BaseModel):
    range: AnalyticsRange
    kpis: BrokerAnalyticsKpis
    trend: list[AnalyticsTrendPoint]
    property_type_breakdown: list[PropertyTypeBreakdownItem]
    leads_by_city: list[CityLeadCount]
    top_listings: list[TopListingItem]
