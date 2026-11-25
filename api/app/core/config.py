"""Settings, read from the environment (and api/.env in development)."""

from functools import lru_cache
from typing import Annotated, Literal

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict


def _split(value: object) -> list[str]:
    if isinstance(value, str):
        return [part.strip() for part in value.split(",") if part.strip()]
    return list(value or [])  # type: ignore[arg-type]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    environment: Literal["development", "test", "production"] = Field("development", alias="APP_ENV")
    database_url: str = Field(alias="DATABASE_URL")
    database_pool_max: int = Field(5, alias="DATABASE_POOL_MAX")

    # Same secret the Next.js site requires before accounts are enabled in production.
    auth_secret: str = Field("", alias="AUTH_SECRET")
    # Browser origins allowed to make state-changing requests (the customer site, later the admin).
    allowed_origins: Annotated[list[str], NoDecode] = Field(default_factory=list, alias="ALLOWED_ORIGINS")
    admin_emails: Annotated[list[str], NoDecode] = Field(default_factory=list, alias="OBASIX_ADMIN_EMAILS")
    site_url: str = Field("http://localhost:3000", alias="NEXT_PUBLIC_SITE_URL")
    # Only behind a proxy you control (the Next.js rewrite, a load balancer).
    trust_proxy_headers: bool = Field(False, alias="TRUST_PROXY_HEADERS")
    # Shared with the Next.js site: requests carrying it may state the visitor's IP.
    proxy_secret: str = Field("", alias="OBASIX_API_PROXY_SECRET")

    resend_api_key: str = Field("", alias="RESEND_API_KEY")
    resend_api_base: str = Field("https://api.resend.com", alias="RESEND_API_BASE")
    email_from: str = Field("", alias="EMAIL_FROM")

    # Commerce mode, decided as on the site (src/lib/commerce/mode.ts).
    commerce_mode_flag: str = Field("", alias="OBASIX_COMMERCE_MODE")
    razorpay_key_id: str = Field("", alias="RAZORPAY_KEY_ID")
    razorpay_key_secret: str = Field("", alias="RAZORPAY_KEY_SECRET")
    razorpay_webhook_secret: str = Field("", alias="RAZORPAY_WEBHOOK_SECRET")

    sentry_dsn: str = Field("", alias="SENTRY_DSN")
    log_level: str = Field("INFO", alias="LOG_LEVEL")

    @field_validator("allowed_origins", "admin_emails", mode="before")
    @classmethod
    def _csv(cls, value: object) -> list[str]:
        return _split(value)

    @field_validator("admin_emails")
    @classmethod
    def _lower(cls, value: list[str]) -> list[str]:
        return [email.lower() for email in value]

    @field_validator("site_url")
    @classmethod
    def _strip_slash(cls, value: str) -> str:
        return value.rstrip("/")

    @property
    def production(self) -> bool:
        return self.environment == "production"

    @property
    def auth_configured(self) -> bool:
        return not self.production or bool(self.auth_secret)

    @property
    def commerce_mode(self) -> str:
        """ "real" with payment keys; "demo" when asked for or in development; else "unconfigured"."""
        if self.razorpay_key_id and self.razorpay_key_secret and self.razorpay_webhook_secret:
            return "real"
        if self.commerce_mode_flag == "live":
            return "unconfigured"
        if self.commerce_mode_flag == "demo" or self.environment == "development":
            return "demo"
        return "unconfigured"

    @property
    def email_configured(self) -> bool:
        return bool(self.resend_api_key and self.email_from)


@lru_cache
def get_settings() -> Settings:
    return Settings()  # type: ignore[call-arg]
