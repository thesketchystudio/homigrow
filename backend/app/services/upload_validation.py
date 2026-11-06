"""
app/services/upload_validation.py

Guards for user-supplied file uploads: a size-bounded reader that never
buffers more than the allowed size, and a file-signature check that
confirms the bytes really are the type the client declared.

The declared Content-Type is attacker-controlled, so on its own it says
nothing about the content. Without a signature check, an HTML or SVG
payload labelled image/jpeg could be stored in the public bucket and
served from the storage domain. Matching the leading bytes against the
declared type closes that gap without decoding the file.
"""

from typing import BinaryIO

from app.core.exceptions import ValidationFailed

_CHUNK_SIZE = 64 * 1024

_OLE_HEADER = b"\xd0\xcf\x11\xe0\xa1\xb1\x1a\xe1"  # legacy .doc container


def _is_jpeg(content: bytes) -> bool:
    return content.startswith(b"\xff\xd8\xff")


def _is_png(content: bytes) -> bool:
    return content.startswith(b"\x89PNG\r\n\x1a\n")


def _is_webp(content: bytes) -> bool:
    return content[:4] == b"RIFF" and content[8:12] == b"WEBP"


def _is_pdf(content: bytes) -> bool:
    return content.startswith(b"%PDF-")


def _is_iso_media(content: bytes) -> bool:
    # MP4 and QuickTime both begin with a size field then an "ftyp" box.
    return content[4:8] == b"ftyp"


def _is_docx(content: bytes) -> bool:
    return content.startswith(b"PK\x03\x04")


def _is_doc(content: bytes) -> bool:
    return content.startswith(_OLE_HEADER)


_SIGNATURE_CHECKS = {
    "image/jpeg": _is_jpeg,
    "image/png": _is_png,
    "image/webp": _is_webp,
    "application/pdf": _is_pdf,
    "video/mp4": _is_iso_media,
    "video/quicktime": _is_iso_media,
    "application/msword": _is_doc,
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": _is_docx,
}


def read_limited(file: BinaryIO, max_bytes: int) -> bytes:
    """
    Reads an uploaded file in chunks and stops as soon as it exceeds
    max_bytes, so an oversized upload is rejected after at most one extra
    chunk rather than being loaded into memory in full first.
    """
    chunks: list[bytes] = []
    total = 0
    while True:
        chunk = file.read(_CHUNK_SIZE)
        if not chunk:
            break
        total += len(chunk)
        if total > max_bytes:
            limit_mb = max_bytes // (1024 * 1024)
            message = f"File must be {limit_mb} MB or smaller."
            raise ValidationFailed("FILE_TOO_LARGE", message, {"file": message})
        chunks.append(chunk)
    return b"".join(chunks)


def verify_signature(content: bytes, content_type: str) -> None:
    """
    Raises 422 unless the file's leading bytes match its declared type.
    Content types with no registered signature are rejected too, so a new
    allowed type can't be added without also registering how to verify it.
    """
    check = _SIGNATURE_CHECKS.get(content_type)
    if check is None or not check(content):
        message = "The file's contents don't match its file type."
        raise ValidationFailed("FILE_CONTENT_MISMATCH", message, {"file": message})
