"""
app/models/property_view.py

Append-only log of property-detail page views, powering the broker
Analytics page's Total Views KPI/trend and the view-based conversion
rate on Top Performing Listings. Logged-in viewers are deduped to one
row per property (a repeat visit from the same account never inflates
the count). Anonymous viewers are deduped to one row per visitor per
property per hour using visitor_hash, a keyed hash that identifies the
visitor without storing an IP address.
"""

from sqlalchemy import Column, DateTime, ForeignKey, Index, String, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.base import Base


class PropertyView(Base):
    """One logged view of a property's detail page."""

    __tablename__ = "property_views"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    property_id = Column(UUID(as_uuid=True), ForeignKey("properties.id", ondelete="CASCADE"), nullable=False)
    # SET NULL: a view stays counted even if the viewing account is later deleted.
    viewer_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    # Keyed hash of an anonymous visitor (see app/core/visitor.py); NULL for
    # logged-in viewers, who are identified by viewer_id instead.
    visitor_hash = Column(String(64), nullable=True)

    # No updated_at: a view is logged once and never mutated.
    viewed_at = Column(DateTime(timezone=True), nullable=False, server_default=text("now()"))

    property = relationship("Property")
    viewer = relationship("User")

    __table_args__ = (
        Index("ix_property_views_property_viewed_at", "property_id", "viewed_at"),
        # Backs the "seen this anonymous visitor recently?" dedupe lookup.
        Index("ix_property_views_property_visitor_viewed_at", "property_id", "visitor_hash", "viewed_at"),
        Index(
            "ix_property_views_property_viewer_unique",
            "property_id",
            "viewer_id",
            unique=True,
            postgresql_where=text("viewer_id IS NOT NULL"),
        ),
    )
