"""
app/models/boost.py

Admin-editable catalog of listing-boost tiers and pricing. Plans live
in the database rather than being hardcoded, so pricing and features
can change without a code deployment.
"""

from sqlalchemy import Boolean, Column, DateTime, Numeric, String, text
from sqlalchemy.dialects.postgresql import JSONB, UUID

from app.db.base import Base
from app.models._helpers import _pg_enum
from app.models.enums import BoostTier


class BoostPlan(Base):
    """A purchasable listing-boost plan, defining its tier and daily price."""

    __tablename__ = "boost_plans"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    name = Column(String(50), nullable=False)

    # postgresql.ENUM is used instead of the generic sa.Enum type — see
    # app/models/user.py for the reason.
    tier = Column(
        _pg_enum(BoostTier, "boost_tier"),
        nullable=False,
    )
    # ₹/day rate. Duration is chosen per-order (see BoostOrder), not fixed
    # per plan — M1 originally paired price with a fixed duration_days,
    # but the checkout design lets a broker pick 7/15/30 days independently
    # of the plan tier, with its own volume discount; M12 dropped that column.
    price = Column(Numeric(10, 2), nullable=False)
    features = Column(JSONB, nullable=False, server_default=text("'[]'::jsonb"))
    # Illustrative views/leads/calls ranges shown on the checkout page's
    # "Expected Reach" panel (marketing copy, not measured analytics).
    # Shape: {"views_min", "views_max", "leads_min", "leads_max", "calls_min", "calls_max"}.
    reach_estimate = Column(JSONB, nullable=False, server_default=text("'{}'::jsonb"))
    is_active = Column(Boolean, nullable=False, server_default=text("true"))

    # No updated_at: a plan is deactivated via is_active rather than
    # having its historical pricing edited in place.
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=text("now()"))
