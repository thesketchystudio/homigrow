"""
app/services/storage_service.py

Uploads broker verification documents to a private bucket via the S3
protocol (boto3), currently pointed at Supabase Storage's S3-compatible
endpoint rather than Cloudflare R2 — R2 is the originally planned
provider (00_Project_Overview.md) but requires a card on file to
activate even its free tier, which wasn't available when this was
built. Talking to storage purely through the S3 protocol means
swapping to R2 later is a config change (endpoint/region/keys), not a
rewrite. The bucket is private: this module returns internal object
keys, not fetchable URLs — generating a presigned GET is a P4 concern
(admin document review), not needed while nothing reads these back yet.
"""

from uuid import UUID, uuid4

import boto3
from botocore.config import Config

from app.core.config import settings
from app.core.exceptions import ValidationFailed
from app.models.enums import BrokerDocumentType

ALLOWED_CONTENT_TYPES = {"application/pdf", "image/jpeg", "image/png"}
MAX_DOCUMENT_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB, matches the Figma upload copy

_EXTENSION_BY_CONTENT_TYPE = {
    "application/pdf": ".pdf",
    "image/jpeg": ".jpg",
    "image/png": ".png",
}

_client = None


def _get_client():
    """Lazily builds and caches the boto3 S3 client — avoids constructing it at import time for code paths that never upload."""
    global _client
    if _client is None:
        _client = boto3.client(
            "s3",
            endpoint_url=settings.SUPABASE_S3_ENDPOINT,
            region_name=settings.SUPABASE_S3_REGION,
            aws_access_key_id=settings.SUPABASE_ACCESS_KEY_ID,
            aws_secret_access_key=settings.SUPABASE_SECRET_ACCESS_KEY,
            # Supabase Storage's S3-compatible endpoint only supports
            # path-style addressing (endpoint/bucket/key), not boto3's
            # AWS-default virtual-hosted-style (bucket.endpoint/key) —
            # without this, every request 500s inside botocore before
            # it even reaches Supabase.
            config=Config(s3={"addressing_style": "path"}),
        )
    return _client


def upload_broker_document(
    user_id: UUID,
    doc_type: BrokerDocumentType,
    content: bytes,
    content_type: str,
) -> str:
    """
    Validates and uploads one broker verification document, returning
    its object key (not a public URL — the bucket is private). Raises
    422 on an unsupported content type or a file over 5MB.
    """
    if content_type not in ALLOWED_CONTENT_TYPES:
        raise ValidationFailed(
            "UNSUPPORTED_FILE_TYPE",
            "Only PDF, JPG, or PNG files are accepted.",
            {"file": "Only PDF, JPG, or PNG files are accepted."},
        )
    if len(content) > MAX_DOCUMENT_SIZE_BYTES:
        raise ValidationFailed(
            "FILE_TOO_LARGE",
            "File must be 5 MB or smaller.",
            {"file": "File must be 5 MB or smaller."},
        )

    extension = _EXTENSION_BY_CONTENT_TYPE[content_type]
    object_key = f"{user_id}/{doc_type.value}/{uuid4().hex}{extension}"

    _get_client().put_object(
        Bucket=settings.SUPABASE_S3_BUCKET,
        Key=object_key,
        Body=content,
        ContentType=content_type,
    )
    return object_key
