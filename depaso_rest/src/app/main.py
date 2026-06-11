"""
DePaso REST API - Main FastAPI application.
"""
from contextlib import asynccontextmanager
import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from src.app.core.config import settings
from src.app.shared.exceptions import DomainException
from src.app.shared.responses import ErrorResponse

# Import all module routers directly (no api/ aggregator needed)
from src.app.modules.auth.router import router as auth_router
from src.app.modules.users.router import router as users_router
from src.app.modules.carriers.router import router as carriers_router
from src.app.modules.packages.router import router as packages_router
from src.app.modules.shipments.router import router as shipments_router
from src.app.modules.matching.router import router as matching_router
from src.app.modules.co2.router import router as co2_router
from src.app.modules.vision.router import router as vision_router
from src.app.modules.tracking.router import router as tracking_router
from src.app.modules.freight.router import router as freight_router
from src.app.modules.routes.router import router as routes_router
from src.app.modules.admin.router import router as admin_router

logger = logging.getLogger(__name__)


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
    from src.app.shared.base_model import Base
    # Ensure all models are imported before creating tables
    from src.app.modules.users.models import User  # noqa: F401
    from src.app.modules.carriers.models import Carrier  # noqa: F401
    from src.app.modules.packages.models import Package  # noqa: F401
    from src.app.modules.shipments.models import Shipment, ShipmentEvent, Rating  # noqa: F401
    from src.app.modules.routes.models import CarrierRoute  # noqa: F401
    from src.app.modules.tracking.models import GpsTrace  # noqa: F401
    from src.app.modules.vision.models import Classification  # noqa: F401
    Base.metadata.create_all(bind=engine)
    logger.info("✅ Database tables initialized")

    # Load the cargo classifier (falls back to a stub when TF/model missing)
    from src.app.modules.vision.service import VisionService
    vision_service = VisionService(settings.vision_model_path)
    vision_service.load_model()
    app.state.classifier = vision_service
    
    yield
    
    # Shutdown
    logger.info("🛑 Shutting down DePaso REST API")
    # TODO: Cleanup model and database connections


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

    # CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Global exception handler for DomainException
    @app.exception_handler(DomainException)
    async def domain_exception_handler(request: Request, exc: DomainException):
        """Handle domain exceptions with consistent response format."""
        return JSONResponse(
            status_code=400,
            content=ErrorResponse(
                success=False,
                error=exc.message,
                code=exc.code,
                data=None,
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
    app.include_router(co2_router, prefix=api_prefix)
    app.include_router(vision_router, prefix=api_prefix)
    app.include_router(tracking_router, prefix=api_prefix)
    app.include_router(freight_router, prefix=api_prefix)
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
