"""
app/schemas/admin.py

Request/response shapes for the admin portal: dashboard summary, listing
management and moderation, and user management (list, detail, suspend,
reinstate). Every endpoint using these is admin-only.
"""

from datetime import datetime
from decimal import Decimal
from enum import Enum
from typing import Literal, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from app.models.enums import ListingType, PropertyStatus, PropertyType, UserRole, VerificationStatus
from app.schemas._pagination import PaginatedResponse


class AdminAccountStatus(str, Enum):
    """
    Account state as shown in the admin Users table. Derived, not stored:
    suspended (an admin suspended it), deactivated (the user closed it),
    pending (email never verified), otherwise active.
    """

    active = "active"
    pending = "pending"
    suspended = "suspended"
    deactivated = "deactivated"


class ModerationAction(str, Enum):
    """Decision an admin can take on a listing awaiting review."""

    approve = "approve"
    reject = "reject"


# ---------- Dashboard ----------


class AdminKpi(BaseModel):
    """One dashboard stat card: the headline value plus a comparison figure."""

    value: Decimal
    delta: Decimal
    delta_label: str


class AdminMonthlyPoint(BaseModel):
    month: str  # "YYYY-MM"
    views: int
    leads: int


class AdminTypeCount(BaseModel):
    property_type: PropertyType
    count: int


class AdminActivityItem(BaseModel):
    id: int
    action: str
    target_type: Optional[str] = None
    target_id: Optional[UUID] = None
    summary: str
    created_at: datetime


class AdminRecentListing(BaseModel):
    id: UUID
    title: str
    listing_type: ListingType
    property_type: PropertyType
    city: str
    locality: str
    price: Decimal
    status: PropertyStatus
    created_at: datetime


class AdminSummary(BaseModel):
    total_listings: AdminKpi
    active_listings: AdminKpi
    pending_reviews: AdminKpi
    total_revenue: AdminKpi
    monthly_traffic: list[AdminMonthlyPoint]
    listings_by_type: list[AdminTypeCount]
    recent_listings: list[AdminRecentListing]
    pending_broker_verifications: int
    total_users: int
    recent_activity: list[AdminActivityItem]


# ---------- Listings / moderation ----------


class AdminBrokerSummary(BaseModel):
    id: UUID
    full_name: Optional[str] = None
    email: Optional[str] = None
    verification_status: Optional[VerificationStatus] = None


class AdminPropertyItem(BaseModel):
    id: UUID
    title: str
    listing_type: ListingType
    property_type: PropertyType
    status: PropertyStatus
    price: Decimal
    bhk: Optional[int] = None
    bathrooms: Optional[int] = None
    area_sqft: Optional[Decimal] = None
    city: str
    locality: str
    cover_image_url: Optional[str] = None
    is_featured: bool
    photo_count: int
    has_video: bool
    has_jv_agreement: bool
    moderation_note: Optional[str] = None
    broker: AdminBrokerSummary
    created_at: datetime
    updated_at: Optional[datetime] = None


class AdminPropertyStatusCounts(BaseModel):
    all: int
    draft: int
    pending: int
    active: int
    sold: int
    rented: int
    expired: int
    rejected: int


class AdminPropertyList(PaginatedResponse[AdminPropertyItem]):
    counts: AdminPropertyStatusCounts


class AdminModerationStats(BaseModel):
    awaiting_review: int
    approved_today: int
    rejected_today: int


class ModerateRequest(BaseModel):
    action: ModerationAction
    note: Optional[str] = Field(default=None, max_length=1000)

    @field_validator("note")
    @classmethod
    def _strip_note(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        stripped = value.strip()
        return stripped or None

    @model_validator(mode="after")
    def _reject_requires_note(self) -> "ModerateRequest":
        """A rejection must tell the broker why, so the note is mandatory for it."""
        if self.action == ModerationAction.reject and not self.note:
            raise ValueError("A note explaining the rejection is required.")
        return self


# ---------- Users ----------


class AdminUserItem(BaseModel):
    id: UUID
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    role: UserRole
    status: AdminAccountStatus
    listings_count: int
    verification_status: Optional[VerificationStatus] = None
    created_at: datetime


class AdminUserStats(BaseModel):
    total_users: int
    active_brokers: int
    pending_verification: int


class AdminUserList(PaginatedResponse[AdminUserItem]):
    stats: AdminUserStats


class AdminUserDetail(AdminUserItem):
    model_config = ConfigDict(from_attributes=True)

    is_email_verified: bool
    suspended_at: Optional[datetime] = None
    suspension_reason: Optional[str] = None
    company_name: Optional[str] = None
    rera_number: Optional[str] = None
    experience_years: Optional[int] = None
    active_listings_count: int
    leads_count: int


class SuspendRequest(BaseModel):
    reason: str = Field(min_length=1, max_length=500)

    @field_validator("reason")
    @classmethod
    def _strip_reason(cls, value: str) -> str:
        stripped = value.strip()
        if not stripped:
            raise ValueError("A reason for the suspension is required.")
        return stripped


AdminUserRoleFilter = Literal["client", "broker"]
