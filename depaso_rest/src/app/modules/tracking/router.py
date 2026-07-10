"""
Tracking module API router.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.app.core.database import get_db
from src.app.core.dependencies import CurrentUserId
from src.app.modules.tracking.schemas import PositionPublish, PositionResponse, TraceResponse
from src.app.modules.tracking.service import TrackingService
from src.app.modules.tracking.repository import TrackingRepository
from src.app.modules.carriers.repository import CarrierRepository
from src.app.modules.shipments.repository import ShipmentRepository

router = APIRouter(prefix="/tracking", tags=["tracking"])


def get_tracking_service(db: AsyncSession = Depends(get_db)) -> TrackingService:
    return TrackingService(
        TrackingRepository(db),
        carrier_repo=CarrierRepository(db),
        shipment_repo=ShipmentRepository(db),
    )


@router.post("/position", status_code=status.HTTP_202_ACCEPTED)
async def publish_position(
    data: PositionPublish,
    current_user_id: CurrentUserId,
    db: AsyncSession = Depends(get_db),
    service: TrackingService = Depends(get_tracking_service),
):
    """Carrier publishes its GPS position every 15-30 s (RF-TRK-01)."""
    carrier = await CarrierRepository(db).get_by_user_id(current_user_id)
    if not carrier:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                            detail="User has no carrier profile")
    traced = await service.publish_position(carrier.id, data.lat, data.lon)
    return {"traced_shipments": traced}


@router.get("/{shipment_id}", response_model=PositionResponse | None)
async def shipment_location(
    shipment_id: int,
    current_user_id: CurrentUserId,
    service: TrackingService = Depends(get_tracking_service),
):
    """Latest carrier position for an active shipment — client polls this (RF-TRK-02)."""
    trace = await service.shipment_location(shipment_id, current_user_id)
    return PositionResponse.model_validate(trace) if trace else None


@router.get("/{shipment_id}/history", response_model=list[TraceResponse])
async def shipment_history(
    shipment_id: int,
    current_user_id: CurrentUserId,
    service: TrackingService = Depends(get_tracking_service),
):
    """Full GPS trace of a shipment for auditing (RF-TRK-03)."""
    traces = await service.shipment_history(shipment_id, current_user_id)
    return [TraceResponse.model_validate(t) for t in traces]
