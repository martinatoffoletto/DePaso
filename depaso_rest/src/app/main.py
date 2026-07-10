"""
DePaso REST API - Main FastAPI application.
"""
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from sqlalchemy.exc import IntegrityError

from src.app.core.config import settings
from src.app.core.limiter import limiter
from src.app.modules.admin.router import router as admin_router

# Import all module routers directly (no api/ aggregator needed)
from src.app.modules.auth.router import router as auth_router
from src.app.modules.carriers.router import router as carriers_router
from src.app.modules.co2.router import router as co2_router
from src.app.modules.matching.router import router as matching_router
from src.app.modules.organizations.router import router as organizations_router
from src.app.modules.packages.router import router as packages_router
from src.app.modules.routes.router import router as routes_router
from src.app.modules.shipments.router import router as shipments_router
from src.app.modules.tracking.router import router as tracking_router
from src.app.modules.users.router import router as users_router
from src.app.modules.vision.router import router as vision_router
from src.app.shared.exceptions import (
    AlreadyExistsError,
    DomainException,
    ForbiddenError,
    NotFoundError,
    UnauthorizedError,
    ValidationError,
)
from src.app.shared.responses import ErrorResponse

logger = logging.getLogger(__name__)

# Domain exception class → HTTP status. Order matters: subclasses first.
_STATUS_BY_EXCEPTION: list[tuple[type[DomainException], int]] = [
    (NotFoundError, 404),
    (AlreadyExistsError, 409),
    (UnauthorizedError, 401),
    (ForbiddenError, 403),
    (ValidationError, 400),
]


def _status_for(exc: DomainException) -> int:
    for exc_type, status_code in _STATUS_BY_EXCEPTION:
        if isinstance(exc, exc_type):
            return status_code
    return 400


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context manager for startup and shutdown events.
    
    Startup:
    - Load TensorFlow/Keras model for vision module
    - Initialize database connections
    - Log startup information
    
    Shutdown:
    - Close database connections
    - Release model resources
    """
    # Startup
    logger.info("🚀 Starting DePaso REST API")
    logger.info(f"Environment: {settings.environment}")
    logger.info(f"Debug: {settings.debug}")

    # Initialize database tables
    from src.app.core.database import engine
    from src.app.modules.auth.models import PasswordResetToken  # noqa: F401
    from src.app.modules.carriers.models import Carrier  # noqa: F401
    from src.app.modules.matching.models import MatchingWeight  # noqa: F401
    from src.app.modules.organizations.models import (  # noqa: F401
        Organization,
        OrganizationCarrier,
        OrganizationMember,
    )
    from src.app.modules.packages.models import Package  # noqa: F401
    from src.app.modules.routes.models import CarrierRoute  # noqa: F401
    from src.app.modules.shipments.models import Rating, Shipment, ShipmentEvent  # noqa: F401
    from src.app.modules.tracking.models import GpsTrace  # noqa: F401

    # Ensure all models are imported before creating tables
    from src.app.modules.users.models import User  # noqa: F401
    from src.app.modules.vision.models import Classification  # noqa: F401
    from src.app.shared.base_model import Base

    async with engine.begin() as conn:
        if engine.dialect.name == "postgresql":
            # Once at boot (antes corría en CADA conexión del pool).
            from sqlalchemy import text
            try:
                await conn.execute(text("CREATE EXTENSION IF NOT EXISTS postgis"))
            except Exception:
                logger.info("PostGIS extension not available (ok: matching usa haversine)")
        await conn.run_sync(Base.metadata.create_all)
    logger.info("✅ Database tables initialized")

    # Load the cargo classifier (falls back to a stub when TF/model missing)
    from src.app.modules.vision.service import VisionService
    vision_service = VisionService(settings.vision_model_path)
    vision_service.load_model()
    app.state.classifier = vision_service

    yield

    # Shutdown: release the loaded model and dispose the DB connection pool.
    logger.info("🛑 Shutting down DePaso REST API")
    app.state.classifier = None
    await engine.dispose()


def create_app() -> FastAPI:
    """Create and configure FastAPI application."""
    app = FastAPI(
        title="DePaso REST API",
        description="Collaborative urban logistics platform",
        version="0.1.0",
        docs_url="/api/v1/docs",
        redoc_url="/api/v1/redoc",
        openapi_url="/api/v1/openapi.json",
        lifespan=lifespan,
    )

    # Rate limiting (RNF-SEC-06): 5 req/min on /auth/login y /auth/register
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

    # CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Global exception handlers — services raise domain exceptions and the
    # translation to HTTP happens here, once. Routers must not catch these.
    @app.exception_handler(DomainException)
    async def domain_exception_handler(request: Request, exc: DomainException):
        return JSONResponse(
            status_code=_status_for(exc),
            content=ErrorResponse(error=exc.message, detail=exc.message, code=exc.code).model_dump(),
        )

    @app.exception_handler(IntegrityError)
    async def integrity_error_handler(request: Request, exc: IntegrityError):
        # Red de seguridad para races que los checks de aplicación no vieron:
        # el UNIQUE de la DB es la última línea de defensa (email duplicado,
        # doble perfil de carrier, doble rating). 409, no 500.
        logger.warning("integrity_conflict", exc_info=exc)
        return JSONResponse(
            status_code=409,
            content=ErrorResponse(
                error="Resource already exists or conflicts with existing data",
                detail="Resource already exists or conflicts with existing data",
                code="CONFLICT",
            ).model_dump(),
        )

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception):
        # Log the full traceback server-side; never leak internals to the client.
        logger.exception("unhandled_error", exc_info=exc)
        return JSONResponse(
            status_code=500,
            content=ErrorResponse(
                error="Internal server error",
                detail="Internal server error",
                code="INTERNAL_ERROR",
            ).model_dump(),
        )

    # Health check endpoint
    @app.get("/api/v1/health", tags=["health"])
    async def health_check():
        """Health check endpoint."""
        return {
            "status": "healthy",
            "service": "depaso-rest-api",
            "version": "0.1.0",
        }

    # Include all module routers with v1 prefix
    api_prefix = "/api/v1"
    app.include_router(auth_router, prefix=api_prefix)
    app.include_router(users_router, prefix=api_prefix)
    app.include_router(carriers_router, prefix=api_prefix)
    app.include_router(packages_router, prefix=api_prefix)
    app.include_router(shipments_router, prefix=api_prefix)
    app.include_router(matching_router, prefix=api_prefix)
    app.include_router(organizations_router, prefix=api_prefix)
    app.include_router(co2_router, prefix=api_prefix)
    app.include_router(vision_router, prefix=api_prefix)
    app.include_router(tracking_router, prefix=api_prefix)
    app.include_router(routes_router, prefix=api_prefix)
    app.include_router(admin_router, prefix=api_prefix)

    logger.info("✅ FastAPI application configured")
    return app


# Create the application instance
app = create_app()

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "src.app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.debug,
        log_level="info",
    )
