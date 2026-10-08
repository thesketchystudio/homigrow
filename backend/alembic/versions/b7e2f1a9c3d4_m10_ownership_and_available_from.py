"""m10_ownership_and_available_from

Revision ID: b7e2f1a9c3d4
Revises: 325028026423
Create Date: 2026-09-09 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'b7e2f1a9c3d4'
# Originally chained onto M9 (4afa53dc5ab7) when written, before M11
# (property_views, 325028026423) merged into dev off the same M9 head.
# Rebased onto M11 here so dev keeps a single linear head instead of two
# independent branches off M9 — this migration doesn't touch anything
# M11 added, so there's no ordering dependency beyond avoiding the split.
down_revision: Union[str, None] = '325028026423'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # The Edit Listing screen (Figma node 177:4065) shows an "Ownership" and
    # an "Available From" field neither the Property model nor the Post
    # Property wizard ever collected — both are added here as nullable so
    # the Edit form can set them without requiring a value on existing rows.
    op.execute("CREATE TYPE ownership_type AS ENUM ('freehold', 'leasehold', 'co_operative_society', 'power_of_attorney')")
    op.add_column(
        'properties',
        sa.Column(
            'ownership_type',
            postgresql.ENUM('freehold', 'leasehold', 'co_operative_society', 'power_of_attorney', name='ownership_type', create_type=False),
            nullable=True,
        ),
    )
    op.add_column('properties', sa.Column('available_from', sa.Date(), nullable=True))


def downgrade() -> None:
    op.drop_column('properties', 'available_from')
    op.drop_column('properties', 'ownership_type')
    op.execute("DROP TYPE ownership_type")
