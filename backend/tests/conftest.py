"""
tests/conftest.py

Shared pytest fixtures. db_session wraps each test in a transaction
that is rolled back afterward, so tests never leave data behind or
affect one another. client wires a TestClient to reuse that same
session via dependency override, so route tests run within the same
rollback boundary. The rate limiter is a process-wide singleton
(app/core/middleware.py), so its counters are reset before every test —
otherwise unrelated tests that happen to call the same auth endpoint
would accumulate against one another's request budget. Real Resend
sends are mocked out for every test — otherwise every signup/OTP test
would make a live network call.
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import sessionmaker

from app.core.middleware import limiter
from app.core.security import hash_password
from app.db.session import engine, get_db
from app.main import app
from app.models.enums import UserRole
from app.models.user import User


@pytest.fixture(autouse=True)
def _reset_rate_limiter():
    """Clears slowapi's in-memory counters before each test so per-test rate-limit assertions don't leak across the suite."""
    limiter.reset()


@pytest.fixture(autouse=True)
def _mock_send_otp_email(monkeypatch):
    """Prevents tests from making real Resend API calls — auth_service._issue_otp sends via httpx."""
    monkeypatch.setattr("app.services.email_service.send_otp_email", lambda *args, **kwargs: None)


@pytest.fixture(autouse=True)
def _mock_send_password_reset_email(monkeypatch):
    """Prevents tests from making real Resend API calls — auth_service.forgot_password sends via httpx."""
    monkeypatch.setattr("app.services.email_service.send_password_reset_email", lambda *args, **kwargs: None)


@pytest.fixture(autouse=True)
def _mock_s3_client(monkeypatch):
    """
    Prevents tests from making real Supabase Storage (S3) calls, while
    leaving storage_service.upload_broker_document's own validation
    logic (content type, size) genuinely exercised — only the boto3
    client itself is stubbed.
    """

    class _FakeS3Client:
        def __init__(self):
            self.deleted_keys: list[str] = []

        def put_object(self, **kwargs):
            return None

        def delete_object(self, **kwargs):
            self.deleted_keys.append(kwargs["Key"])

    fake_client = _FakeS3Client()
    monkeypatch.setattr("app.services.storage_service._get_client", lambda: fake_client)
    return fake_client


@pytest.fixture()
def db_session():
    """Yields a database session bound to a transaction that is rolled back after the test."""
    connection = engine.connect()
    transaction = connection.begin()
    session = sessionmaker(bind=connection)()

    yield session

    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture()
def client(db_session):
    """Yields a TestClient with get_db overridden to use the transactional db_session."""

    def _get_db_override():
        yield db_session

    app.dependency_overrides[get_db] = _get_db_override
    # localhost matches the default ALLOWED_HOSTS; TestClient's own default host would be rejected.
    yield TestClient(app, base_url="http://localhost")
    app.dependency_overrides.clear()


def make_user(
    db_session,
    *,
    phone: str = "+919876500000",
    role: UserRole = UserRole.client,
    password: str | None = "correct-horse-battery-staple",
    **kwargs,
) -> User:
    """
    Creates and flushes a User row for tests that need one already
    persisted, without going through the signup service/OTP flow. The
    email is marked verified by default (pass is_email_verified=False to
    model a half-finished signup), since login rejects unverified ones.
    """
    kwargs.setdefault("is_email_verified", True)
    user = User(
        phone=phone,
        role=role,
        password_hash=hash_password(password) if password else None,
        **kwargs,
    )
    db_session.add(user)
    db_session.flush()
    return user


# Minimal byte strings carrying each file type's real leading signature, so
# upload tests exercise the signature check without needing real media files.
SAMPLE_JPEG = b"\xff\xd8\xff\xe0" + b"0" * 16
SAMPLE_PNG = b"\x89PNG\r\n\x1a\n" + b"0" * 16
SAMPLE_WEBP = b"RIFF\x00\x00\x00\x00WEBP" + b"0" * 16
SAMPLE_PDF = b"%PDF-1.4 sample"
SAMPLE_MP4 = b"\x00\x00\x00\x18ftypmp42" + b"0" * 16


def age_otp_codes(db, email: str, seconds: int = 120) -> None:
    """Backdates every OTP row for an email so the per-email resend cooldown has elapsed, letting a test request another code."""
    from datetime import datetime, timedelta, timezone

    from app.models.otp_code import OTPCode

    db.query(OTPCode).filter(OTPCode.email == email).update(
        {"created_at": datetime.now(timezone.utc) - timedelta(seconds=seconds)}, synchronize_session=False
    )
    db.flush()
