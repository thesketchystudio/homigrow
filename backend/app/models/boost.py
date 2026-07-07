"""
app/models/boost.py

Admin-editable catalog of listing-boost tiers and pricing. Plans live
in the database rather than being hardcoded, so pricing and features
can change without a code deployment.
"""

from sqlalchemy import Boolean, Column, DateTime, Numeric, SmallInteger, String, text
from sqlalchemy.dialects.postgresql import ENUM as PGEnum
from sqlalchemy.dialects.postgresql import JSONB, UUID

from app.db.base import Base
from app.models.enums import BoostTier


class BoostPlan(Base):
    """A purchasable listing-boost plan, defining its tier, price, and duration."""

    __tablename__ = "boost_plans"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    name = Column(String(50), nullable=False)

    # postgresql.ENUM is used instead of the generic sa.Enum type — see
    # app/models/user.py for the reason.
    tier = Column(
        PGEnum(
            BoostTier,
            name="boost_tier",
            create_type=False,
            values_callable=lambda enum_cls: [member.value for member in enum_cls],
        ),
        nullable=False,
    )
    price = Column(Numeric(10, 2), nullable=False)
    duration_days = Column(SmallInteger, nullable=False)
    features = Column(JSONB, nullable=False, server_default=text("'[]'::jsonb"))
    is_active = Column(Boolean, nullable=False, server_default=text("true"))

    # No updated_at: a plan is deactivated via is_active rather than
    # having its historical pricing edited in place.
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=text("now()"))
