"""
Carriers module API router.
Full CRUD endpoints for carrier management.
"""
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.app.core.database import get_db
from src.app.core.dependencies import AdminUserId, CurrentUserId
from src.app.modules.carriers.exceptions import CarrierNotFoundError
from src.app.shared.exceptions import AlreadyExistsError, NotFoundError
from src.app.modules.carriers.schemas import (
    CarrierProfileCreate,
    CarrierRatingResponse,
    CarrierResponse,
    CarrierSummaryResponse,
    CarrierUpdate,
)
from src.app.modules.carriers.service import CarrierService
from src.app.modules.carriers.repository import CarrierRepository
from src.app.modules.matching.schemas import FeedItemResponse
from src.app.modules.matching.service import MatchingService
from src.app.modules.shipments.repository import ShipmentRepository
from src.app.modules.routes.repository import RouteRepository

router = APIRouter(prefix="/carriers", tags=["carriers"])


def get_carrier_service(db: AsyncSession = Depends(get_db)) -> CarrierService:
    """Dependency: get carrier service."""
    return CarrierService(CarrierRepository(db))


# El alta de carrier es self-service: POST /carriers/me (user_id del JWT).
# No hay POST /carriers con user_id arbitrario — permitía crear un perfil
# a nombre de cualquier usuario.


@router.get("", response_model=list[CarrierResponse])
async def list_carriers(
    _user: CurrentUserId,
    skip: int = 0,
    limit: int = 20,
    service: CarrierService = Depends(get_carrier_service),
) -> list[CarrierResponse]:
    """List all active and verified carriers (requiere sesión)."""
    carriers, _ = await service.list_carriers(skip, limit)
    return [CarrierResponse.model_validate(c) for c in carriers]


async def _my_carrier(user_id: int, db: AsyncSession):
    carrier = await CarrierRepository(db).get_by_user_id(user_id)
    if not carrier:
        raise NotFoundError("Carrier profile", code="NO_CARRIER_PROFILE")
    return carrier


@router.get("/me", response_model=CarrierResponse)
async def get_my_carrier(
    current_user_id: CurrentUserId,
    db: AsyncSession = Depends(get_db),
) -> CarrierResponse:
    """The current user's carrier profile."""
    return CarrierResponse.model_validate(await _my_carrier(current_user_id, db))


@router.post("/me", response_model=CarrierResponse, status_code=status.HTTP_201_CREATED)
async def create_my_carrier(
    data: CarrierProfileCreate,
    current_user_id: CurrentUserId,
    service: CarrierService = Depends(get_carrier_service),
) -> CarrierResponse:
    """Create a carrier profile for the current user (role switching, RF-USR-06).

    user_id is taken from the JWT, not the body, so a client can't create a
    profile for someone else.
    """
    try:
        await service.get_carrier_by_user_id(current_user_id)
    except CarrierNotFoundError:
        pass
    else:
        # La constraint única de carriers.user_id respalda esto ante una race.
        raise AlreadyExistsError("Carrier profile", code="CARRIER_PROFILE_EXISTS")
    carrier = await service.create_carrier(
        user_id=current_user_id,
        company_name=data.company_name,
        vehicle_type=data.vehicle_type,
        license_plate=data.license_plate,
        capacity_kg=data.capacity_kg,
        capacity_volume_m3=data.capacity_volume_m3,
    )
    return CarrierResponse.model_validate(carrier)


@router.patch("/me", response_model=CarrierResponse)
async def update_my_carrier(
    data: CarrierUpdate,
    current_user_id: CurrentUserId,
    service: CarrierService = Depends(get_carrier_service),
    db: AsyncSession = Depends(get_db),
) -> CarrierResponse:
    """Update current user's carrier information."""
    carrier = await _my_carrier(current_user_id, db)
    updates = data.model_dump(exclude_unset=True)
    updated_carrier = await service.update_profile(
        carrier, updates, shipment_repo=ShipmentRepository(db)
    )
    return CarrierResponse.model_validate(updated_carrier)


@router.get("/me/feed", response_model=list[FeedItemResponse])
async def my_feed(
    current_user_id: CurrentUserId,
    db: AsyncSession = Depends(get_db),
) -> list[FeedItemResponse]:
    """Pending shipments compatible with this carrier (RF-MAT-03, RF-CAR-03)."""
    carrier = await _my_carrier(current_user_id, db)
    from src.app.modules.matching.repository import MatchingWeightsRepository
    from src.app.modules.matching.service import DEFAULT_WEIGHTS
    weights = await MatchingWeightsRepository(db).load(DEFAULT_WEIGHTS)
    
    matching = MatchingService(
        shipment_repo=ShipmentRepository(db),
        carrier_repo=CarrierRepository(db),
        route_repo=RouteRepository(db),
        weights=weights,
    )
    return await matching.feed_for_carrier(carrier.id)


@router.get("/me/summary", response_model=CarrierSummaryResponse)
async def my_summary(
    current_user_id: CurrentUserId,
    db: AsyncSession = Depends(get_db),
) -> CarrierSummaryResponse:
    """Carrier history: deliveries, earnings, reputation, CO2 (RF-CAR-06)."""
    carrier = await _my_carrier(current_user_id, db)
    summary = await CarrierService(CarrierRepository(db)).summary(carrier.id, ShipmentRepository(db))
    return CarrierSummaryResponse(**summary)


@router.get("/me/ratings", response_model=list[CarrierRatingResponse])
async def my_ratings(
    current_user_id: CurrentUserId,
    db: AsyncSession = Depends(get_db),
) -> list[CarrierRatingResponse]:
    """Reviews received by the current carrier (RF-SHP-08), newest first."""
    carrier = await _my_carrier(current_user_id, db)
    ratings = await ShipmentRepository(db).list_ratings_by_carrier(carrier.id)
    return [CarrierRatingResponse.model_validate(r) for r in ratings]


# La ventana de disponibilidad (BY_AVAILABILITY, RF-CAR-02) se publica con
# POST /routes {kind: "dedicated_window"} — que es lo que usa el front. El
# alias POST /me/availability duplicaba ese flujo y se eliminó.


@router.get("/{carrier_id}", response_model=CarrierResponse)
async def get_carrier(
    carrier_id: int,
    _user: CurrentUserId,
    service: CarrierService = Depends(get_carrier_service),
) -> CarrierResponse:
    """Get a carrier by ID (requiere sesión)."""
    carrier = await service.get_carrier_by_id(carrier_id)
    return CarrierResponse.model_validate(carrier)


@router.get("/user/{user_id}", response_model=CarrierResponse)
async def get_carrier_by_user(
    user_id: int,
    _user: CurrentUserId,
    service: CarrierService = Depends(get_carrier_service),
) -> CarrierResponse:
    """Get carrier profile by user ID (requiere sesión)."""
    carrier = await service.get_carrier_by_user_id(user_id)
    return CarrierResponse.model_validate(carrier)


# -- admin-only ---------------------------------------------------------------
# La reputación NO se setea por API: se recalcula sola desde los ratings
# (ver ShipmentService.rate_shipment). Un endpoint para escribirla a mano
# dejaba que cualquiera se pusiera 5.0.

@router.patch("/{carrier_id}", response_model=CarrierResponse)
async def update_carrier(
    carrier_id: int,
    data: CarrierUpdate,
    _admin: AdminUserId,
    service: CarrierService = Depends(get_carrier_service),
) -> CarrierResponse:
    """Update carrier by id (admin). El carrier se edita a sí mismo por PATCH /me."""
    updates = data.model_dump(exclude_unset=True)
    carrier = await service.get_carrier_by_id(carrier_id)
    updated = await service.update_profile(carrier, updates)
    return CarrierResponse.model_validate(updated)


@router.delete("/{carrier_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_carrier(
    carrier_id: int,
    _admin: AdminUserId,
    service: CarrierService = Depends(get_carrier_service),
) -> None:
    """Deactivate a carrier (admin, soft delete)."""
    await service.update_carrier(carrier_id, is_active=False)
