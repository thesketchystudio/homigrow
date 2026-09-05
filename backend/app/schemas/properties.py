"""
app/schemas/properties.py

Pydantic read shapes for the public property listing resources.
"""

from datetime import datetime
from typing import Literal, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, computed_field

from app.models.enums import (
    Furnishing,
    ListingType,
    MediaType,
    PaymentStructure,
    PriceFlexibility,
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


class JVPartner(BaseModel):
    """One row of Property.jv_details.partners — a joint-venture co-owner and their stake."""

    model_config = ConfigDict(from_attributes=True)

    name: str = Field(min_length=1, max_length=150)
    role: Optional[str] = Field(default=None, max_length=100)
    split_percent: Optional[float] = Field(default=None, ge=0, le=100)
    email: Optional[str] = Field(default=None, max_length=255)
    can_edit: bool = False
    can_approve: bool = False
    can_publish: bool = False


class JVDetails(BaseModel):
    """
    Sub-fields shown only when Property.is_jv_property is true — stored in
    Property.jv_details (JSONB). Not tied to a specific property_type: the
    Figma design shows the same "Is this a JV Property?" toggle on every
    Sell property type's Step 1 form.
    """

    model_config = ConfigDict(from_attributes=True)

    partners: list[JVPartner] = []
    commission_mode: Optional[Literal["auto", "manual"]] = None
    # Object key of the uploaded JV agreement document (private bucket, not
    # a public URL) — set by POST /properties/{id}/jv-agreement, after the
    # property already exists.
    agreement_document_key: Optional[str] = None


class PGDetails(BaseModel):
    """
    Sub-fields shown only when property_type is "pg_colive" — stored in
    Property.pg_details (JSONB). Covers three distinct Figma sub-forms in
    one flexible blob (same reasoning as PlotDetails/LandDetails: read and
    written as a whole, never filtered on):
      - Sell: building-level fields (listing_scope is None)
      - Rent, "Entire Building" (listing_scope="entire")
      - Rent, "Unit / Room" (listing_scope="unit")
    """

    model_config = ConfigDict(from_attributes=True)

    listing_scope: Optional[Literal["entire", "unit"]] = None

    # Sell: PG/co-living building details.
    total_floors: Optional[int] = None
    currently_operational: Optional[bool] = None
    estimated_monthly_revenue: Optional[float] = None

    # Shared across Sell and Rent/Entire.
    total_rooms: Optional[int] = None
    occupancy_types: list[str] = []  # e.g. ["Single", "Double", "Triple"]
    gender: Optional[str] = None  # "Male" | "Female" | "Mixed"

    # Rent/Entire only.
    monthly_rent_per_bed: Optional[float] = None

    # Rent/Unit only.
    room_type: Optional[str] = None
    floor: Optional[int] = None
    bathroom_type: Optional[str] = None  # "Attached" | "Common"
    ac: Optional[str] = None  # "AC" | "Non-AC"
    gender_preference: Optional[str] = None  # "Male" | "Female" | "Any"
    monthly_rent: Optional[float] = None

    # Shared across both Rent sub-forms.
    meals_included: Optional[bool] = None
    amenities: list[str] = []


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
    price_per_sqft: Optional[float] = None
    token_amount: Optional[float] = None
    maintenance_monthly: Optional[float] = None
    deposit: Optional[float] = None
    is_negotiable: bool
    price_flexibility: Optional[PriceFlexibility] = None
    payment_structure: Optional[PaymentStructure] = None
    stamp_duty_percent: Optional[float] = None
    registration_fee_percent: Optional[float] = None
    brokerage_included: bool
    brokerage_percent: Optional[float] = None
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
    pg_details: Optional[PGDetails] = None
    is_jv_property: bool
    jv_details: Optional[JVDetails] = None
    virtual_tour_url: Optional[str] = None
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


class BrokerPropertyListItem(PropertyListItem):
    """
    GET /properties/mine's card shape — PropertyListItem plus status, since
    a broker (unlike the public search grid) needs to see draft/pending
    listings too, not just active ones.
    """

    status: PropertyStatus


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
    Supports residential listings (apartment/villa/independent_house),
    Plot, Land, PG/co-living (Sell and Rent, including Rent's Entire
    Building / Unit-Room split), and the Rent-only commercial types
    (shop/commercial_building/built_to_suit) — plus a cross-cutting JV
    toggle available on any Sell property type. The schema itself doesn't
    enforce which property_type values are "allowed" for a given
    listing_type; the wizard's frontend does, by only offering the
    combinations it has a Step 1 sub-form for.
    """

    title: str = Field(min_length=1, max_length=200)
    listing_type: ListingType
    property_type: PropertyType
    bhk: Optional[int] = None
    bathrooms: Optional[int] = None
    area_sqft: Optional[float] = Field(default=None, gt=0)
    facing: Optional[str] = Field(default=None, max_length=20)
    furnishing: Optional[Furnishing] = None
    built_year: Optional[int] = None
    amenities: list[str] = []
    plot_details: Optional[PlotDetails] = None
    land_details: Optional[LandDetails] = None
    pg_details: Optional[PGDetails] = None
    is_jv_property: bool = False
    jv_details: Optional[JVDetails] = None
    virtual_tour_url: Optional[str] = Field(default=None, max_length=500)
    address_line: str = Field(min_length=1, max_length=255)
    locality: str = Field(min_length=1, max_length=100)
    city: str = Field(min_length=1, max_length=100)
    state: str = Field(min_length=1, max_length=100)
    pincode: str = Field(min_length=1, max_length=6)
    landmark: Optional[str] = None
    price: float = Field(gt=0)
    price_per_sqft: Optional[float] = Field(default=None, gt=0)
    token_amount: Optional[float] = Field(default=None, gt=0)
    maintenance_monthly: Optional[float] = Field(default=None, gt=0)
    deposit: Optional[float] = Field(default=None, gt=0)
    is_negotiable: bool = False
    price_flexibility: Optional[PriceFlexibility] = None
    payment_structure: Optional[PaymentStructure] = None
    stamp_duty_percent: Optional[float] = Field(default=None, ge=0)
    registration_fee_percent: Optional[float] = Field(default=None, ge=0)
    brokerage_included: bool = True
    brokerage_percent: Optional[float] = Field(default=None, ge=0)
