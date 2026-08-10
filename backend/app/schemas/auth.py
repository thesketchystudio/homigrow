"""
app/schemas/auth.py

Pydantic request/response shapes for the auth endpoints. Schemas
define API shape, SQLAlchemy models define storage; the two are never
the same object.
"""

from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, field_validator

from app.core.security import validate_password_strength
from app.models.enums import OTPPurpose, UserRole


class SignupRequest(BaseModel):
    """
    Password-path signup input. email is required (not Optional) since
    it's the signup-verification OTP's delivery address — the signup
    design collects it alongside phone at signup, not later.
    """

    phone: str
    role: UserRole
    full_name: Optional[str] = None
    email: str
    password: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None

    @field_validator("role")
    @classmethod
    def role_must_be_signupable(cls, value: UserRole) -> UserRole:
        """
        Blocks admin creation through signup — admin accounts are
        provisioned only by script/console.
        """
        if value == UserRole.admin:
            raise ValueError("role must be client or broker")
        return value

    @field_validator("password")
    @classmethod
    def password_must_be_strong(cls, value: Optional[str]) -> Optional[str]:
        """Only checked when a password is actually supplied — OTP-only signup passes password=None."""
        if value is not None:
            validate_password_strength(value)
        return value


class SignupResponse(BaseModel):
    user_id: UUID


class LoginRequest(BaseModel):
    phone_or_email: str
    password: str


class GoogleAuthRequest(BaseModel):
    """
    Input for Google Sign-In (POST /auth/google). role is omitted on the
    login page (an account must already exist) and supplied on the
    signup page's Step 2 "Continue with Google" option, where it's
    already known from Step 1's role select.
    """

    id_token: str
    role: Optional[UserRole] = None

    @field_validator("role")
    @classmethod
    def role_must_be_signupable(cls, value: Optional[UserRole]) -> Optional[UserRole]:
        if value == UserRole.admin:
            raise ValueError("role must be client or broker")
        return value


class UserOut(BaseModel):
    """Public-safe user projection returned alongside auth tokens."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    phone: Optional[str] = None
    email: Optional[str] = None
    full_name: Optional[str] = None
    role: UserRole


class TokenResponse(BaseModel):
    """
    Shared response shape for every endpoint that hands back a session
    (login, refresh). The refresh token itself is never in this body;
    it travels only as the httpOnly cookie.
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

    @field_validator("new_password")
    @classmethod
    def new_password_must_be_strong(cls, value: str) -> str:
        validate_password_strength(value)
        return value


class OTPRequestRequest(BaseModel):
    """Powers signup verification's 'Resend OTP' action — reissues a code for (email, purpose)."""

    email: str
    purpose: OTPPurpose


class OTPVerifyRequest(BaseModel):
    email: str
    code: str
    purpose: OTPPurpose
