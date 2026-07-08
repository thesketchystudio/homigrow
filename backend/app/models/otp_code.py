"""
app/models/otp_code.py

A single issued OTP code, stored hashed, tagged with the purpose it
was issued for (app.models.enums.OTPPurpose). Rows are short-lived;
a daily cleanup job deletes expired ones (P4+) rather than this model
enforcing it.
"""

from sqlalchemy import Column, DateTime, Index, SmallInteger, String, text
from sqlalchemy.dialects.postgresql import ENUM as PGEnum
from sqlalchemy.dialects.postgresql import UUID

from app.db.base import Base
from app.models.enums import OTPPurpose


class OTPCode(Base):
    """A hashed OTP code issued to a phone number for a specific purpose."""

    __tablename__ = "otp_codes"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))

    phone = Column(String(15), nullable=False)
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
        Index("ix_otp_codes_phone_purpose_expires", "phone", "purpose", "expires_at"),
    )
