"""
app/models/refresh_token.py

A single issued refresh token, identified by the hash of its opaque
value (the raw value is never stored). Powers session listing/
revocation and rotation-on-refresh — presenting an already-revoked
token's hash is the theft signal that revokes every session belonging
to that user.
"""

from sqlalchemy import Column, DateTime, ForeignKey, Index, String, Text, text
from sqlalchemy.dialects.postgresql import INET, UUID
from sqlalchemy.orm import relationship

from app.db.base import Base


class RefreshToken(Base):
    """An issued refresh token, stored hashed, scoped to one user session."""

    __tablename__ = "refresh_tokens"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    token_hash = Column(String(255), nullable=False, unique=True)
    user_agent = Column(Text, nullable=True)
    ip = Column(INET, nullable=True)

    expires_at = Column(DateTime(timezone=True), nullable=False)
    revoked_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=text("now()"))

    user = relationship("User")

    __table_args__ = (
        # Powers "active sessions" listing and expiry cleanup queries.
        Index("ix_refresh_tokens_user_expires", "user_id", "expires_at"),
    )
