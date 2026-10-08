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

from pydantic import BaseModel, Field

from app.models.enums import ListingType, LeadStatus


class EnquireRequest(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    phone: str = Field(min_length=1, max_length=15)
    # Distinguishes the contact card's two CTAs. No default — a client
    # submitting neither is a genuine bug, not something to paper over.
    source: Literal["tour_request", "number_request"]
    message: Optional[str] = None
    # No dedicated Lead column for this — folded into Lead.message
    # server-side, since message is the only free-text storage the model has.
    preferred_date: Optional[date] = None


class EnquireResponse(BaseModel):
    id: UUID
    status: LeadStatus
    broker_name: Optional[str] = None
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
