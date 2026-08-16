"""
app/models/_helpers.py

Shared helpers for SQLAlchemy model column definitions, imported by every
model file that declares a native Postgres enum column.
"""

from sqlalchemy.dialects.postgresql import ENUM as PGEnum


def _pg_enum(enum_cls, name: str):
    """
    Builds a native Postgres enum column type with create_type=False,
    since the enum type is created explicitly in the Alembic migration
    rather than auto-managed per table. Uses postgresql.ENUM rather than
    the generic sa.Enum type, which does not propagate create_type when
    adapted to the Postgres dialect.
    """
    return PGEnum(
        enum_cls,
        name=name,
        create_type=False,
        values_callable=lambda ec: [member.value for member in ec],
    )
