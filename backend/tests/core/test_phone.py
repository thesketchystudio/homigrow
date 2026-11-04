"""
tests/core/test_phone.py

Covers app/core/phone.normalize_indian_mobile: accepted spellings all
collapse to one canonical "+91XXXXXXXXXX" form, and numbers that cannot
be real are rejected.
"""

import pytest

from app.core.phone import normalize_indian_mobile


@pytest.mark.parametrize(
    "raw",
    ["9876543211", "+919876543211", "919876543211", "09876543211", "98765 43211", "+91 98765-43211", "(98765) 43211"],
)
def test_accepted_spellings_normalise_to_one_form(raw):
    assert normalize_indian_mobile(raw) == "+919876543211"


@pytest.mark.parametrize(
    "raw",
    ["", "12345", "5876543211", "0000000000", "9999999999", "1234567890", "9876543210", "98765432112", "+441234567890", "98765abcde"],
)
def test_implausible_numbers_are_rejected(raw):
    assert normalize_indian_mobile(raw) is None
