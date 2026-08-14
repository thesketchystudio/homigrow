"""
app/core/config.py

Application settings loaded from environment variables / .env. Database
connection parts (DB_*) are kept separate and assembled into
DATABASE_URL via a computed field, so no other code ever hardcodes or
flattens the connection string.
"""

from pydantic import computed_field
from pydantic_settings import BaseSettings, SettingsConfigDict


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

    @computed_field
    @property
    def DATABASE_URL(self) -> str:
        """Assembles the Postgres connection string from the DB_* fields."""
        return (
            f"postgresql://{self.DB_USER}:{self.DB_PASSWORD}"
            f"@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
        )


settings = Settings()
