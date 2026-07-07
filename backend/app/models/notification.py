"""
app/models/notification.py

In-app notification feed for all three portals. All notification
writes should go through a single service entrypoint rather than
inserting rows directly, so delivery channels can be added centrally.
"""

from sqlalchemy import Column, DateTime, ForeignKey, Index, String, Text, text
from sqlalchemy.dialects.postgresql import ENUM as PGEnum
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import relationship

from app.db.base import Base
from app.models.enums import NotificationType


class Notification(Base):
    """A single in-app notification delivered to a user."""

    __tablename__ = "notifications"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    # postgresql.ENUM is used instead of the generic sa.Enum type — see
    # app/models/user.py for the reason.
    type = Column(
        PGEnum(
            NotificationType,
            name="notification_type",
            create_type=False,
            values_callable=lambda enum_cls: [member.value for member in enum_cls],
        ),
        nullable=False,
    )
    title = Column(String(150), nullable=False)
    body = Column(Text, nullable=True)
    data = Column(JSONB, nullable=False, server_default=text("'{}'::jsonb"))  # deep-link payload
    read_at = Column(DateTime(timezone=True), nullable=True)

    # No updated_at: read_at is the only mutation and it is tracked explicitly.
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=text("now()"))

    user = relationship("User")

    __table_args__ = (
        Index("ix_notifications_user_read_created", "user_id", "read_at", text("created_at DESC")),
    )
