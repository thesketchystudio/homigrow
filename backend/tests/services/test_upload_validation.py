"""
tests/services/test_upload_validation.py

Covers the bounded upload reader and the file-signature check, including
the case that motivated them: HTML or SVG content declared as an image.
"""

import io

import pytest

from app.core.exceptions import AppError
from app.services import storage_service
from app.services.upload_validation import read_limited, verify_signature
from tests.conftest import SAMPLE_JPEG, SAMPLE_MP4, SAMPLE_PDF, SAMPLE_PNG, SAMPLE_WEBP


class TestReadLimited:
    def test_returns_full_content_within_limit(self):
        assert read_limited(io.BytesIO(b"a" * 1000), 1000) == b"a" * 1000

    def test_rejects_content_over_limit(self):
        with pytest.raises(AppError) as exc_info:
            read_limited(io.BytesIO(b"a" * 1001), 1000)
        assert exc_info.value.status_code == 422
        assert exc_info.value.code == "FILE_TOO_LARGE"

    def test_stops_reading_soon_after_limit(self):
        class CountingFile(io.BytesIO):
            total_read = 0

            def read(self, size=-1):
                data = super().read(size)
                CountingFile.total_read += len(data)
                return data

        with pytest.raises(AppError):
            read_limited(CountingFile(b"a" * (5 * 1024 * 1024)), 100 * 1024)
        assert CountingFile.total_read < 300 * 1024


class TestVerifySignature:
    @pytest.mark.parametrize(
        "content,content_type",
        [
            (SAMPLE_JPEG, "image/jpeg"),
            (SAMPLE_PNG, "image/png"),
            (SAMPLE_WEBP, "image/webp"),
            (SAMPLE_PDF, "application/pdf"),
            (SAMPLE_MP4, "video/mp4"),
            (SAMPLE_MP4, "video/quicktime"),
            (b"PK\x03\x04rest", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"),
            (b"\xd0\xcf\x11\xe0\xa1\xb1\x1a\xe1rest", "application/msword"),
        ],
    )
    def test_accepts_matching_signature(self, content, content_type):
        verify_signature(content, content_type)

    @pytest.mark.parametrize(
        "content,content_type",
        [
            (b"<html><script>alert(1)</script></html>", "image/jpeg"),
            (b'<svg xmlns="http://www.w3.org/2000/svg"></svg>', "image/png"),
            (SAMPLE_PNG, "image/jpeg"),
            (SAMPLE_JPEG, "application/pdf"),
            (b"", "image/jpeg"),
            (b"anything", "image/gif"),
        ],
    )
    def test_rejects_mismatched_or_unknown_signature(self, content, content_type):
        with pytest.raises(AppError) as exc_info:
            verify_signature(content, content_type)
        assert exc_info.value.status_code == 422
        assert exc_info.value.code == "FILE_CONTENT_MISMATCH"


class TestStorageRejectsDisguisedFiles:
    def test_html_declared_as_jpeg_is_rejected_before_upload(self):
        import uuid

        with pytest.raises(AppError) as exc_info:
            storage_service.upload_property_image(uuid.uuid4(), b"<html>x</html>", "image/jpeg")
        assert exc_info.value.code == "FILE_CONTENT_MISMATCH"
