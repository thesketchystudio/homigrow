"""
app/services/email_service.py

Thin Resend adapter for outbound transactional email, isolated behind
this module so switching providers later stays a one-file change
(same precedent as the shelved sms_service.py adapter, ADR-011). Backs
OTP delivery (09_Phase_2.md amendment, 2026-07-14) and password-reset
delivery (P2-T30, 2026-07-17).
"""

import logging

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)

RESEND_API_URL = "https://api.resend.com/emails"

_OTP_EMAIL_TEMPLATE = """\
<div style="font-family:sans-serif;max-width:480px;margin:0 auto;border:1px solid #eee;border-radius:12px;overflow:hidden">
  <div style="background:#0c0c0c;color:#fff;padding:20px 24px;font-weight:700;letter-spacing:1px">HOMIGROW</div>
  <div style="padding:32px 24px">
    <h1 style="font-size:20px;margin:0 0 8px">Verify your identity</h1>
    <p style="font-size:14px;color:#444;margin:0 0 24px">Enter this code to continue:</p>
    <div style="font-size:32px;font-weight:700;letter-spacing:8px;text-align:center;padding:16px;background:#f4f4f5;border-radius:8px;margin:0 0 16px">{code}</div>
    <p style="font-size:13px;color:#888;margin:0">Expires in 10 minutes.</p>
  </div>
  <div style="background:#fafafa;padding:16px 24px;font-size:12px;color:#999;border-top:1px solid #eee">
    &copy; 2026 Homigrow &middot; Help &middot; Privacy
  </div>
</div>
"""


_PASSWORD_RESET_EMAIL_TEMPLATE = """\
<div style="font-family:sans-serif;max-width:480px;margin:0 auto;border:1px solid #eee;border-radius:12px;overflow:hidden">
  <div style="background:#0c0c0c;color:#fff;padding:20px 24px;font-weight:700;letter-spacing:1px">HOMIGROW</div>
  <div style="padding:32px 24px">
    <h1 style="font-size:20px;margin:0 0 8px">Reset your password</h1>
    <p style="font-size:14px;color:#444;margin:0 0 24px">Click the button below to choose a new password. This link expires in 30 minutes.</p>
    <a href="{reset_url}" style="display:block;text-align:center;padding:14px;background:#0c0c0c;color:#fff;text-decoration:none;font-weight:700;border-radius:8px;margin:0 0 16px">Reset password</a>
    <p style="font-size:13px;color:#888;margin:0">If you didn't request this, you can safely ignore this email.</p>
  </div>
  <div style="background:#fafafa;padding:16px 24px;font-size:12px;color:#999;border-top:1px solid #eee">
    &copy; 2026 Homigrow &middot; Help &middot; Privacy
  </div>
</div>
"""


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
            "html": _OTP_EMAIL_TEMPLATE.format(code=code),
        },
        timeout=10.0,
    )
    response.raise_for_status()


def send_password_reset_email(to: str, reset_url: str) -> None:
    """
    Sends a password-reset link by email via Resend. Raises on a
    network or non-2xx API failure — forgot_password treats it as
    non-fatal since the dev-mode console log is still a working
    fallback delivery path.
    """
    response = httpx.post(
        RESEND_API_URL,
        headers={"Authorization": f"Bearer {settings.RESEND_API_KEY}"},
        json={
            "from": settings.RESEND_FROM_EMAIL,
            "to": [to],
            "subject": "Reset your Homigrow password",
            "html": _PASSWORD_RESET_EMAIL_TEMPLATE.format(reset_url=reset_url),
        },
        timeout=10.0,
    )
    response.raise_for_status()
