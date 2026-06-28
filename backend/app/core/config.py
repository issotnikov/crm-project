"""
Application configuration.
Reads from environment variables with sensible defaults.
"""
from functools import lru_cache
from typing import List

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── Application ────────────────────────────────────────────────────────
    APP_ENV: str = "development"
    SECRET_KEY: str = "dev-secret-key-change-in-production"
    CORS_ORIGINS: str = "*"

    @property
    def CORS_ORIGINS_LIST(self) -> List[str]:
        if self.CORS_ORIGINS == "*":
            return ["*"]
        return [o.strip() for o in self.CORS_ORIGINS.split(",")]

    # ── Database ───────────────────────────────────────────────────────────
    DATABASE_URL: str = "postgresql+asyncpg://crm:crm@localhost:5432/crm"

    # ── Redis ──────────────────────────────────────────────────────────────
    REDIS_URL: str = "redis://localhost:6379/0"

    # ── S3 / MinIO ─────────────────────────────────────────────────────────
    S3_ENDPOINT: str = "http://localhost:9000"
    S3_ACCESS_KEY: str = "minioadmin"
    S3_SECRET_KEY: str = "minioadmin"
    S3_BUCKET: str = "crm-data"
    S3_REGION: str = "us-east-1"

    # ── Auth / JWT ─────────────────────────────────────────────────────────
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_EXPIRE_MINUTES: int = 15
    JWT_REFRESH_EXPIRE_DAYS: int = 7

    # ── Telegram ───────────────────────────────────────────────────────────
    TELEGRAM_BOT_TOKEN: str = ""
    TELEGRAM_WEBHOOK_URL: str = ""
    TELEGRAM_POLL_INTERVAL: int = 2

    # ── Email ──────────────────────────────────────────────────────────────
    IMAP_HOST: str = ""
    IMAP_PORT: int = 993
    IMAP_USER: str = ""
    IMAP_PASSWORD: str = ""
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""

    # ── Telephony ──────────────────────────────────────────────────────────
    PHONE_PROVIDER: str = "mango"
    PHONE_API_KEY: str = ""
    PHONE_API_SECRET: str = ""
    PHONE_DOMAIN: str = ""

    # ── Web Form ───────────────────────────────────────────────────────────
    WEBFORM_API_KEY: str = ""

    # ── reCAPTCHA ──────────────────────────────────────────────────────────
    RECAPTCHA_SECRET_KEY: str = ""
    RECAPTCHA_MIN_SCORE: float = 0.5

    # ── Rate Limiting ──────────────────────────────────────────────────────
    RATE_LIMIT_PER_MINUTE: int = 100

    @field_validator("SECRET_KEY")
    @classmethod
    def validate_secret_key(cls, v: str) -> str:
        if v == "dev-secret-key-change-in-production" and "production" in (v, ""):
            raise ValueError("SECRET_KEY must be set in production!")
        return v


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
