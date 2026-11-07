"""record why a refresh token was revoked

Revision ID: d9a3e5b1c7f2
Revises: c4f8a1d3e7b2
Create Date: 2026-11-07 18:30:00.000000

Replaying a token that was swapped for a new one means it was copied, so
every session is revoked. A token revoked because the user logged out or
changed their password is not a copy: its holder is just a device that has
not noticed yet, and must not cost the user the session they just created.
The reason separates the two. Rows revoked before this column existed keep
a NULL reason and are treated as rotated.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'd9a3e5b1c7f2'
down_revision: Union[str, None] = 'c4f8a1d3e7b2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('refresh_tokens', sa.Column('revoked_reason', sa.String(length=20), nullable=True))


def downgrade() -> None:
    op.drop_column('refresh_tokens', 'revoked_reason')
