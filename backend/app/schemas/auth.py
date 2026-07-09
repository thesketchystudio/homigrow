"""
app/schemas/auth.py

Pydantic request/response shapes for the auth endpoints. Mirrors the
resource catalog in docs/architecture/05_API_Design.md — schemas
define API shape, SQLAlchemy models define storage; the two are never
the same object (03_Backend_Architecture.md).
"""

from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, field_validator

from app.models.enums import UserRole


class SignupRequest(BaseModel):
    """Password-path signup input."""

    phone: str
    role: UserRole
    full_name: Optional[str] = None
    email: Optional[str] = None
    password: Optional[str] = None

    @field_validator("role")
    @classmethod
    def role_must_be_signupable(cls, value: UserRole) -> UserRole:
        """
        Blocks admin creation through signup — admin accounts are
        provisioned only by script/console (14_Security.md §RBAC).
        """
        if value == UserRole.admin:
            raise ValueError("role must be client or broker")
        return value


class SignupResponse(BaseModel):
    user_id: UUID


class LoginRequest(BaseModel):
    phone_or_email: str
    password: str


class UserOut(BaseModel):
    """Public-safe user projection returned alongside auth tokens."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    phone: str
    email: Optional[str] = None
    full_name: Optional[str] = None
    role: UserRole


class TokenResponse(BaseModel):
    """
    Shared response shape for every endpoint that hands back a session
    (login, refresh) — per 05_API_Design.md's "token response shape
    everywhere" contract. The refresh token itself is never in this
    body; it travels only as the httpOnly cookie.
    """

    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserOut


class ForgotPasswordRequest(BaseModel):
    email: str


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str
