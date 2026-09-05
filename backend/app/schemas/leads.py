"""
app/schemas/leads.py

Request/response shapes for the property-enquiry endpoint. Works for both
anonymous and logged-in callers — contact_name/contact_phone are always
submitted directly (the form is never prefilled from an account).
"""

from datetime import date
from typing import Literal, Optional
from uuid import UUID

from pydantic import BaseModel, Field

from app.models.enums import LeadStatus


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
