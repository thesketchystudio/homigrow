"""
app/schemas/boost.py

Request/response models for the boost-plan catalog and boost-order
checkout — backs the broker "Boost Listing" page.
"""

from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.models.enums import BoostTier, OrderStatus

# The only durations the checkout page offers; each carries its own
# volume discount (see boost_service.DURATION_DISCOUNT_PERCENT).
BoostDurationDays = Literal[7, 15, 30]


class ReachEstimate(BaseModel):
    """Illustrative views/leads/calls ranges for a plan's "Expected Reach" panel."""

    views_min: int
    views_max: int
    leads_min: int
    leads_max: int
    calls_min: int
    calls_max: int


class BoostPlanRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    tier: BoostTier
    price: float
    features: list[str]
    reach_estimate: ReachEstimate


class BoostOrderCreateRequest(BaseModel):
    property_id: UUID
    plan_id: UUID
    duration_days: BoostDurationDays


class BoostOrderRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    property_id: UUID
    plan_id: UUID
    duration_days: int
    base_amount: float
    discount_amount: float
    gst_amount: float
    total_amount: float
    status: OrderStatus
    created_at: datetime
