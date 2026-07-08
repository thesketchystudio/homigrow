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

    @computed_field
    @property
    def DATABASE_URL(self) -> str:
        """Assembles the Postgres connection string from the DB_* fields."""
        return (
            f"postgresql://{self.DB_USER}:{self.DB_PASSWORD}"
            f"@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
        )


settings = Settings()
