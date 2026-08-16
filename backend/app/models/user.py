"""
app/models/user.py

Core identity table shared by all three portals (client/broker/admin).
Stays lean, holding only fields authentication touches. Broker-only data
lives in BrokerProfile, a separate 1:1 extension table, so client and
admin rows never carry broker-specific columns.
"""

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Index,
    SmallInteger,
    String,
    Text,
    text,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import relationship

from app.db.base import Base, TimestampMixin
from app.models._helpers import _pg_enum
from app.models.enums import UserRole


class User(Base, TimestampMixin):
    """A single account, shared across the client, broker, and admin portals."""

    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))

    # Phone was the original primary identifier (Indian market, OTP-first
    # login); email became the real identifier once signup verification
    # moved to email OTP (M4). Nullable since M5 — Google Sign-In accounts
    # have no phone number to store. Uniqueness is enforced by the partial
    # ix_users_phone_unique index below, not a plain column constraint, so
    # multiple NULLs are allowed (same pattern email already used).
    phone = Column(String(15), nullable=True)
    email = Column(String(255), nullable=True)
    password_hash = Column(String(255), nullable=True)
    full_name = Column(String(100), nullable=True)

    # postgresql.ENUM is used instead of the generic sa.Enum type: the
    # generic type does not propagate create_type when adapted to the
    # Postgres dialect, so it would attempt to recreate a type this
    # column's migration already creates explicitly.
    role = Column(
        _pg_enum(UserRole, "user_role"),
        nullable=False,
        server_default=UserRole.client.value,
    )

    is_active = Column(Boolean, nullable=False, server_default=text("true"))
    # TODO: never set to true anywhere in the codebase today — phone is not actually verified in any current signup/login flow, so this flag is effectively dead/always-false.
    is_phone_verified = Column(Boolean, nullable=False, server_default=text("false"))
    is_email_verified = Column(Boolean, nullable=False, server_default=text("false"))

    # Account lockout: failed_login_attempts increments on each failed
    # login; once it crosses the configured threshold, locked_until is
    # set and login is blocked until that time passes.
    failed_login_attempts = Column(SmallInteger, nullable=False, server_default="0")
    locked_until = Column(DateTime(timezone=True), nullable=True)

    avatar_url = Column(Text, nullable=True)

    # Notification/privacy/display prefs read by the profile tabs; an
    # opaque bag the API layer merges shallowly rather than validating
    # field-by-field here.
    preferences = Column(JSONB, nullable=False, server_default=text("'{}'::jsonb"))

    # uselist=False: a user has at most one broker profile, lazily
    # loaded — never joined implicitly on every user query.
    broker_profile = relationship("BrokerProfile", back_populates="user", uselist=False)

    __table_args__ = (
        # A plain unique(email) already permits multiple NULLs in
        # Postgres; the partial index makes the "optional, unique when
        # present" intent explicit.
        Index("ix_users_email_unique", "email", unique=True, postgresql_where=text("email IS NOT NULL")),
        Index("ix_users_phone_unique", "phone", unique=True, postgresql_where=text("phone IS NOT NULL")),
        Index("ix_users_role", "role"),
    )
