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

# --- Routes ---
@app.get("/health")
def health_check():
    return {"status": "ok", "environment": settings.ENVIRONMENT}