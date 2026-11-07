"""
app/schemas/users.py

Pydantic request/response shapes for the /users/me resource family:
profile read/update, password change, and session listing.
"""

from datetime import datetime
from typing import Annotated, Optional
from uuid import UUID

import json

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.core.security import validate_password_strength
from app.models.enums import UserRole, VerificationStatus
from app.schemas._validators import EmailAddress, HttpUrlString


# Limits mirror the column sizes (users.full_name is VARCHAR(100),
# broker_profiles.company_name VARCHAR(150)) and the profile forms, so an
# oversized value is a clean 422 instead of a database error.
FULL_NAME_MAX_LENGTH = 100
BIO_MAX_LENGTH = 1000
COMPANY_NAME_MAX_LENGTH = 150
MAX_EXPERIENCE_YEARS = 80
LIST_MAX_ITEMS = 20
LIST_ITEM_MAX_LENGTH = 100
# The preferences blob is free-form, so its serialised size is bounded
# instead of its shape.
PREFERENCES_MAX_BYTES = 16 * 1024


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
    has_password: bool
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

    bio: Optional[str] = Field(default=None, max_length=BIO_MAX_LENGTH)
    company_name: Optional[str] = Field(default=None, max_length=COMPANY_NAME_MAX_LENGTH)
    experience_years: Optional[int] = Field(default=None, ge=0, le=MAX_EXPERIENCE_YEARS)
    specializations: Optional[list[Annotated[str, Field(min_length=1, max_length=LIST_ITEM_MAX_LENGTH)]]] = Field(
        default=None, max_length=LIST_MAX_ITEMS
    )
    service_areas: Optional[list[Annotated[str, Field(min_length=1, max_length=LIST_ITEM_MAX_LENGTH)]]] = Field(
        default=None, max_length=LIST_MAX_ITEMS
    )


class UserUpdateRequest(BaseModel):
    """
    All fields optional: PATCH semantics, only supplied fields are
    changed. Distinguishing "not sent" from "sent as null" isn't needed
    here since none of these fields are nullable-clearable via this
    endpoint today.
    """

    full_name: Optional[str] = Field(default=None, min_length=1, max_length=FULL_NAME_MAX_LENGTH)
    avatar_url: Optional[HttpUrlString] = None
    preferences: Optional[dict] = None
    # Only applied when the caller's role is broker and a broker_profile
    # row already exists (always true for a broker account, created at
    # signup) — silently ignored otherwise rather than erroring, since a
    # client account simply has nothing here to update.
    broker_profile: Optional[BrokerProfileUpdateRequest] = None

    @field_validator("preferences")
    @classmethod
    def _preferences_must_be_small(cls, value: Optional[dict]) -> Optional[dict]:
        """Rejects a preferences blob whose JSON form exceeds PREFERENCES_MAX_BYTES, so the column cannot be used as free storage."""
        if value is not None and len(json.dumps(value, separators=(",", ":")).encode("utf-8")) > PREFERENCES_MAX_BYTES:
            raise ValueError(f"Preferences must be {PREFERENCES_MAX_BYTES // 1024} KB or smaller")
        return value


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


class EmailChangeRequest(BaseModel):
    """
    Starts an email change. current_password is required for accounts that
    have a password; accounts without one (Google sign-in) instead confirm
    with a code sent to their current address.
    """

    new_email: EmailAddress
    current_password: Optional[str] = None


class EmailChangeConfirmRequest(BaseModel):
    """Completes an email change with the code sent to the new address (and, for accounts without a password, the one sent to the current address)."""

    new_email: EmailAddress
    code: str
    current_email_code: Optional[str] = None
