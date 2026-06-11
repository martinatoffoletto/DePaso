"""
Carriers module API router.
Full CRUD endpoints for carrier management.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from src.app.core.database import get_db
from src.app.core.dependencies import CurrentUserId
from src.app.shared.exceptions import DomainException
from src.app.modules.carriers.schemas import (
    CarrierCreate,
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
from src.app.shared.enums import ShipmentStatus

router = APIRouter(prefix="/carriers", tags=["carriers"])


def get_carrier_service(db: Session = Depends(get_db)) -> CarrierService:
    """Dependency: get carrier service."""
    return CarrierService(CarrierRepository(db))


@router.post("", response_model=CarrierResponse, status_code=status.HTTP_201_CREATED)
async def create_carrier(
    data: CarrierCreate,
    service: CarrierService = Depends(get_carrier_service),
) -> CarrierResponse:
    """Create a new carrier profile."""
    try:
        carrier = service.create_carrier(
            user_id=data.user_id,
            company_name=data.company_name,
            vehicle_type=data.vehicle_type,
            license_plate=data.license_plate,
            capacity_kg=data.capacity_kg,
            capacity_volume_m3=data.capacity_volume_m3,
        )
        return CarrierResponse.model_validate(carrier)
    except DomainException as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=e.message)


@router.get("", response_model=list[CarrierResponse])
async def list_carriers(
    skip: int = 0,
    limit: int = 20,
    service: CarrierService = Depends(get_carrier_service),
) -> list[CarrierResponse]:
    """List all active and verified carriers."""
    carriers, _ = service.list_carriers(skip, limit)
    return [CarrierResponse.model_validate(c) for c in carriers]


def _my_carrier(user_id: int, db: Session):
    carrier = CarrierRepository(db).get_by_user_id(user_id)
    if not carrier:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail="User has no carrier profile")
    return carrier


@router.get("/me", response_model=CarrierResponse)
async def get_my_carrier(
    current_user_id: CurrentUserId,
    db: Session = Depends(get_db),
) -> CarrierResponse:
    """The current user's carrier profile."""
    return CarrierResponse.model_validate(_my_carrier(current_user_id, db))


@router.get("/me/feed", response_model=list[FeedItemResponse])
async def my_feed(
    current_user_id: CurrentUserId,
    db: Session = Depends(get_db),
) -> list[FeedItemResponse]:
    """Pending shipments compatible with this carrier (RF-MAT-03, RF-CAR-03)."""
    carrier = _my_carrier(current_user_id, db)
    matching = MatchingService(
        shipment_repo=ShipmentRepository(db),
        carrier_repo=CarrierRepository(db),
        route_repo=RouteRepository(db),
    )
    return matching.feed_for_carrier(carrier.id)


@router.get("/me/summary", response_model=CarrierSummaryResponse)
async def my_summary(
    current_user_id: CurrentUserId,
    db: Session = Depends(get_db),
) -> CarrierSummaryResponse:
    """Carrier history: deliveries, earnings, reputation, CO2 (RF-CAR-06)."""
    carrier = _my_carrier(current_user_id, db)
    shipments, _ = ShipmentRepository(db).list_by_carrier(carrier.id, skip=0, limit=1000)
    delivered = [s for s in shipments if s.status == ShipmentStatus.DELIVERED]
    active = [s for s in shipments if s.status in (
        ShipmentStatus.ASSIGNED, ShipmentStatus.PICKUP_ARRIVED, ShipmentStatus.IN_TRANSIT
    )]
    return CarrierSummaryResponse(
        carrier_id=carrier.id,
        reputation=carrier.reputation or 5.0,
        deliveries_completed=len(delivered),
        active_shipments=len(active),
        total_earnings=round(sum(s.estimated_price or 0 for s in delivered), 2),
        total_co2_saved_kg=round(sum(s.co2_savings_kg or 0 for s in delivered), 3),
    )


@router.get("/{carrier_id}", response_model=CarrierResponse)
async def get_carrier(
    carrier_id: int,
    service: CarrierService = Depends(get_carrier_service),
) -> CarrierResponse:
    """Get a carrier by ID."""
    try:
        carrier = service.get_carrier_by_id(carrier_id)
        return CarrierResponse.model_validate(carrier)
    except DomainException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=e.message)


@router.get("/user/{user_id}", response_model=CarrierResponse)
async def get_carrier_by_user(
    user_id: int,
    service: CarrierService = Depends(get_carrier_service),
) -> CarrierResponse:
    """Get carrier profile by user ID."""
    try:
        carrier = service.get_carrier_by_user_id(user_id)
        return CarrierResponse.model_validate(carrier)
    except DomainException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=e.message)


@router.patch("/{carrier_id}", response_model=CarrierResponse)
async def update_carrier(
    carrier_id: int,
    data: CarrierUpdate,
    service: CarrierService = Depends(get_carrier_service),
) -> CarrierResponse:
    """Update carrier information."""
    try:
        updates = data.model_dump(exclude_unset=True)
        carrier = service.update_carrier(carrier_id, **updates)
        return CarrierResponse.model_validate(carrier)
    except DomainException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=e.message)


@router.delete("/{carrier_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_carrier(
    carrier_id: int,
    service: CarrierService = Depends(get_carrier_service),
) -> None:
    """Deactivate a carrier (soft delete)."""
    try:
        service.update_carrier(carrier_id, is_active=False)
    except DomainException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=e.message)


@router.post("/{carrier_id}/reputation", response_model=CarrierResponse)
async def update_reputation(
    carrier_id: int,
    rating: float,
    service: CarrierService = Depends(get_carrier_service),
) -> CarrierResponse:
    """Update carrier reputation score."""
    try:
        carrier = service.update_reputation(carrier_id, rating)
        return CarrierResponse.model_validate(carrier)
    except DomainException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=e.message)
