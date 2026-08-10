"""
app/main.py

FastAPI application entry point. Initializes logging and Sentry, and
mounts routes. Business logic does not live here — route handlers
delegate to services.
"""

import logging

import sentry_sdk
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi.middleware import SlowAPIMiddleware

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.exceptions import install_exception_handlers
from app.core.middleware import limiter

# Without a configured handler, stdlib logging silently drops every
# INFO call (its "no handler" fallback only surfaces WARNING+) — this
# is what every service-layer logger.info() call (dev-mode OTP/reset
# token logging) relies on actually reaching the console. Structured
# JSON formatting for production is still open work; this is the
# plain-in-dev half.
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")

if settings.SENTRY_DSN:
    sentry_sdk.init(
        dsn=settings.SENTRY_DSN,
        environment=settings.ENVIRONMENT,
        traces_sample_rate=1.0,
    )

app = FastAPI(title="Homigrow API")
app.state.limiter = limiter
install_exception_handlers(app)
app.add_middleware(SlowAPIMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_ORIGIN],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(api_router)


@app.get("/health")
def health_check():
    """Liveness/readiness probe reporting the running environment."""
    return {"status": "ok", "environment": settings.ENVIRONMENT}
