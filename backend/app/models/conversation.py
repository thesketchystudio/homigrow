"""
app/models/conversation.py

Broker-client chat: a conversation between exactly one client and one
broker, optionally tied to a property, containing an ordered list of
messages.
"""

from sqlalchemy import Column, DateTime, ForeignKey, Index, Text, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.base import Base


class Conversation(Base):
    """A chat thread between one client and one broker."""

    __tablename__ = "conversations"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))

    # Both parties cascade on delete: a two-party conversation has no
    # meaning once either side no longer exists.
    client_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    broker_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    property_id = Column(UUID(as_uuid=True), ForeignKey("properties.id", ondelete="SET NULL"), nullable=True)

    last_message_at = Column(DateTime(timezone=True), nullable=True)

    # No updated_at: last_message_at is the mutable timestamp that matters here.
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=text("now()"))

    client = relationship("User", foreign_keys=[client_id])
    broker = relationship("User", foreign_keys=[broker_id])
    property = relationship("Property")
    messages = relationship(
        "Message",
        back_populates="conversation",
        cascade="all, delete-orphan",
        order_by="Message.created_at",
    )

    __table_args__ = (
        # Enforces one conversation per (client, broker, property).
        # COALESCE normalizes a NULL property_id to a fixed sentinel so
        # the general, not-tied-to-a-listing conversation is also unique
        # per pair — a plain unique constraint would treat every NULL as
        # distinct and allow duplicates.
        Index(
            "ix_conversations_client_broker_property_unique",
            "client_id",
            "broker_id",
            text("COALESCE(property_id, '00000000-0000-0000-0000-000000000000'::uuid)"),
            unique=True,
        ),
    )


class Message(Base):
    """A single message within a conversation."""

    __tablename__ = "messages"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    conversation_id = Column(UUID(as_uuid=True), ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False)
    sender_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    body = Column(Text, nullable=False)
    read_at = Column(DateTime(timezone=True), nullable=True)

    # No updated_at: messages are not edited; read_at is the only
    # mutation and is tracked explicitly for read receipts.
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=text("now()"))

    conversation = relationship("Conversation", back_populates="messages")
    sender = relationship("User")

    __table_args__ = (
        # Supports paginated history reads ordered from newest to oldest.
        Index("ix_messages_conversation_created", "conversation_id", text("created_at DESC")),
    )
