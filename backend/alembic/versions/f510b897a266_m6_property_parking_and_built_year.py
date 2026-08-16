"""m6_property_parking_and_built_year

Revision ID: f510b897a266
Revises: 5081b0dee6c7
Create Date: 2026-07-29 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f510b897a266'
down_revision: Union[str, None] = '5081b0dee6c7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Closes two gaps found while building the Property Details screen against
    # the Figma design's Quick Stats row: no column existed for parking count,
    # and age_years stores a relative offset that silently goes stale every
    # year rather than the fixed "Year Built" fact the design actually shows.
    # age_years was unreferenced outside M1 and this model, so replacing it
    # outright (rather than keeping both) is safe.
    op.add_column('properties', sa.Column('parking_slots', sa.SmallInteger(), nullable=True))
    op.add_column('properties', sa.Column('built_year', sa.SmallInteger(), nullable=True))
    op.drop_column('properties', 'age_years')


def downgrade() -> None:
    op.add_column('properties', sa.Column('age_years', sa.SmallInteger(), nullable=True))
    op.drop_column('properties', 'built_year')
    op.drop_column('properties', 'parking_slots')
