"""
app/models/broker_profile.py

1:1 extension of User holding everything broker-only: RERA number,
verification status and documents, bio, specializations, and social
links. Clients and admins never have a row here. A row is created when
a user signs up as, or upgrades to, a broker.
"""

from sqlalchemy import Column, ForeignKey, SmallInteger, String, Text, text
from sqlalchemy.dialects.postgresql import ENUM as PGEnum
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import relationship

from app.db.base import Base, TimestampMixin
from app.models.enums import VerificationStatus


class BrokerProfile(Base, TimestampMixin):
    """Broker-only profile data, linked one-to-one with a User."""

    __tablename__ = "broker_profiles"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))

    # UNIQUE + NOT NULL enforces the 1:1 relationship at the database
    # level, not just in application code.
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )

    rera_number = Column(String(50), nullable=True, unique=True)

    # postgresql.ENUM is used instead of the generic sa.Enum type — see
    # app/models/user.py for the reason.
    verification_status = Column(
        PGEnum(
            VerificationStatus,
            name="verification_status",
            create_type=False,
            values_callable=lambda enum_cls: [member.value for member in enum_cls],
        ),
        nullable=False,
        server_default=VerificationStatus.unverified.value,
    )
    # List of {type, url, uploaded_at} objects for uploaded ID/RERA documents.
    verification_documents = Column(JSONB, nullable=False, server_default=text("'[]'::jsonb"))

    bio = Column(Text, nullable=True)
    company_name = Column(String(150), nullable=True)
    experience_years = Column(SmallInteger, nullable=True)

    specializations = Column(JSONB, nullable=False, server_default=text("'[]'::jsonb"))
    social_links = Column(JSONB, nullable=False, server_default=text("'{}'::jsonb"))
    service_areas = Column(JSONB, nullable=False, server_default=text("'[]'::jsonb"))

    user = relationship("User", back_populates="broker_profile")
