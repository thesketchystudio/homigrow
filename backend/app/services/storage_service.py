"""
app/services/storage_service.py

Uploads broker verification documents and property listing photos via
the S3 protocol (boto3), currently pointed at Supabase Storage's
S3-compatible endpoint rather than Cloudflare R2 — R2 is the originally
planned provider (00_Project_Overview.md) but requires a card on file
to activate even its free tier, which wasn't available when this was
built. Talking to storage purely through the S3 protocol means
swapping to R2 later is a config change (endpoint/region/keys), not a
rewrite.

Two buckets, two access models: broker verification documents go to a
private bucket and this module returns internal object keys, not
fetchable URLs (generating a presigned GET is a P4 concern — admin
document review — not needed while nothing reads these back yet).
Property photos go to a separate public bucket, since listings must be
publicly viewable on the client site with no auth, so that path returns
a real public URL instead.
"""

from uuid import UUID, uuid4

import boto3
from botocore.config import Config

from app.core.config import settings
from app.core.exceptions import ValidationFailed
from app.models.enums import BrokerDocumentType

ALLOWED_CONTENT_TYPES = {"application/pdf", "image/jpeg", "image/png"}
MAX_DOCUMENT_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB, matches the Figma upload copy

ALLOWED_IMAGE_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB, higher than docs since these are hero/interior photos

ALLOWED_VIDEO_CONTENT_TYPES = {"video/mp4", "video/quicktime"}
# Figma's Property Video / Drone Footage upload copy says "Max 500MB", but
# that ceiling also depends on the Supabase project's own global upload-size
# limit (configured in its dashboard, separate from this app). 100MB here is
# a conservative starting cap for the Supabase-Storage-only path — raise
# both together once Cloudflare Stream (or a higher Supabase limit) is wired up.
MAX_VIDEO_SIZE_BYTES = 100 * 1024 * 1024

ALLOWED_DOCUMENT_CONTENT_TYPES = {
    "application/pdf",
    "image/jpeg",
    "image/png",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}
MAX_PROPERTY_DOCUMENT_SIZE_BYTES = 10 * 1024 * 1024  # matches the JV Agreement upload copy ("Max 10MB")

_EXTENSION_BY_CONTENT_TYPE = {
    "application/pdf": ".pdf",
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "application/msword": ".doc",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
}

_IMAGE_EXTENSION_BY_CONTENT_TYPE = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}

_VIDEO_EXTENSION_BY_CONTENT_TYPE = {
    "video/mp4": ".mp4",
    "video/quicktime": ".mov",
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


def upload_property_image(
    property_id: UUID,
    content: bytes,
    content_type: str,
) -> str:
    """
    Validates and uploads one property listing photo to the public
    property-media bucket, returning a fetchable public URL (unlike
    upload_broker_document, since listing photos are shown unauthenticated
    on the client site). Raises 422 on an unsupported content type or a
    file over 10MB.
    """
    if content_type not in ALLOWED_IMAGE_CONTENT_TYPES:
        raise ValidationFailed(
            "UNSUPPORTED_FILE_TYPE",
            "Only JPG, PNG, or WEBP images are accepted.",
            {"file": "Only JPG, PNG, or WEBP images are accepted."},
        )
    if len(content) > MAX_IMAGE_SIZE_BYTES:
        raise ValidationFailed(
            "FILE_TOO_LARGE",
            "File must be 10 MB or smaller.",
            {"file": "File must be 10 MB or smaller."},
        )

    extension = _IMAGE_EXTENSION_BY_CONTENT_TYPE[content_type]
    object_key = f"{property_id}/{uuid4().hex}{extension}"

    _get_client().put_object(
        Bucket=settings.SUPABASE_S3_BUCKET_PROPERTY_MEDIA,
        Key=object_key,
        Body=content,
        ContentType=content_type,
    )
    return f"{settings.SUPABASE_URL}/storage/v1/object/public/{settings.SUPABASE_S3_BUCKET_PROPERTY_MEDIA}/{object_key}"


def upload_property_video(
    property_id: UUID,
    content: bytes,
    content_type: str,
) -> str:
    """
    Validates and uploads a property video (walkthrough or drone footage) to
    the same public property-media bucket used for photos, returning a
    fetchable public URL. Goes straight through Supabase Storage rather than
    Cloudflare Stream — Stream isn't wired up yet, so there's no adaptive
    transcoding/streaming here, just a direct file URL, same as an image.
    """
    if content_type not in ALLOWED_VIDEO_CONTENT_TYPES:
        raise ValidationFailed(
            "UNSUPPORTED_FILE_TYPE",
            "Only MP4 or MOV videos are accepted.",
            {"file": "Only MP4 or MOV videos are accepted."},
        )
    if len(content) > MAX_VIDEO_SIZE_BYTES:
        raise ValidationFailed(
            "FILE_TOO_LARGE",
            "File must be 100 MB or smaller.",
            {"file": "File must be 100 MB or smaller."},
        )

    extension = _VIDEO_EXTENSION_BY_CONTENT_TYPE[content_type]
    object_key = f"{property_id}/{uuid4().hex}{extension}"

    _get_client().put_object(
        Bucket=settings.SUPABASE_S3_BUCKET_PROPERTY_MEDIA,
        Key=object_key,
        Body=content,
        ContentType=content_type,
    )
    return f"{settings.SUPABASE_URL}/storage/v1/object/public/{settings.SUPABASE_S3_BUCKET_PROPERTY_MEDIA}/{object_key}"


def upload_property_document(
    property_id: UUID,
    content: bytes,
    content_type: str,
) -> str:
    """
    Validates and uploads a property-scoped private document (currently
    just the JV Agreement) to the same private bucket used for broker
    verification documents, returning an internal object key rather than a
    fetchable URL — matches the Figma copy ("For internal use only — not
    visible to buyers").
    """
    if content_type not in ALLOWED_DOCUMENT_CONTENT_TYPES:
        raise ValidationFailed(
            "UNSUPPORTED_FILE_TYPE",
            "Only PDF, DOC, DOCX, JPG, or PNG files are accepted.",
            {"file": "Only PDF, DOC, DOCX, JPG, or PNG files are accepted."},
        )
    if len(content) > MAX_PROPERTY_DOCUMENT_SIZE_BYTES:
        raise ValidationFailed(
            "FILE_TOO_LARGE",
            "File must be 10 MB or smaller.",
            {"file": "File must be 10 MB or smaller."},
        )

    extension = _EXTENSION_BY_CONTENT_TYPE[content_type]
    object_key = f"properties/{property_id}/documents/{uuid4().hex}{extension}"

    _get_client().put_object(
        Bucket=settings.SUPABASE_S3_BUCKET,
        Key=object_key,
        Body=content,
        ContentType=content_type,
    )
    return object_key
