"""m12_boost_orders_and_daily_pricing

Revision ID: cde17bb27e5c
Revises: b7e2f1a9c3d4
Create Date: 2026-09-10 20:03:44.784674

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'cde17bb27e5c'
down_revision: Union[str, None] = 'b7e2f1a9c3d4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('boost_orders',
    sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
    sa.Column('broker_id', postgresql.UUID(as_uuid=True), nullable=False),
    sa.Column('property_id', postgresql.UUID(as_uuid=True), nullable=False),
    sa.Column('plan_id', postgresql.UUID(as_uuid=True), nullable=False),
    sa.Column('duration_days', sa.SmallInteger(), nullable=False),
    sa.Column('base_amount', sa.Numeric(precision=10, scale=2), nullable=False),
    sa.Column('discount_amount', sa.Numeric(precision=10, scale=2), server_default=sa.text('0'), nullable=False),
    sa.Column('gst_amount', sa.Numeric(precision=10, scale=2), nullable=False),
    sa.Column('total_amount', sa.Numeric(precision=10, scale=2), nullable=False),
    sa.Column('status', postgresql.ENUM('created', 'paid', 'failed', 'refunded', name='order_status', create_type=False), server_default='created', nullable=False),
    sa.Column('starts_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('ends_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
    sa.ForeignKeyConstraint(['broker_id'], ['users.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['plan_id'], ['boost_plans.id'], ),
    sa.ForeignKeyConstraint(['property_id'], ['properties.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_boost_orders_broker_created', 'boost_orders', ['broker_id', 'created_at'], unique=False)
    op.create_index('ix_boost_orders_property_status', 'boost_orders', ['property_id', 'status'], unique=False)

    op.add_column('boost_plans', sa.Column('reach_estimate', postgresql.JSONB(astext_type=sa.Text()), server_default=sa.text("'{}'::jsonb"), nullable=False))
    # Duration is now chosen per-order (boost_orders.duration_days), not
    # fixed per plan — see app/models/boost.py's price column comment.
    # boost_plans has no seed data yet (P6-T02 was never reached), so this
    # drop is not a real data loss.
    op.drop_column('boost_plans', 'duration_days')


def downgrade() -> None:
    op.add_column('boost_plans', sa.Column('duration_days', sa.SMALLINT(), autoincrement=False, nullable=False))
    op.drop_column('boost_plans', 'reach_estimate')

    op.drop_index('ix_boost_orders_property_status', table_name='boost_orders')
    op.drop_index('ix_boost_orders_broker_created', table_name='boost_orders')
    op.drop_table('boost_orders')
