"""
app/db/base.py

Declares the canonical SQLAlchemy declarative base and the shared
timestamp mixin used by mutable model tables. All models import Base
from this module rather than from db.session, so Alembic's env.py can
target one metadata object for autogeneration.
"""

from sqlalchemy import Column, DateTime, func
from sqlalchemy.orm import declarative_base

Base = declarative_base()


class TimestampMixin:
    """
    Adds created_at and updated_at columns to a model.

    Append-only tables (audit logs, event streams, notes) should not use
    this mixin; declare created_at directly instead, since updated_at
    would imply a mutation that never occurs on those tables.
    """

    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=True, onupdate=func.now())


# Importing every model module here (after Base/TimestampMixin are defined)
# ensures anything that imports app.db.base sees the full table metadata,
# which alembic/env.py relies on for autogeneration.
from app.models import user  # noqa: E402,F401
from app.models import broker_profile  # noqa: E402,F401
from app.models import property as _property  # noqa: E402,F401
from app.models import lead  # noqa: E402,F401
from app.models import conversation  # noqa: E402,F401
from app.models import notification  # noqa: E402,F401
from app.models import saved_property  # noqa: E402,F401
from app.models import boost  # noqa: E402,F401
