"""
app/models/lead.py

Broker CRM: one lead per client enquiry on a property, with a note
history trail. broker_id is denormalized directly onto Lead (rather
than derived through property) so the broker dashboard's read queries
never need to join properties.
"""

from sqlalchemy import Column, DateTime, ForeignKey, Index, String, Text, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.base import Base, TimestampMixin
from app.models._helpers import _pg_enum
from app.models.enums import LeadStatus


class Lead(Base, TimestampMixin):
    """A client's enquiry on a property, tracked through a broker's pipeline."""

    __tablename__ = "leads"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))

    property_id = Column(UUID(as_uuid=True), ForeignKey("properties.id", ondelete="CASCADE"), nullable=False)
    # SET NULL: the broker keeps the lead's CRM history even if the
    # client account is later deleted.
    client_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    broker_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    # postgresql.ENUM is used instead of the generic sa.Enum type — see
    # app/models/user.py for the reason.
    status = Column(
        _pg_enum(LeadStatus, "lead_status"),
        nullable=False,
        server_default=LeadStatus.new.value,
    )
    source = Column(String(30), nullable=False, server_default=text("'enquiry'"))
    message = Column(Text, nullable=True)
    follow_up_at = Column(DateTime(timezone=True), nullable=True)

    # Always populated from the submitted contact form regardless of login
    # state — the Property Contact Card is never gated behind auth, and an
    # anonymous enquirer has no `client_id`/account to read a name/phone
    # from. Kept even when client_id is set, since the form isn't prefilled
    # from the account either.
    contact_name = Column(String(100), nullable=True)
    contact_phone = Column(String(15), nullable=True)

    property = relationship("Property")
    client = relationship("User", foreign_keys=[client_id])
    broker = relationship("User", foreign_keys=[broker_id])
    notes = relationship("LeadNote", back_populates="lead", cascade="all, delete-orphan", order_by="LeadNote.created_at")

    __table_args__ = (
        # created_at is inherited from TimestampMixin, so it is
        # referenced through a text() expression rather than a bare
        # column object, to get descending order in the index.
        Index("ix_leads_broker_status_created", "broker_id", "status", text("created_at DESC")),
        Index("ix_leads_property", "property_id"),
        # Backs the anonymous-enquiry dedup lookup (property_id + contact_phone);
        # ix_leads_property alone would force a scan of every lead on the
        # property for that filter as leads grow.
        Index("ix_leads_property_contact_phone", "property_id", "contact_phone"),
    )


class LeadNote(Base):
    """A single note logged against a lead, forming an append-only history."""

    __tablename__ = "lead_notes"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    lead_id = Column(UUID(as_uuid=True), ForeignKey("leads.id", ondelete="CASCADE"), nullable=False)
    author_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    body = Column(Text, nullable=False)

    # No updated_at: notes are append-only and are never edited after creation.
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=text("now()"))

    lead = relationship("Lead", back_populates="notes")
    author = relationship("User")

    __table_args__ = (
        Index("ix_lead_notes_lead", "lead_id"),
    )
