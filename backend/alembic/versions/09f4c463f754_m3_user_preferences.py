"""m3_user_preferences

Revision ID: 09f4c463f754
Revises: 54dcab979ba6
Create Date: 2026-07-10 18:51:30.360023

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = '09f4c463f754'
down_revision: Union[str, None] = '54dcab979ba6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Backs PATCH /users/me's `preferences` field (notification/privacy/
    # display prefs read by the profile tabs, 02_Database_Design.md).
    op.add_column(
        'users',
        sa.Column('preferences', postgresql.JSONB(astext_type=sa.Text()), server_default=sa.text("'{}'::jsonb"), nullable=False),
    )


def downgrade() -> None:
    op.drop_column('users', 'preferences')
