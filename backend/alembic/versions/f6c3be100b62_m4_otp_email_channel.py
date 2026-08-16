"""m4_otp_email_channel

Revision ID: f6c3be100b62
Revises: 09f4c463f754
Create Date: 2026-07-14 00:32:05.645406

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f6c3be100b62'
down_revision: Union[str, None] = '09f4c463f754'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Signup verification now sends its 6-digit code by email (Resend),
    # not phone/SMS — the Figma design's "Verify your identity" screen
    # confirmed this, and MSG91/SMS integration is shelved for now
    # (09_Phase_2.md amendment, 2026-07-14). otp_codes rows are
    # documented as genuinely transient (02_Database_Design.md), so old
    # phone-keyed rows are discarded rather than migrated.
    op.execute("TRUNCATE TABLE otp_codes")
    op.drop_index('ix_otp_codes_phone_purpose_expires', table_name='otp_codes')
    op.drop_column('otp_codes', 'phone')
    op.add_column('otp_codes', sa.Column('email', sa.String(length=255), nullable=False))
    op.create_index('ix_otp_codes_email_purpose_expires', 'otp_codes', ['email', 'purpose', 'expires_at'], unique=False)


def downgrade() -> None:
    op.execute("TRUNCATE TABLE otp_codes")
    op.drop_index('ix_otp_codes_email_purpose_expires', table_name='otp_codes')
    op.drop_column('otp_codes', 'email')
    op.add_column('otp_codes', sa.Column('phone', sa.String(length=15), nullable=False))
    op.create_index('ix_otp_codes_phone_purpose_expires', 'otp_codes', ['phone', 'purpose', 'expires_at'], unique=False)
