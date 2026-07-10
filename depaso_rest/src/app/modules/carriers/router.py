"""
Carriers module API router.
Full CRUD endpoints for carrier management.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.app.core.database import get_db
from src.app.core.dependencies import CurrentUserId
from src.app.modules.carriers.exceptions import CarrierNotFoundError
from src.app.modules.carriers.schemas import (
    AvailabilityWindowRequest,
    CarrierCreate,
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
from src.app.modules.routes.schemas import RouteCreateRequest, RouteResponse
from src.app.modules.routes.service import RouteService

router = APIRouter(prefix="/carriers", tags=["carriers"])


def get_carrier_service(db: AsyncSession = Depends(get_db)) -> CarrierService:
    """Dependency: get carrier service."""
    return CarrierService(CarrierRepository(db))


@router.post("", response_model=CarrierResponse, status_code=status.HTTP_201_CREATED)
async def create_carrier(
    data: CarrierCreate,
    service: CarrierService = Depends(get_carrier_service),
) -> CarrierResponse:
    """Create a new carrier profile."""
    carrier = await service.create_carrier(
        user_id=data.user_id,
        company_name=data.company_name,
        vehicle_type=data.vehicle_type,
        license_plate=data.license_plate,
        capacity_kg=data.capacity_kg,
        capacity_volume_m3=data.capacity_volume_m3,
    )
    return CarrierResponse.model_validate(carrier)


@router.get("", response_model=list[CarrierResponse])
async def list_carriers(
    skip: int = 0,
    limit: int = 20,
    service: CarrierService = Depends(get_carrier_service),
) -> list[CarrierResponse]:
    """List all active and verified carriers."""
    carriers, _ = await service.list_carriers(skip, limit)
    return [CarrierResponse.model_validate(c) for c in carriers]


async def _my_carrier(user_id: int, db: AsyncSession):
    carrier = await CarrierRepository(db).get_by_user_id(user_id)
    if not carrier:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail="User has no carrier profile")
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
        raise HTTPException(status_code=status.HTTP_409_CONFLICT,
                            detail="This user already has a carrier profile.")
    except CarrierNotFoundError:
        pass
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
    updated_carrier = await service.update_carrier(carrier.id, **updates)
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
    ratings = ShipmentRepository(db).list_ratings_by_carrier(carrier.id)
    return [CarrierRatingResponse.model_validate(r) for r in ratings]


@router.post("/me/availability", response_model=RouteResponse, status_code=status.HTTP_201_CREATED)
async def register_availability_window(
    data: AvailabilityWindowRequest,
    current_user_id: CurrentUserId,
    db: AsyncSession = Depends(get_db),
) -> RouteResponse:
    """Register a habitual availability window for BY_AVAILABILITY matching (RF-CAR-02).

    Creates a `dedicated_window` entry in carrier_routes so the matching engine
    can assign dedicated shipments whose request time falls within this window.
    Use `POST /routes` directly if you need finer control (e.g., updating an
    existing window or registering a collaborative route).
    """
    carrier = await _my_carrier(current_user_id, db)
    route_data = RouteCreateRequest(
        kind="dedicated_window",
        origin_lat=data.origin_lat,
        origin_lon=data.origin_lon,
        window_start=data.window_start,
        window_end=data.window_end,
        recurrence_days=data.recurrence_days,
    )
    service = RouteService(
        route_repo=RouteRepository(db),
        carrier_repo=CarrierRepository(db),
    )
    return await service.publish(carrier.id, route_data)


@router.get("/{carrier_id}", response_model=CarrierResponse)
async def get_carrier(
    carrier_id: int,
    service: CarrierService = Depends(get_carrier_service),
) -> CarrierResponse:
    """Get a carrier by ID."""
    carrier = await service.get_carrier_by_id(carrier_id)
    return CarrierResponse.model_validate(carrier)


@router.get("/user/{user_id}", response_model=CarrierResponse)
async def get_carrier_by_user(
    user_id: int,
    service: CarrierService = Depends(get_carrier_service),
) -> CarrierResponse:
    """Get carrier profile by user ID."""
    carrier = await service.get_carrier_by_user_id(user_id)
    return CarrierResponse.model_validate(carrier)


@router.patch("/{carrier_id}", response_model=CarrierResponse)
async def update_carrier(
    carrier_id: int,
    data: CarrierUpdate,
    service: CarrierService = Depends(get_carrier_service),
) -> CarrierResponse:
    """Update carrier information."""
    updates = data.model_dump(exclude_unset=True)
    carrier = await service.update_carrier(carrier_id, **updates)
    return CarrierResponse.model_validate(carrier)


@router.delete("/{carrier_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_carrier(
    carrier_id: int,
    service: CarrierService = Depends(get_carrier_service),
) -> None:
    """Deactivate a carrier (soft delete)."""
    await service.update_carrier(carrier_id, is_active=False)


@router.post("/{carrier_id}/reputation", response_model=CarrierResponse)
async def update_reputation(
    carrier_id: int,
    rating: float,
    service: CarrierService = Depends(get_carrier_service),
) -> CarrierResponse:
    """Update carrier reputation score."""
    carrier = await service.update_reputation(carrier_id, rating)
    return CarrierResponse.model_validate(carrier)
