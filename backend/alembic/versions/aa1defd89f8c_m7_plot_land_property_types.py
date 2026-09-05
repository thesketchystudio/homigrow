"""m7_plot_land_property_types

Revision ID: aa1defd89f8c
Revises: f510b897a266
Create Date: 2026-08-30 15:42:44.967749

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'aa1defd89f8c'
down_revision: Union[str, None] = 'f510b897a266'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Adds Plot and Land as postable property types (Post Property wizard,
    # Figma "Broker view > post property" section). Their type-specific
    # sub-fields follow the same JSONB-bucket pattern as pg_details rather
    # than dedicated typed columns, since they're only ever read/written
    # as a whole blob for their one property_type, never filtered on.
    op.execute("ALTER TYPE property_type ADD VALUE 'land'")
    op.add_column('properties', sa.Column('plot_details', postgresql.JSONB(astext_type=sa.Text()), nullable=True))
    op.add_column('properties', sa.Column('land_details', postgresql.JSONB(astext_type=sa.Text()), nullable=True))


def downgrade() -> None:
    op.drop_column('properties', 'land_details')
    op.drop_column('properties', 'plot_details')
    # Postgres has no DROP VALUE for an enum type — rebuild it without 'land'.
    op.execute("ALTER TYPE property_type RENAME TO property_type_old")
    op.execute(
        "CREATE TYPE property_type AS ENUM "
        "('apartment', 'villa', 'independent_house', 'plot', 'office', 'shop', 'pg_colive')"
    )
    op.execute(
        "ALTER TABLE properties ALTER COLUMN property_type TYPE property_type "
        "USING property_type::text::property_type"
    )
    op.execute("DROP TYPE property_type_old")
