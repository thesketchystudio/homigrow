"""m5_users_phone_nullable

Revision ID: 5081b0dee6c7
Revises: f6c3be100b62
Create Date: 2026-07-21 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '5081b0dee6c7'
down_revision: Union[str, None] = 'f6c3be100b62'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Google Sign-In accounts have no phone number to store — phone was
    # the sole primary identifier at signup, but the OTP pivot to email
    # (M4) already made email the real identifier in practice. Drops the
    # plain UniqueConstraint('phone') from M1 and replaces it with a
    # partial unique index, the same "unique when present" pattern
    # email already uses (ix_users_email_unique).
    op.drop_constraint('users_phone_key', 'users', type_='unique')
    op.alter_column('users', 'phone', existing_type=sa.String(length=15), nullable=True)
    op.create_index('ix_users_phone_unique', 'users', ['phone'], unique=True, postgresql_where=sa.text('phone IS NOT NULL'))


def downgrade() -> None:
    op.drop_index('ix_users_phone_unique', table_name='users', postgresql_where=sa.text('phone IS NOT NULL'))
    op.alter_column('users', 'phone', existing_type=sa.String(length=15), nullable=False)
    op.create_unique_constraint('users_phone_key', 'users', ['phone'])
