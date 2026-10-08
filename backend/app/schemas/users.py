"""
app/schemas/users.py

Pydantic request/response shapes for the /users/me resource family:
profile read/update, password change, and session listing.
"""

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, field_validator

from app.core.security import validate_password_strength
from app.models.enums import UserRole, VerificationStatus


class BrokerProfileOut(BaseModel):
    """Embedded on UserRead only when the account's role is broker."""

    model_config = ConfigDict(from_attributes=True)

    rera_number: Optional[str] = None
    verification_status: VerificationStatus
    bio: Optional[str] = None
    company_name: Optional[str] = None
    experience_years: Optional[int] = None
    specializations: list = []
    social_links: dict = {}
    service_areas: list = []


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    phone: Optional[str] = None
    email: Optional[str] = None
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    role: UserRole
    is_phone_verified: bool
    is_email_verified: bool
    preferences: dict
    created_at: datetime
    broker_profile: Optional[BrokerProfileOut] = None


class BrokerProfileUpdateRequest(BaseModel):
    """
    Editable subset of BrokerProfileOut — rera_number and
    verification_status are excluded since changing either belongs to
    the verification-document resubmission flow
    (POST /brokers/me/verification-documents), not a plain profile edit.
    Only fields the caller actually supplied are applied (see
    UserUpdateRequest's own PATCH-semantics note).
    """

    bio: Optional[str] = None
    company_name: Optional[str] = None
    experience_years: Optional[int] = None
    specializations: Optional[list[str]] = None
    service_areas: Optional[list[str]] = None


class UserUpdateRequest(BaseModel):
    """
    All fields optional: PATCH semantics, only supplied fields are
    changed. Distinguishing "not sent" from "sent as null" isn't needed
    here since none of these fields are nullable-clearable via this
    endpoint today.
    """

    full_name: Optional[str] = None
    email: Optional[str] = None
    avatar_url: Optional[str] = None
    preferences: Optional[dict] = None
    # Only applied when the caller's role is broker and a broker_profile
    # row already exists (always true for a broker account, created at
    # signup) — silently ignored otherwise rather than erroring, since a
    # client account simply has nothing here to update.
    broker_profile: Optional[BrokerProfileUpdateRequest] = None


class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def new_password_must_be_strong(cls, value: str) -> str:
        validate_password_strength(value)
        return value


class SessionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_agent: Optional[str] = None
    ip: Optional[str] = None
    created_at: datetime
    expires_at: datetime
