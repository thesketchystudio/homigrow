"""m9_lead_contact_info

Revision ID: 4afa53dc5ab7
Revises: c1a9e7d2f4b6
Create Date: 2026-09-05 17:35:07.874478

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '4afa53dc5ab7'
down_revision: Union[str, None] = 'c1a9e7d2f4b6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # The Property Contact Card lets a not-logged-in visitor submit a tour
    # request or number request — Lead.client_id is nullable, but there was
    # never a column to hold *who* an anonymous enquirer is, since every
    # lead until now came from a logged-in client. Both columns are always
    # populated regardless of login state (the form is never prefilled from
    # an account), matching User.full_name/phone's own length conventions.
    op.add_column('leads', sa.Column('contact_name', sa.String(length=100), nullable=True))
    op.add_column('leads', sa.Column('contact_phone', sa.String(length=15), nullable=True))
    op.create_index('ix_leads_property_contact_phone', 'leads', ['property_id', 'contact_phone'])


def downgrade() -> None:
    op.drop_index('ix_leads_property_contact_phone', table_name='leads')
    op.drop_column('leads', 'contact_phone')
    op.drop_column('leads', 'contact_name')
