"""
app/main.py

FastAPI application entry point. Initializes Sentry and mounts routes.
Business logic does not live here — route handlers delegate to services.
"""

import sentry_sdk
from fastapi import FastAPI

from app.core.config import settings

if settings.SENTRY_DSN:
    sentry_sdk.init(
        dsn=settings.SENTRY_DSN,
        environment=settings.ENVIRONMENT,
        traces_sample_rate=1.0,
    )

app = FastAPI(title="Homigrow API")


@app.get("/health")
def health_check():
    """Liveness/readiness probe reporting the running environment."""
    return {"status": "ok", "environment": settings.ENVIRONMENT}
