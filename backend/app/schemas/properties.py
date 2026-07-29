"""
app/schemas/properties.py

Pydantic read shapes for the public property details resource
(05_API_Design.md §properties; 10_Phase_3.md P3-T04).
"""

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, computed_field

from app.models.enums import (
    Furnishing,
    ListingType,
    MediaType,
    PropertyType,
    VerificationStatus,
)


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
