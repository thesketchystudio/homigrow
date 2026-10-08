"""
tests/services/test_broker_service.py

Covers submit_verification_documents: uploads both files, moves
verification_status to pending, and replaces (not appends) documents
on resubmission.
"""

import pytest

from app.core.exceptions import AppError
from app.models.broker_profile import BrokerProfile
from app.models.enums import UserRole, VerificationStatus
from app.services import broker_service
from tests.conftest import make_user

_RERA_BYTES = b"%PDF-1.4 fake rera cert"
_GOV_ID_BYTES = b"fake gov id bytes"


def _make_broker(db_session, **kwargs) -> "tuple":
    user = make_user(db_session, role=UserRole.broker, **kwargs)
    profile = BrokerProfile(user_id=user.id)
    db_session.add(profile)
    db_session.flush()
    return user, profile


class TestSubmitVerificationDocuments:
    def test_uploads_documents_and_moves_status_to_pending(self, db_session):
        user, profile = _make_broker(db_session, phone="+919876544001")

        result = broker_service.submit_verification_documents(
            db_session,
            user,
            rera_certificate=_RERA_BYTES,
            rera_certificate_content_type="application/pdf",
            government_id=_GOV_ID_BYTES,
            government_id_content_type="image/jpeg",
        )

        assert result.verification_status == VerificationStatus.pending
        assert len(result.verification_documents) == 2
        types = {doc["type"] for doc in result.verification_documents}
        assert types == {"rera_certificate", "government_id"}

    def test_resubmission_replaces_rather_than_appends(self, db_session):
        user, profile = _make_broker(db_session, phone="+919876544002")

        broker_service.submit_verification_documents(
            db_session,
            user,
            rera_certificate=_RERA_BYTES,
            rera_certificate_content_type="application/pdf",
            government_id=_GOV_ID_BYTES,
            government_id_content_type="image/jpeg",
        )
        result = broker_service.submit_verification_documents(
            db_session,
            user,
            rera_certificate=_RERA_BYTES,
            rera_certificate_content_type="application/pdf",
            government_id=_GOV_ID_BYTES,
            government_id_content_type="image/png",
        )

        assert len(result.verification_documents) == 2

    def test_raises_404_when_broker_profile_missing(self, db_session):
        user = make_user(db_session, role=UserRole.broker, phone="+919876544003")
        # No BrokerProfile row created, unlike _make_broker.

        with pytest.raises(AppError) as exc_info:
            broker_service.submit_verification_documents(
                db_session,
                user,
                rera_certificate=_RERA_BYTES,
                rera_certificate_content_type="application/pdf",
                government_id=_GOV_ID_BYTES,
                government_id_content_type="image/jpeg",
            )
        assert exc_info.value.status_code == 404
        assert exc_info.value.code == "BROKER_PROFILE_NOT_FOUND"
