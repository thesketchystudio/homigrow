"""
app/models/otp_code.py

A single issued OTP code, stored hashed, tagged with the purpose it
was issued for (app.models.enums.OTPPurpose). Delivered by email via
Resend (app/services/email_service.py) — the signup design sends its
6-digit verification code to email, not phone/SMS, so this table
identifies codes by email rather than phone. Rows are short-lived; a
future daily cleanup job is expected to delete expired ones rather
than this model enforcing it.
"""

from sqlalchemy import Column, DateTime, Index, SmallInteger, String, text
from sqlalchemy.dialects.postgresql import UUID

from app.db.base import Base
from app.models._helpers import _pg_enum
from app.models.enums import OTPPurpose


class OTPCode(Base):
    """A hashed OTP code issued to an email address for a specific purpose."""

    __tablename__ = "otp_codes"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))

    email = Column(String(255), nullable=False)
    code_hash = Column(String(255), nullable=False)

    # postgresql.ENUM is used instead of the generic sa.Enum type — see
    # app/models/user.py for why (create_type propagation).
    purpose = Column(
        _pg_enum(OTPPurpose, "otp_purpose"),
        nullable=False,
    )
    attempts = Column(SmallInteger, nullable=False, server_default="0")

    expires_at = Column(DateTime(timezone=True), nullable=False)
    consumed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=text("now()"))

    __table_args__ = (
        Index("ix_otp_codes_email_purpose_expires", "email", "purpose", "expires_at"),
    )
