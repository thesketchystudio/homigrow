"""
app/schemas/properties.py

Pydantic read shapes for the public property listing resources.
"""

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, computed_field

from app.models.enums import (
    Furnishing,
    ListingType,
    MediaType,
    PropertyStatus,
    PropertyType,
    VerificationStatus,
)
from app.schemas._pagination import PaginatedResponse


class PropertyMediaRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    media_type: MediaType
    url: str
    stream_uid: Optional[str] = None
    position: int
    is_cover: bool
    width: Optional[int] = None
    height: Optional[int] = None


class PlotDetails(BaseModel):
    """Sub-fields shown only when property_type is "plot" — stored in Property.plot_details (JSONB)."""

    model_config = ConfigDict(from_attributes=True)

    dimension: Optional[str] = Field(default=None, max_length=50)  # e.g. "30x40"
    is_corner_plot: Optional[bool] = None


class LandDetails(BaseModel):
    """Sub-fields shown only when property_type is "land" — stored in Property.land_details (JSONB)."""

    model_config = ConfigDict(from_attributes=True)

    land_use: Optional[str] = None  # "residential" | "commercial"
    approvals: list[str] = []  # e.g. ["RERA", "BMRDA"]


class PropertyBrokerVerification(BaseModel):
    """Embedded on PropertyBrokerRead only when the broker has a profile."""

    model_config = ConfigDict(from_attributes=True)

    verification_status: VerificationStatus


class PropertyBrokerRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    full_name: Optional[str] = None
    broker_profile: Optional[PropertyBrokerVerification] = None


class PropertyRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    title: str
    description: Optional[str] = None
    status: PropertyStatus
    listing_type: ListingType
    property_type: PropertyType
    price: float
    maintenance_monthly: Optional[float] = None
    deposit: Optional[float] = None
    is_negotiable: bool
    bhk: Optional[int] = None
    bathrooms: Optional[int] = None
    area_sqft: Optional[float] = None
    floor: Optional[int] = None
    total_floors: Optional[int] = None
    facing: Optional[str] = None
    built_year: Optional[int] = None
    parking_slots: Optional[int] = None
    furnishing: Optional[Furnishing] = None
    amenities: list[str]
    plot_details: Optional[PlotDetails] = None
    land_details: Optional[LandDetails] = None
    address_line: str
    locality: str
    city: str
    state: str
    pincode: str
    landmark: Optional[str] = None
    metro_distance_m: Optional[int] = None
    media: list[PropertyMediaRead]
    broker: PropertyBrokerRead
    published_at: Optional[datetime] = None

    @computed_field
    @property
    def metro_distance_km(self) -> Optional[float]:
        if self.metro_distance_m is None:
            return None
        return round(self.metro_distance_m / 1000, 1)


class PropertyListItem(BaseModel):
    """One card's worth of data for the /properties search results grid — lighter than PropertyRead, no media gallery or broker detail."""

    id: UUID
    title: str
    listing_type: ListingType
    property_type: PropertyType
    price: float
    bhk: Optional[int] = None
    bathrooms: Optional[int] = None
    area_sqft: Optional[float] = None
    furnishing: Optional[Furnishing] = None
    city: str
    locality: str
    cover_image_url: Optional[str] = None
    published_at: Optional[datetime] = None


class PropertyListResponse(PaginatedResponse[PropertyListItem]):
    """Pagination envelope for GET /properties: page/page_size in, total/total_pages computed for the caller."""


class PropertyCompareResponse(BaseModel):
    """GET /properties/compare — a normalized spec table, reusing PropertyRead's full field set."""

    items: list[PropertyRead]


class NeighborhoodSummary(BaseModel):
    """One locality's worth of data for the search overlay's Curated Neighborhoods grid."""

    locality: str
    city: str
    property_count: int
    cover_image_url: Optional[str] = None


class PropertyCreateRequest(BaseModel):
    """
    The Post Property wizard's full submission — Step 1 (Property Info) +
    Step 3 (Pricing) fields together in one request. Steps 1 and 2 only
    collect data client-side; nothing is persisted until this fires,
    because `Property.price` is NOT NULL with a `price > 0` check
    constraint, so a valid row can't exist before pricing is known.
    Supports residential listings (apartment/villa/independent_house) plus
    Plot and Land — PG/co-living and Commercial Building are not yet
    offered by the wizard's frontend, though the PropertyType enum already
    has room for them. The schema itself doesn't enforce which
    property_type values are "allowed"; the wizard's frontend does, by
    only offering the types it has a Step 1 sub-form for.
    """

    title: str = Field(min_length=1, max_length=200)
    listing_type: ListingType
    property_type: PropertyType
    bhk: Optional[int] = None
    bathrooms: Optional[int] = None
    area_sqft: Optional[float] = Field(default=None, gt=0)
    furnishing: Optional[Furnishing] = None
    built_year: Optional[int] = None
    amenities: list[str] = []
    plot_details: Optional[PlotDetails] = None
    land_details: Optional[LandDetails] = None
    address_line: str = Field(min_length=1, max_length=255)
    locality: str = Field(min_length=1, max_length=100)
    city: str = Field(min_length=1, max_length=100)
    state: str = Field(min_length=1, max_length=100)
    pincode: str = Field(min_length=1, max_length=6)
    landmark: Optional[str] = None
    price: float = Field(gt=0)
    maintenance_monthly: Optional[float] = Field(default=None, gt=0)
    deposit: Optional[float] = Field(default=None, gt=0)
    is_negotiable: bool = False
