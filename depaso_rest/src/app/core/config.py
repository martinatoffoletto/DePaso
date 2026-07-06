"""
Configuration module using Pydantic Settings v2.
Reads environment variables from .env file.
"""
from pydantic import model_validator
from pydantic_settings import BaseSettings

# Placeholder value shipped for local dev. It must never reach production —
# see the validator below, which refuses to boot with it when environment is prod.
INSECURE_JWT_DEFAULT = "your-secret-key-change-this"


class Settings(BaseSettings):
    """Application settings from environment variables."""

    # Database — defaults to SQLite for local dev, set DATABASE_URL env var for PostgreSQL
    database_url: str = "sqlite:///./depaso_dev.db"  # Override con DATABASE_URL en .env

    # JWT
    jwt_secret_key: str = INSECURE_JWT_DEFAULT
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 30
    refresh_token_expire_days: int = 7

    # Server
    debug: bool = True
    environment: str = "development"
    api_prefix: str = "/api/v1"

    # Rate limiting (RNF-SEC-06) — disabled in tests via RATE_LIMIT_ENABLED=false
    rate_limit_enabled: bool = True
    rate_limit_auth: str = "5/minute"

    # CORS — restrict per environment via the CORS_ORIGINS env var (JSON list).
    cors_origins: list[str] = [
        "http://localhost:3000",
        "http://localhost:8081",
        "http://localhost:8100",
        "http://localhost:5173",  # Vite dev server (depaso_web)
    ]

    # AI Models
    vision_model_path: str = "./ml/models/cargo_classifier_v1.keras"
    confidence_threshold: float = 0.7

    # External APIs
    osrm_url: str = "http://router.project-osrm.org"
    ipcc_emission_factor_default: float = 0.2

    class Config:
        env_file = ".env"
        case_sensitive = False

    @property
    def is_production(self) -> bool:
        return self.environment.lower() in ("production", "prod")

    @model_validator(mode="after")
    def _enforce_production_secrets(self) -> "Settings":
        """In production the JWT secret must be a real, non-default value and
        CORS must not be an open wildcard.

        Failing fast at boot is safer than silently signing tokens with a
        publicly known key or accepting credentialed requests from any origin
        (RNF-SEC-01). CORS is configured per environment via CORS_ORIGINS.
        """
        if self.is_production and (
            not self.jwt_secret_key or self.jwt_secret_key == INSECURE_JWT_DEFAULT
        ):
            raise ValueError(
                "JWT_SECRET_KEY must be set to a strong, non-default value in production."
            )
        if self.is_production and "*" in self.cors_origins:
            raise ValueError(
                "CORS_ORIGINS must not be '*' in production; set an explicit allowlist."
            )
        return self


settings = Settings()
