"""
app/schemas/leads.py

Request/response shapes for the property-enquiry endpoint and the
broker-facing lead pipeline (list/detail/status update/notes). Enquiry
works for both anonymous and logged-in callers — contact_name/contact_phone
are always submitted directly (the form is never prefilled from an
account); the pipeline endpoints are broker-authenticated only.
"""

from datetime import date, datetime
from typing import Literal, Optional
from uuid import UUID

from pydantic import BaseModel, Field, field_validator

from app.core.phone import normalize_indian_mobile

from app.models.enums import ListingType, LeadStatus


class EnquireRequest(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    # Normalised to "+91XXXXXXXXXX" by the validator below, so the stored
    # value (and the per-number dedupe and limits keyed on it) is canonical.
    phone: str = Field(min_length=1, max_length=20)
    # Distinguishes the contact card's two CTAs. No default — a client
    # submitting neither is a genuine bug, not something to paper over.
    source: Literal["tour_request", "number_request"]
    message: Optional[str] = Field(default=None, max_length=1000)
    # No dedicated Lead column for this — folded into Lead.message
    # server-side, since message is the only free-text storage the model has.
    preferred_date: Optional[date] = None

    @field_validator("name")
    @classmethod
    def _name_must_look_like_a_name(cls, value: str) -> str:
        """Brokers see this name verbatim, so reject blanks, digit-only strings and pasted links."""
        cleaned = " ".join(value.split())
        lowered = cleaned.lower()
        if sum(ch.isalpha() for ch in cleaned) < 2 or "://" in lowered or "www." in lowered:
            raise ValueError("Please enter your real name.")
        return cleaned

    @field_validator("phone")
    @classmethod
    def _phone_must_be_an_indian_mobile(cls, value: str) -> str:
        normalized = normalize_indian_mobile(value)
        if normalized is None:
            raise ValueError("Please enter a valid 10-digit mobile number.")
        return normalized


class EnquireResponse(BaseModel):
    id: UUID
    status: LeadStatus
    broker_name: Optional[str] = None
    # Only populated for logged-in requesters; anonymous visitors still
    # create the lead and the broker contacts them, but never see the number.
    broker_phone: Optional[str] = None


class LeadNoteRead(BaseModel):
    id: UUID
    body: str
    author_name: Optional[str] = None
    created_at: datetime


class LeadListItem(BaseModel):
    id: UUID
    status: LeadStatus
    source: str
    contact_name: Optional[str] = None
    contact_phone: Optional[str] = None
    message: Optional[str] = None
    follow_up_at: Optional[datetime] = None
    created_at: datetime
    # None until the broker has logged at least one note against this lead.
    last_contacted_at: Optional[datetime] = None
    property_id: UUID
    property_title: str
    property_locality: str
    property_city: str
    property_price: float
    property_listing_type: ListingType


class LeadDetail(LeadListItem):
    notes: list[LeadNoteRead] = []


class LeadUpdateRequest(BaseModel):
    status: Optional[LeadStatus] = None
    follow_up_at: Optional[datetime] = None


class LeadNoteCreateRequest(BaseModel):
    body: str = Field(min_length=1, max_length=2000)
