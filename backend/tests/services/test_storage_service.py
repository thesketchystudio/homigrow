"""
tests/services/test_storage_service.py

Covers upload_broker_document's own validation logic (content type,
size). The boto3 client itself is stubbed by the autouse _mock_s3_client
fixture in conftest.py, so these tests exercise real validation without
making a network call.
"""

import uuid

import pytest

from app.core.exceptions import AppError
from app.models.enums import BrokerDocumentType
from app.services import storage_service
from tests.conftest import SAMPLE_JPEG, SAMPLE_PDF, SAMPLE_PNG


class TestUploadBrokerDocument:
    def test_accepts_a_valid_pdf(self):
        key = storage_service.upload_broker_document(
            uuid.uuid4(), BrokerDocumentType.rera_certificate, b"%PDF-1.4 fake content", "application/pdf"
        )
        assert key.endswith(".pdf")
        assert BrokerDocumentType.rera_certificate.value in key

    def test_accepts_jpg_and_png(self):
        user_id = uuid.uuid4()
        jpg_key = storage_service.upload_broker_document(
            user_id, BrokerDocumentType.government_id, SAMPLE_JPEG, "image/jpeg"
        )
        png_key = storage_service.upload_broker_document(
            user_id, BrokerDocumentType.government_id, SAMPLE_PNG, "image/png"
        )
        assert jpg_key.endswith(".jpg")
        assert png_key.endswith(".png")

    def test_rejects_unsupported_content_type(self):
        with pytest.raises(AppError) as exc_info:
            storage_service.upload_broker_document(
                uuid.uuid4(), BrokerDocumentType.rera_certificate, b"fake", "application/zip"
            )
        assert exc_info.value.status_code == 422
        assert exc_info.value.code == "UNSUPPORTED_FILE_TYPE"

    def test_rejects_a_file_over_5mb(self):
        oversized = b"0" * (storage_service.MAX_DOCUMENT_SIZE_BYTES + 1)
        with pytest.raises(AppError) as exc_info:
            storage_service.upload_broker_document(
                uuid.uuid4(), BrokerDocumentType.government_id, oversized, "image/png"
            )
        assert exc_info.value.status_code == 422
        assert exc_info.value.code == "FILE_TOO_LARGE"

    def test_object_key_is_scoped_by_user_and_doc_type(self):
        user_id = uuid.uuid4()
        key = storage_service.upload_broker_document(
            user_id, BrokerDocumentType.rera_certificate, SAMPLE_PDF, "application/pdf"
        )
        assert key.startswith(f"{user_id}/{BrokerDocumentType.rera_certificate.value}/")


class TestStorageFailures:
    def _failing_client(self, monkeypatch):
        from botocore.exceptions import ClientError

        class _Failing:
            def put_object(self, **kwargs):
                raise ClientError({"Error": {"Code": "SignatureDoesNotMatch", "Message": "internal detail"}}, "PutObject")

        monkeypatch.setattr("app.services.storage_service._get_client", lambda: _Failing())

    def test_a_storage_failure_becomes_a_retryable_503_with_a_plain_message(self, monkeypatch):
        self._failing_client(monkeypatch)

        with pytest.raises(AppError) as exc_info:
            storage_service.upload_property_image(uuid.uuid4(), SAMPLE_JPEG, "image/jpeg")

        assert exc_info.value.status_code == 503
        assert exc_info.value.code == "STORAGE_UNAVAILABLE"
        assert "internal detail" not in exc_info.value.message
        assert "SignatureDoesNotMatch" not in exc_info.value.message

    def test_every_upload_path_reports_the_same_failure(self, monkeypatch):
        self._failing_client(monkeypatch)
        user_id = uuid.uuid4()

        for upload in (
            lambda: storage_service.upload_broker_document(user_id, BrokerDocumentType.rera_certificate, SAMPLE_PDF, "application/pdf"),
            lambda: storage_service.upload_property_document(uuid.uuid4(), SAMPLE_PDF, "application/pdf"),
        ):
            with pytest.raises(AppError) as exc_info:
                upload()
            assert exc_info.value.code == "STORAGE_UNAVAILABLE"
