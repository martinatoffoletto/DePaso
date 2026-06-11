"""
API router aggregation.
Includes all module routers with /api/v1 prefix.
"""
from fastapi import APIRouter

from src.app.modules.auth.router import router as auth_router
from src.app.modules.users.router import router as users_router
from src.app.modules.carriers.router import router as carriers_router
from src.app.modules.packages.router import router as packages_router
from src.app.modules.shipments.router import router as shipments_router
from src.app.modules.matching.router import router as matching_router
from src.app.modules.routes.router import router as routes_router
from src.app.modules.co2.router import router as co2_router

router = APIRouter(prefix="/api/v1")

# Include module routers
router.include_router(auth_router)
router.include_router(users_router)
router.include_router(carriers_router)
router.include_router(packages_router)
router.include_router(shipments_router)
router.include_router(matching_router)
router.include_router(routes_router)
router.include_router(co2_router)

# TODO: Include remaining module routers when implemented:
# from src.app.modules.vision.router import router as vision_router
# from src.app.modules.tracking.router import router as tracking_router
# from src.app.modules.freight.router import router as freight_router
# router.include_router(vision_router)
# router.include_router(tracking_router)
# router.include_router(freight_router)
