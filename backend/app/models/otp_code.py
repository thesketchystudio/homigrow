"""
app/models/otp_code.py

A single issued OTP code, stored hashed, tagged with the purpose it
was issued for (app.models.enums.OTPPurpose). Delivered by email via
Resend (app/services/email_service.py) — the Figma signup design sends
its 6-digit verification code to email, not phone/SMS; MSG91/SMS
integration is shelved for now (09_Phase_2.md amendment, 2026-07-14;
M4 migration renamed this table's identifier column from phone to
email). Rows are short-lived; a daily cleanup job deletes expired ones
(P4+) rather than this model enforcing it.
"""

from sqlalchemy import Column, DateTime, Index, SmallInteger, String, text
from sqlalchemy.dialects.postgresql import ENUM as PGEnum
from sqlalchemy.dialects.postgresql import UUID

from app.db.base import Base
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
        PGEnum(
            OTPPurpose,
            name="otp_purpose",
            create_type=False,
            values_callable=lambda enum_cls: [member.value for member in enum_cls],
        ),
        nullable=False,
    )
    attempts = Column(SmallInteger, nullable=False, server_default="0")

    expires_at = Column(DateTime(timezone=True), nullable=False)
    consumed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=text("now()"))

    __table_args__ = (
        Index("ix_otp_codes_email_purpose_expires", "email", "purpose", "expires_at"),
    )
