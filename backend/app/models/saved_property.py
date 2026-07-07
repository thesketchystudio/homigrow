"""
app/models/saved_property.py

Client watchlist — a join table linking a user to a property they have
saved, with no lifecycle beyond insert (save) and delete (unsave).
"""

from sqlalchemy import Column, DateTime, ForeignKey, Index, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.base import Base


class SavedProperty(Base):
    """A property a user has saved to their watchlist."""

    __tablename__ = "saved_properties"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    property_id = Column(UUID(as_uuid=True), ForeignKey("properties.id", ondelete="CASCADE"), primary_key=True)

    # No updated_at: rows are inserted on save and deleted on unsave, never mutated.
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=text("now()"))

    user = relationship("User")
    property = relationship("Property")

    __table_args__ = (
        # The composite primary key already covers (user_id,
        # property_id) lookups; this index supports the reverse
        # direction — counting how many users saved a given property.
        Index("ix_saved_properties_property", "property_id"),
    )
