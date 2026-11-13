"""
app/models/admin_audit_log.py

Append-only record of every admin mutation (moderation decisions,
suspensions, reinstatements). A row is written inside the same
transaction as the change it describes, so an admin action can never
commit without its audit entry. Rows are never updated or deleted.
"""

from sqlalchemy import BigInteger, Column, DateTime, ForeignKey, Index, String, text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import relationship

from app.db.base import Base


class AdminAuditLog(Base):
    """One admin action against one target (a property or a user)."""

    __tablename__ = "admin_audit_log"

    # bigserial rather than uuid: append-only and high-volume, and the
    # insertion order is meaningful when reading the trail back.
    id = Column(BigInteger, primary_key=True, autoincrement=True)

    # RESTRICT: an admin's trail must outlive any attempt to delete the admin.
    admin_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    action = Column(String(50), nullable=False)
    target_type = Column(String(30), nullable=True)
    target_id = Column(UUID(as_uuid=True), nullable=True)
    meta = Column(JSONB, nullable=False, server_default=text("'{}'::jsonb"))

    # No updated_at: rows are immutable once written.
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=text("now()"))

    admin = relationship("User")

    __table_args__ = (
        Index("ix_admin_audit_log_admin_created", "admin_id", text("created_at DESC")),
        Index("ix_admin_audit_log_target", "target_type", "target_id"),
    )
