"""
app/services/broker_service.py

Broker verification document submission. No admin review or content
verification exists yet (P4-T12) — submitting just uploads the files
and flips verification_status to pending; a broker resubmitting after
rejection calls the same function, which replaces the prior documents
outright rather than accumulating old ones.
"""

from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundError
from app.models.broker_profile import BrokerProfile
from app.models.enums import BrokerDocumentType, VerificationStatus
from app.models.user import User
from app.services import storage_service


def submit_verification_documents(
    db: Session,
    user: User,
    rera_certificate: bytes,
    rera_certificate_content_type: str,
    government_id: bytes,
    government_id_content_type: str,
) -> BrokerProfile:
    """
    Uploads both required documents and moves verification_status to
    pending. Raises 404 if the broker somehow has no broker_profile row
    (shouldn't happen — signup() always creates one for role=broker).
    """
    profile = db.query(BrokerProfile).filter(BrokerProfile.user_id == user.id).first()
    if profile is None:
        raise NotFoundError("BROKER_PROFILE_NOT_FOUND", "Broker profile not found.")

    rera_key = storage_service.upload_broker_document(
        user.id, BrokerDocumentType.rera_certificate, rera_certificate, rera_certificate_content_type
    )
    government_id_key = storage_service.upload_broker_document(
        user.id, BrokerDocumentType.government_id, government_id, government_id_content_type
    )

    now = datetime.now(timezone.utc).isoformat()
    profile.verification_documents = [
        {"type": BrokerDocumentType.rera_certificate.value, "url": rera_key, "uploaded_at": now},
        {"type": BrokerDocumentType.government_id.value, "url": government_id_key, "uploaded_at": now},
    ]
    profile.verification_status = VerificationStatus.pending

    db.commit()
    db.refresh(profile)
    return profile
