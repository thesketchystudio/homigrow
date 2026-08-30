"""
app/api/v1/routes/brokers.py

Broker-only endpoints. Currently just verification document
submission; broker profile edit (bio, specializations, etc.) is P4-T10.
"""

from fastapi import APIRouter, Depends, File, UploadFile
from sqlalchemy.orm import Session

from app.api.v1.deps import RequireBroker
from app.db.session import get_db
from app.schemas.brokers import BrokerVerificationOut
from app.services import broker_service

router = APIRouter(prefix="/brokers", tags=["brokers"])


@router.post("/me/verification-documents", response_model=BrokerVerificationOut)
def submit_verification_documents(
    user: RequireBroker,
    rera_certificate: UploadFile = File(...),
    government_id: UploadFile = File(...),
    db: Session = Depends(get_db),
) -> BrokerVerificationOut:
    """
    Submits (or resubmits) the two required verification documents and
    moves verification_status to pending. No content verification —
    that's manual admin review, not built yet (P4-T12).
    """
    profile = broker_service.submit_verification_documents(
        db,
        user,
        rera_certificate=rera_certificate.file.read(),
        rera_certificate_content_type=rera_certificate.content_type,
        government_id=government_id.file.read(),
        government_id_content_type=government_id.content_type,
    )
    return BrokerVerificationOut.model_validate(profile)
