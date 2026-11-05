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
from fastapi.middleware.trustedhost import TrustedHostMiddleware
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

# Exactly what the frontend sends: the HTTP verbs its API client uses and
# the two custom request headers (bearer token, JSON body). Anything else is
# refused at the CORS preflight instead of being waved through by a wildcard.
CORS_ALLOWED_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"]
CORS_ALLOWED_HEADERS = ["Authorization", "Content-Type"]


def docs_config(environment: str) -> dict[str, str | None]:
    """
    Returns the FastAPI URL settings for the interactive docs and OpenAPI
    schema. They are switched off in production so the full route and
    schema map isn't handed to anyone probing the API.
    """
    if environment == "production":
        return {"docs_url": None, "redoc_url": None, "openapi_url": None}
    return {"docs_url": "/docs", "redoc_url": "/redoc", "openapi_url": "/openapi.json"}


app = FastAPI(title="Homigrow API", **docs_config(settings.ENVIRONMENT))
app.state.limiter = limiter
install_exception_handlers(app)
app.add_middleware(SlowAPIMiddleware)
app.add_middleware(TrustedHostMiddleware, allowed_hosts=settings.allowed_hosts_list)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_ORIGIN],
    allow_credentials=True,
    allow_methods=CORS_ALLOWED_METHODS,
    allow_headers=CORS_ALLOWED_HEADERS,
)
app.include_router(api_router)


@app.get("/health")
def health_check():
    """Liveness probe. Deliberately reports nothing about the deployment, since it is publicly reachable."""
    return {"status": "ok"}
