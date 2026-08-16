"""m2_auth_tables

Revision ID: 54dcab979ba6
Revises: 5f17c78ec8b5
Create Date: 2026-07-08 23:35:00.473830

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '54dcab979ba6'
down_revision: Union[str, None] = '5f17c78ec8b5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # otp_purpose already exists (created in M1, ahead of any table that
    # used it) — create_type=False so this column reuses it instead of
    # trying to CREATE TYPE again.
    op.create_table('otp_codes',
    sa.Column('id', sa.UUID(), server_default=sa.text('gen_random_uuid()'), nullable=False),
    sa.Column('phone', sa.String(length=15), nullable=False),
    sa.Column('code_hash', sa.String(length=255), nullable=False),
    sa.Column('purpose', postgresql.ENUM('login', 'signup', 'broker_verification', name='otp_purpose', create_type=False), nullable=False),
    sa.Column('attempts', sa.SmallInteger(), server_default='0', nullable=False),
    sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('consumed_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_otp_codes_phone_purpose_expires', 'otp_codes', ['phone', 'purpose', 'expires_at'], unique=False)
    op.create_table('refresh_tokens',
    sa.Column('id', sa.UUID(), server_default=sa.text('gen_random_uuid()'), nullable=False),
    sa.Column('user_id', sa.UUID(), nullable=False),
    sa.Column('token_hash', sa.String(length=255), nullable=False),
    sa.Column('user_agent', sa.Text(), nullable=True),
    sa.Column('ip', postgresql.INET(), nullable=True),
    sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('revoked_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('token_hash')
    )
    op.create_index('ix_refresh_tokens_user_expires', 'refresh_tokens', ['user_id', 'expires_at'], unique=False)
    # spatial_ref_sys is a PostGIS system table autogenerate misdetects as
    # a removed table (it's not part of our declarative metadata) — never
    # touch it; drop/recreate deliberately omitted here.


def downgrade() -> None:
    op.drop_index('ix_refresh_tokens_user_expires', table_name='refresh_tokens')
    op.drop_table('refresh_tokens')
    op.drop_index('ix_otp_codes_phone_purpose_expires', table_name='otp_codes')
    op.drop_table('otp_codes')
