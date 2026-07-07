"""
app/models/property.py

The core listing entity (sale/rent/PG) and its ordered media gallery.
Property status is governed by the state machine in
app/services/property_lifecycle.py — the status column should never be
mutated directly outside that service.
"""

from geoalchemy2 import Geography
from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Column,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    SmallInteger,
    String,
    Text,
    func,
    text,
)
from sqlalchemy.dialects.postgresql import ENUM as PGEnum
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import relationship

from app.db.base import Base, TimestampMixin
from app.models.enums import Furnishing, ListingType, MediaType, PropertyStatus, PropertyType


def _pg_enum(enum_cls, name: str):
    """
    Builds a native Postgres enum column type with create_type=False,
    since the enum type is created explicitly in the Alembic migration
    rather than auto-managed per table. Uses postgresql.ENUM rather than
    the generic sa.Enum type, which does not propagate create_type when
    adapted to the Postgres dialect.
    """
    return PGEnum(
        enum_cls,
        name=name,
        create_type=False,
        values_callable=lambda ec: [member.value for member in ec],
    )


class Property(Base, TimestampMixin):
    """A single property listing for sale, rent, or PG/co-living."""

    __tablename__ = "properties"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))

    # RESTRICT (not CASCADE): a broker's listings must be transferred or
    # closed via the admin flow before the broker's user row can be deleted.
    broker_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)

    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)

    listing_type = Column(_pg_enum(ListingType, "listing_type"), nullable=False)
    property_type = Column(_pg_enum(PropertyType, "property_type"), nullable=False)
    status = Column(_pg_enum(PropertyStatus, "property_status"), nullable=False, server_default=PropertyStatus.draft.value)

    price = Column(Numeric(12, 2), nullable=False)
    maintenance_monthly = Column(Numeric(10, 2), nullable=True)
    deposit = Column(Numeric(12, 2), nullable=True)
    is_negotiable = Column(Boolean, nullable=False, server_default=text("false"))

    bhk = Column(SmallInteger, nullable=True)  # null for plots/offices
    bathrooms = Column(SmallInteger, nullable=True)
    area_sqft = Column(Numeric(10, 2), nullable=True)
    floor = Column(SmallInteger, nullable=True)
    total_floors = Column(SmallInteger, nullable=True)
    facing = Column(String(20), nullable=True)
    age_years = Column(SmallInteger, nullable=True)
    furnishing = Column(_pg_enum(Furnishing, "furnishing"), nullable=True)

    amenities = Column(JSONB, nullable=False, server_default=text("'[]'::jsonb"))

    address_line = Column(String(255), nullable=False)
    locality = Column(String(100), nullable=False)
    city = Column(String(100), nullable=False)
    state = Column(String(100), nullable=False)
    pincode = Column(String(6), nullable=False)
    landmark = Column(String(150), nullable=True)
    metro_distance_m = Column(Integer, nullable=True)

    # spatial_index=False: the GIST index is declared explicitly below in
    # __table_args__ instead of through geoalchemy2's auto-managed DDL
    # event, so the generated migration DDL is predictable and reviewable.
    location = Column(Geography(geometry_type="POINT", srid=4326, spatial_index=False), nullable=True)

    # {room_type, sharing, meals, rules} — only populated when listing_type is "pg".
    pg_details = Column(JSONB, nullable=True)

    # Denormalized counter for fast reads; the events table is the source of truth.
    views_count = Column(Integer, nullable=False, server_default="0")

    published_at = Column(DateTime(timezone=True), nullable=True)
    expires_at = Column(DateTime(timezone=True), nullable=True)

    broker = relationship("User")
    media = relationship(
        "PropertyMedia",
        back_populates="property",
        cascade="all, delete-orphan",
        order_by="PropertyMedia.position",
    )

    __table_args__ = (
        CheckConstraint("price > 0", name="ck_properties_price_positive"),
        Index("ix_properties_status_listing_type", "status", "listing_type"),
        Index("ix_properties_city_locality", "city", "locality"),
        Index("ix_properties_price", "price"),
        Index("ix_properties_broker_status", "broker_id", "status"),
        Index("ix_properties_location", "location", postgresql_using="gist"),
        # Supports queries for active listings ordered by newest first.
        Index(
            "ix_properties_active_published_at",
            published_at.desc(),
            postgresql_where=text("status = 'active'"),
        ),
    )


class PropertyMedia(Base):
    """An ordered photo or video belonging to a property's gallery."""

    __tablename__ = "property_media"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    property_id = Column(UUID(as_uuid=True), ForeignKey("properties.id", ondelete="CASCADE"), nullable=False)

    media_type = Column(_pg_enum(MediaType, "media_type"), nullable=False)
    url = Column(Text, nullable=False)
    stream_uid = Column(String(255), nullable=True)  # video only (Cloudflare Stream)
    position = Column(SmallInteger, nullable=False, server_default="0")
    is_cover = Column(Boolean, nullable=False, server_default=text("false"))
    width = Column(Integer, nullable=True)
    height = Column(Integer, nullable=True)

    # No updated_at: reordering or changing the cover image replaces
    # rows entirely rather than mutating them in place.
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    property = relationship("Property", back_populates="media")

    __table_args__ = (
        Index("ix_property_media_property_position", "property_id", "position"),
        Index(
            "ix_property_media_one_cover",
            "property_id",
            unique=True,
            postgresql_where=text("is_cover = true"),
        ),
    )
