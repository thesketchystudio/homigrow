"""add email_change to otp_purpose

Revision ID: c4f8a1d3e7b2
Revises: b7e4c2a9d6f1
Create Date: 2026-11-07 14:00:00.000000

Changing an account's email now requires a one-time code sent to the new
address, issued under its own purpose so it can never be confused with a
signup or broker-verification code.
"""
from typing import Sequence, Union

from alembic import op


revision: str = 'c4f8a1d3e7b2'
down_revision: Union[str, None] = 'b7e4c2a9d6f1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ALTER TYPE ... ADD VALUE cannot run inside a transaction block.
    with op.get_context().autocommit_block():
        op.execute("ALTER TYPE otp_purpose ADD VALUE IF NOT EXISTS 'email_change'")


def downgrade() -> None:
    # PostgreSQL cannot drop a single enum value. Rows using it are removed
    # and the unused label is left in the type, which is harmless: the
    # application simply never issues it once this revision is reverted.
    op.execute("DELETE FROM otp_codes WHERE purpose = 'email_change'")
