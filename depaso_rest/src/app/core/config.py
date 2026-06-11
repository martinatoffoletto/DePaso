"""
Configuration module using Pydantic Settings v2.
Reads environment variables from .env file.
"""
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings from environment variables."""

    # Database — defaults to SQLite for local dev, set DATABASE_URL env var for PostgreSQL
    database_url: str = "sqlite:///./depaso_dev.db"  # Override con DATABASE_URL en .env

    # JWT
    jwt_secret_key: str = "your-secret-key-change-this"
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

    # CORS
    cors_origins: list[str] = [
        "http://localhost:3000",
        "http://localhost:8081",
        "http://localhost:8100",
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


settings = Settings()
