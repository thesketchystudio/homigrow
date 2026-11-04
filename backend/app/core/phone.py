"""
app/core/phone.py

Normalises and sanity-checks Indian mobile numbers typed into public
forms. Normalising to one canonical "+91XXXXXXXXXX" form means the same
person cannot dodge per-number limits and duplicate-lead checks by
writing their number a different way ("98765 43210" vs "+919876543210").
"""

import re
from typing import Optional

_MOBILE_PATTERN = re.compile(r"^[6-9]\d{9}$")
_OBVIOUS_SEQUENCES = ("0123456789", "1234567890", "9876543210", "0987654321")


def normalize_indian_mobile(raw: str) -> Optional[str]:
    """
    Returns "+91" followed by the 10-digit mobile number, or None when the
    input is not a plausible Indian mobile. Accepts spaces, dashes and
    brackets, and an optional +91 / 91 / 0 prefix. Rejects numbers that
    cannot be real (do not start 6-9, one repeated digit, a plain
    ascending or descending run) since those are what people type to get
    past a phone field.
    """
    digits = re.sub(r"[\s\-()]", "", raw)
    if digits.startswith("+91"):
        digits = digits[3:]
    elif len(digits) == 12 and digits.startswith("91"):
        digits = digits[2:]
    elif len(digits) == 11 and digits.startswith("0"):
        digits = digits[1:]

    if not _MOBILE_PATTERN.match(digits):
        return None
    if len(set(digits)) == 1 or digits in _OBVIOUS_SEQUENCES:
        return None
    return f"+91{digits}"
