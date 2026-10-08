"""
app/schemas/brokers.py

Pydantic response shapes for broker-only endpoints.
"""

from pydantic import BaseModel, ConfigDict

from app.models.enums import VerificationStatus


class BrokerVerificationOut(BaseModel):
    """Returned after a broker submits (or resubmits) verification documents."""

    model_config = ConfigDict(from_attributes=True)

    verification_status: VerificationStatus
