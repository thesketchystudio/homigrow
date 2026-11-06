"""normalize user phones to +91 canonical form

Revision ID: b7e4c2a9d6f1
Revises: a3d5f7b9c1e2
Create Date: 2026-11-07 10:00:00.000000

Phones were stored exactly as typed, so the same mobile written as
"9876543210" and "+919876543210" counted as two different numbers and
could register twice. Signup and login now canonicalise every phone to
"+91" followed by the 10 digits; this brings existing rows into that form.
Rows that are not exactly 10 bare digits are left untouched.
"""
from typing import Sequence, Union

from alembic import op


revision: str = 'b7e4c2a9d6f1'
down_revision: Union[str, None] = 'a3d5f7b9c1e2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("UPDATE users SET phone = '+91' || phone WHERE phone ~ '^[0-9]{10}$'")


def downgrade() -> None:
    op.execute("UPDATE users SET phone = substring(phone from 4) WHERE phone ~ '^\+91[0-9]{10}$'")
