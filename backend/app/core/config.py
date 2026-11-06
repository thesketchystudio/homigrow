"""
app/core/config.py

Application settings loaded from environment variables / .env. Database
connection parts (DB_*) are kept separate and assembled into
DATABASE_URL via a computed field, so no other code ever hardcodes or
flattens the connection string.
"""

from pydantic import Field, computed_field, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


MIN_JWT_SECRET_LENGTH = 32


class Settings(BaseSettings):
    """Typed application configuration, populated from the environment."""

    model_config = SettingsConfigDict(env_file=".env")

    DB_HOST: str
    DB_PORT: int = 5432
    DB_NAME: str
    DB_USER: str
    DB_PASSWORD: str
    ENVIRONMENT: str = "dev"
    SENTRY_DSN: str = ""
    # Share of requests that get a performance trace (errors are always
    # reported regardless). Tracing every request is costly at production
    # volume, so the default samples one in ten; raise it temporarily when
    # investigating latency.
    SENTRY_TRACES_SAMPLE_RATE: float = Field(default=0.1, ge=0, le=1)

    # Secret, so no default — fails fast at startup if missing rather
    # than silently signing tokens with a predictable value.
    JWT_SECRET: str
    JWT_ACCESS_TTL_MIN: int = 15
    JWT_REFRESH_TTL_DAYS: int = 30

    RESEND_API_KEY: str
    RESEND_FROM_EMAIL: str

    # Declared now so Settings() doesn't fail on the already-present .env
    # value (pydantic-settings forbids undeclared env vars by default).
    # The sms_service.py MSG91 adapter that would consume this is not
    # currently wired up anywhere in the app.
    MSG91_AUTH_KEY: str = ""

    # Expected browser origin for the frontend SPA; used only to validate
    # the Origin header on the one cookie-authenticated endpoint
    # (/auth/refresh) as a CSRF defense.
    FRONTEND_ORIGIN: str = "http://localhost:3000"

    # OAuth 2.0 web client ID from Google Cloud Console, used to verify
    # Google Identity Services ID tokens on /auth/google. No client secret
    # is needed since the ID-token flow never performs a server-side code
    # exchange.
    GOOGLE_CLIENT_ID: str = ""

    # Broker verification document storage. Points at Supabase Storage's
    # S3-compatible endpoint rather than Cloudflare R2 (the originally
    # planned provider, per 00_Project_Overview.md) — R2 requires a card
    # on file to activate even on its free tier, which wasn't available
    # when this was built. storage_service.py talks to this purely via
    # the S3 protocol (boto3), so swapping to R2 later is a config change,
    # not a rewrite.
    SUPABASE_ACCESS_KEY_ID: str = ""
    SUPABASE_SECRET_ACCESS_KEY: str = ""
    SUPABASE_S3_ENDPOINT: str = ""
    SUPABASE_S3_REGION: str = ""
    SUPABASE_S3_BUCKET: str = ""

    # Project base URL, used only to build public object URLs for property
    # media (https://<ref>.supabase.co/storage/v1/object/public/<bucket>/<key>)
    # — distinct from SUPABASE_S3_ENDPOINT, which points at the storage
    # subdomain's S3-compatible API and isn't the public object host.
    SUPABASE_URL: str = ""

    # Public bucket for broker-uploaded listing photos — separate from
    # SUPABASE_S3_BUCKET (private, verification documents only), since
    # listing photos must be publicly viewable on the client site.
    SUPABASE_S3_BUCKET_PROPERTY_MEDIA: str = "property-media"

    # Header carrying the real visitor IP when the API sits behind a proxy
    # or CDN (e.g. "CF-Connecting-IP" for Cloudflare, "X-Forwarded-For" for
    # most load balancers). Leave empty for direct access and local dev.
    # Set it only if the API is reachable exclusively through that proxy,
    # since any client could otherwise forge the header and dodge rate
    # limits. TRUSTED_PROXY_HOPS applies to X-Forwarded-For only: how many
    # of our own proxies append to it.
    CLIENT_IP_HEADER: str = ""
    TRUSTED_PROXY_HOPS: int = 1

    # Comma-separated Host header values the API will answer to. Requests
    # carrying any other Host are rejected, which blocks host-header
    # poisoning and requests that reach the app by an unexpected name.
    # The default covers local development only; production must set it
    # to the real API hostname(s).
    ALLOWED_HOSTS: str = "localhost,127.0.0.1"

    # Local-development convenience: when true, one-time codes and password
    # reset tokens are written to the application log so flows can be tested
    # without opening an inbox. Those values grant account access, and logs
    # are shipped to hosting dashboards and Sentry, so this is off by default,
    # must stay off on any deployed environment, and is refused in production.
    DEBUG_LOG_SECRETS: bool = False

    @field_validator("JWT_SECRET")
    @classmethod
    def _require_strong_jwt_secret(cls, value: str) -> str:
        """Rejects a JWT signing secret shorter than 32 characters, since HS256 tokens signed with a short secret can be brute-forced offline."""
        if len(value) < MIN_JWT_SECRET_LENGTH:
            raise ValueError(f"JWT_SECRET must be at least {MIN_JWT_SECRET_LENGTH} characters long")
        return value

    @model_validator(mode="after")
    def _forbid_secret_logging_in_production(self) -> "Settings":
        """Fails startup if DEBUG_LOG_SECRETS is enabled with ENVIRONMENT=production."""
        if self.ENVIRONMENT == "production" and self.DEBUG_LOG_SECRETS:
            raise ValueError("DEBUG_LOG_SECRETS must not be enabled when ENVIRONMENT=production")
        return self

    @model_validator(mode="after")
    def _require_explicit_hosts_in_production(self) -> "Settings":
        """Fails startup in production if ALLOWED_HOSTS was left at the local-only default, since the API would then reject every real request."""
        if self.ENVIRONMENT == "production" and self.ALLOWED_HOSTS == "localhost,127.0.0.1":
            raise ValueError("ALLOWED_HOSTS must be set to the API's public hostname(s) when ENVIRONMENT=production")
        return self

    @property
    def allowed_hosts_list(self) -> list[str]:
        """ALLOWED_HOSTS split into a clean list for TrustedHostMiddleware."""
        return [host.strip() for host in self.ALLOWED_HOSTS.split(",") if host.strip()]

    @computed_field
    @property
    def DATABASE_URL(self) -> str:
        """Assembles the Postgres connection string from the DB_* fields."""
        return (
            f"postgresql://{self.DB_USER}:{self.DB_PASSWORD}"
            f"@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
        )


settings = Settings()
