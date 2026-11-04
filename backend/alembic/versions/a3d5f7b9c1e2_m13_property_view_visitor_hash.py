"""m13_property_view_visitor_hash

Revision ID: a3d5f7b9c1e2
Revises: cde17bb27e5c
Create Date: 2026-11-04 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a3d5f7b9c1e2'
down_revision: Union[str, None] = 'cde17bb27e5c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Keyed hash identifying an anonymous visitor, so repeat anonymous views
    # of a property can be deduped within a time window. NULL for logged-in
    # viewers and for rows logged before this column existed.
    op.add_column('property_views', sa.Column('visitor_hash', sa.String(length=64), nullable=True))
    op.create_index(
        'ix_property_views_property_visitor_viewed_at',
        'property_views',
        ['property_id', 'visitor_hash', 'viewed_at'],
    )


def downgrade() -> None:
    op.drop_index('ix_property_views_property_visitor_viewed_at', table_name='property_views')
    op.drop_column('property_views', 'visitor_hash')
