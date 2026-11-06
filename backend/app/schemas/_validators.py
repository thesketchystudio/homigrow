"""
app/schemas/_validators.py

Reusable annotated field types for request schemas: email format, Indian
mobile numbers (canonicalised), http(s) URLs and bounded amenity lists.
Defined once so every schema that accepts one of these applies the same
rule instead of each re-implementing it.
"""

import re
from typing import Annotated
from urllib.parse import urlparse

from pydantic import AfterValidator, Field

from app.core.phone import normalize_indian_mobile

# Deliberately a shape check, not a deliverability check: something@domain.tld
# with no spaces. The OTP email is what actually proves an address works, and
# a stricter validator would reject reserved test domains such as ".local".
_EMAIL_PATTERN = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]{2,}$")

AMENITY_MAX_LENGTH = 60
AMENITIES_MAX_COUNT = 50
URL_MAX_LENGTH = 500


def _check_email(value: str) -> str:
    value = value.strip()
    if len(value) > 254 or not _EMAIL_PATTERN.match(value):
        raise ValueError("Enter a valid email address")
    return value


def _canonical_mobile(value: str) -> str:
    normalized = normalize_indian_mobile(value)
    if normalized is None:
        raise ValueError("Enter a valid 10-digit Indian mobile number")
    return normalized


def _check_http_url(value: str) -> str:
    """Only http and https links are stored; anything else (javascript:, data:, file:) would be unsafe the day the URL is rendered as a link or frame."""
    value = value.strip()
    parsed = urlparse(value)
    if parsed.scheme not in ("http", "https") or not parsed.netloc:
        raise ValueError("Enter a valid http or https link")
    return value


EmailAddress = Annotated[str, AfterValidator(_check_email)]
IndianMobile = Annotated[str, AfterValidator(_canonical_mobile)]
HttpUrlString = Annotated[str, Field(max_length=URL_MAX_LENGTH), AfterValidator(_check_http_url)]
AmenityList = Annotated[
    list[Annotated[str, Field(min_length=1, max_length=AMENITY_MAX_LENGTH)]],
    Field(max_length=AMENITIES_MAX_COUNT),
]
