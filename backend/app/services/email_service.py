"""
app/services/email_service.py

Thin Resend adapter for outbound transactional email, isolated behind
this module so switching providers later stays a one-file change
(same precedent as the shelved sms_service.py adapter, ADR-011).
Currently backs OTP delivery only (09_Phase_2.md amendment,
2026-07-14) — password-reset email (P2-T30) still logs instead of
sending, unchanged by this file.
"""

import logging

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)

RESEND_API_URL = "https://api.resend.com/emails"


def send_otp_email(to: str, code: str) -> None:
    """
    Sends a one-time verification code by email via Resend. Raises on
    a network or non-2xx API failure — callers decide whether that's
    fatal; _issue_otp treats it as non-fatal since the dev-mode console
    log is still a working fallback delivery path.
    """
    response = httpx.post(
        RESEND_API_URL,
        headers={"Authorization": f"Bearer {settings.RESEND_API_KEY}"},
        json={
            "from": settings.RESEND_FROM_EMAIL,
            "to": [to],
            "subject": "Your Homigrow verification code",
            "html": f"<p>Your verification code is <strong>{code}</strong>. It expires in 10 minutes.</p>",
        },
        timeout=10.0,
    )
    response.raise_for_status()
