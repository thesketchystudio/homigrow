"""m8_jv_pg_pricing_and_commercial_types

Revision ID: c1a9e7d2f4b6
Revises: aa1defd89f8c
Create Date: 2026-09-02 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'c1a9e7d2f4b6'
down_revision: Union[str, None] = 'aa1defd89f8c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Adds the updated Post Property wizard's JV toggle, real PG/co-living
    # sub-forms, richer Pricing step fields, and two Rent-only commercial
    # property types (Figma "Broker view > post property", Section 1).
    op.execute("CREATE TYPE price_flexibility AS ENUM ('fixed', 'negotiable', 'highly_flexible')")
    op.execute("CREATE TYPE payment_structure AS ENUM ('full_payment', 'emi_installments', 'construction_linked')")
    op.execute("ALTER TYPE property_type ADD VALUE 'commercial_building'")
    op.execute("ALTER TYPE property_type ADD VALUE 'built_to_suit'")

    op.add_column('properties', sa.Column('price_per_sqft', sa.Numeric(precision=12, scale=2), nullable=True))
    op.add_column('properties', sa.Column('token_amount', sa.Numeric(precision=12, scale=2), nullable=True))
    op.add_column(
        'properties',
        sa.Column(
            'price_flexibility',
            postgresql.ENUM('fixed', 'negotiable', 'highly_flexible', name='price_flexibility', create_type=False),
            nullable=True,
        ),
    )
    op.add_column(
        'properties',
        sa.Column(
            'payment_structure',
            postgresql.ENUM('full_payment', 'emi_installments', 'construction_linked', name='payment_structure', create_type=False),
            nullable=True,
        ),
    )
    op.add_column('properties', sa.Column('stamp_duty_percent', sa.Numeric(precision=5, scale=2), nullable=True))
    op.add_column('properties', sa.Column('registration_fee_percent', sa.Numeric(precision=5, scale=2), nullable=True))
    op.add_column('properties', sa.Column('brokerage_included', sa.Boolean(), server_default=sa.text('true'), nullable=False))
    op.add_column('properties', sa.Column('brokerage_percent', sa.Numeric(precision=5, scale=2), nullable=True))

    op.add_column('properties', sa.Column('is_jv_property', sa.Boolean(), server_default=sa.text('false'), nullable=False))
    op.add_column('properties', sa.Column('jv_details', postgresql.JSONB(astext_type=sa.Text()), nullable=True))

    op.add_column('properties', sa.Column('virtual_tour_url', sa.String(length=500), nullable=True))


def downgrade() -> None:
    op.drop_column('properties', 'virtual_tour_url')
    op.drop_column('properties', 'jv_details')
    op.drop_column('properties', 'is_jv_property')
    op.drop_column('properties', 'brokerage_percent')
    op.drop_column('properties', 'brokerage_included')
    op.drop_column('properties', 'registration_fee_percent')
    op.drop_column('properties', 'stamp_duty_percent')
    op.drop_column('properties', 'payment_structure')
    op.drop_column('properties', 'price_flexibility')
    op.drop_column('properties', 'token_amount')
    op.drop_column('properties', 'price_per_sqft')

    op.execute("DROP TYPE payment_structure")
    op.execute("DROP TYPE price_flexibility")

    # Postgres has no DROP VALUE for an enum type — rebuild it without the
    # two new commercial types, same pattern as M7's downgrade.
    op.execute("ALTER TYPE property_type RENAME TO property_type_old")
    op.execute(
        "CREATE TYPE property_type AS ENUM "
        "('apartment', 'villa', 'independent_house', 'plot', 'land', 'office', 'shop', 'pg_colive')"
    )
    op.execute(
        "ALTER TABLE properties ALTER COLUMN property_type TYPE property_type "
        "USING property_type::text::property_type"
    )
    op.execute("DROP TYPE property_type_old")
