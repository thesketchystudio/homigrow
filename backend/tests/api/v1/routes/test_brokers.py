"""
tests/api/v1/routes/test_brokers.py

Integration tests for POST /api/v1/brokers/me/verification-documents
through the TestClient — auth/role gating and the multipart upload
contract.
"""

from app.core.security import create_access_token
from app.models.broker_profile import BrokerProfile
from app.models.enums import UserRole
from tests.conftest import make_user

_FILES = {
    "rera_certificate": ("rera.pdf", b"%PDF-1.4 fake", "application/pdf"),
    "government_id": ("id.jpg", b"fake jpg bytes", "image/jpeg"),
}


def _auth_headers(user) -> dict:
    return {"Authorization": f"Bearer {create_access_token(user.id, user.role.value)}"}


def _make_broker(db_session, **kwargs):
    user = make_user(db_session, role=UserRole.broker, **kwargs)
    db_session.add(BrokerProfile(user_id=user.id))
    db_session.flush()
    return user


class TestSubmitVerificationDocuments:
    def test_broker_can_submit_documents(self, client, db_session):
        broker = _make_broker(db_session, phone="+919876545001")

        response = client.post(
            "/api/v1/brokers/me/verification-documents",
            headers=_auth_headers(broker),
            files=_FILES,
        )

        assert response.status_code == 200
        assert response.json()["verification_status"] == "pending"

    def test_requires_authentication(self, client):
        response = client.post("/api/v1/brokers/me/verification-documents", files=_FILES)
        assert response.status_code == 401

    def test_client_role_is_forbidden(self, client, db_session):
        user = make_user(db_session, role=UserRole.client, phone="+919876545002")

        response = client.post(
            "/api/v1/brokers/me/verification-documents",
            headers=_auth_headers(user),
            files=_FILES,
        )

        assert response.status_code == 403

    def test_unsupported_file_type_returns_422(self, client, db_session):
        broker = _make_broker(db_session, phone="+919876545003")
        bad_files = {
            "rera_certificate": ("rera.zip", b"fake zip", "application/zip"),
            "government_id": ("id.jpg", b"fake jpg bytes", "image/jpeg"),
        }

        response = client.post(
            "/api/v1/brokers/me/verification-documents",
            headers=_auth_headers(broker),
            files=bad_files,
        )

        assert response.status_code == 422
        assert response.json()["error"]["code"] == "UNSUPPORTED_FILE_TYPE"
