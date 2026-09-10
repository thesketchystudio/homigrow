"""m11_property_views

Revision ID: 325028026423
Revises: 4afa53dc5ab7
Create Date: 2026-09-10 15:03:23.037245

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = '325028026423'
# Chains onto M9 (4afa53dc5ab7), the actual current head in dev's git
# history — not M10 (ownership_and_available_from), which was applied to
# the live dev DB but never committed (separate, still-in-progress Edit
# Listing work). Whichever of M10/M11 merges second will need a merge
# revision to reconcile the two heads; property_views doesn't touch or
# depend on M10's columns, so there's no ordering requirement between them.
down_revision: Union[str, None] = '4afa53dc5ab7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Append-only log of property-detail page views, backing the broker
    # Analytics page (Total Views KPI, the trend chart, and view-based
    # conversion rate on Top Performing Listings). viewer_id is nullable —
    # the Property Details page is public, so most views are anonymous.
    op.create_table(
        'property_views',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), primary_key=True),
        sa.Column('property_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('properties.id', ondelete='CASCADE'), nullable=False),
        sa.Column('viewer_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('viewed_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
    )
    # Backs the analytics range queries (property_id + a viewed_at range scan).
    op.create_index('ix_property_views_property_viewed_at', 'property_views', ['property_id', 'viewed_at'])
    # One row per (property, logged-in viewer): a repeat visit from the same
    # account is a no-op via ON CONFLICT DO NOTHING against this index.
    # Anonymous views (viewer_id IS NULL) are outside the partial index, so
    # every anonymous view is logged — there's no stable identity to dedupe.
    op.create_index(
        'ix_property_views_property_viewer_unique',
        'property_views',
        ['property_id', 'viewer_id'],
        unique=True,
        postgresql_where=sa.text('viewer_id IS NOT NULL'),
    )


def downgrade() -> None:
    op.drop_index('ix_property_views_property_viewer_unique', table_name='property_views')
    op.drop_index('ix_property_views_property_viewed_at', table_name='property_views')
    op.drop_table('property_views')
