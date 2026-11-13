"""m14_admin_audit_and_suspension

Revision ID: e8b2c6d4a1f3
Revises: d9a3e5b1c7f2
Create Date: 2026-11-12 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'e8b2c6d4a1f3'
down_revision: Union[str, None] = 'd9a3e5b1c7f2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Append-only trail of admin mutations, written in the same transaction as the change.
    op.create_table(
        'admin_audit_log',
        sa.Column('id', sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column('admin_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('action', sa.String(length=50), nullable=False),
        sa.Column('target_type', sa.String(length=30), nullable=True),
        sa.Column('target_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('meta', postgresql.JSONB(astext_type=sa.Text()), server_default=sa.text("'{}'::jsonb"), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['admin_id'], ['users.id'], ondelete='RESTRICT'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_admin_audit_log_admin_created', 'admin_audit_log', ['admin_id', sa.text('created_at DESC')])
    op.create_index('ix_admin_audit_log_target', 'admin_audit_log', ['target_type', 'target_id'])

    # Admin suspension, distinct from a user's own deactivation.
    op.add_column('users', sa.Column('suspended_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('users', sa.Column('suspension_reason', sa.Text(), nullable=True))

    # Note from the latest moderation decision, shown to the broker.
    op.add_column('properties', sa.Column('moderation_note', sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column('properties', 'moderation_note')
    op.drop_column('users', 'suspension_reason')
    op.drop_column('users', 'suspended_at')
    op.drop_index('ix_admin_audit_log_target', table_name='admin_audit_log')
    op.drop_index('ix_admin_audit_log_admin_created', table_name='admin_audit_log')
    op.drop_table('admin_audit_log')
