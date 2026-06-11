"""
Matching module API router.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from src.app.core.database import get_db
from src.app.modules.matching.service import MatchingService
from src.app.modules.matching.schemas import CarrierScoreResponse, MatchingResponse
from src.app.modules.shipments.repository import ShipmentRepository
from src.app.modules.carriers.repository import CarrierRepository
from src.app.modules.routes.repository import RouteRepository
from src.app.modules.shipments.exceptions import ShipmentNotFoundError

router = APIRouter(prefix="/matching", tags=["matching"])


def get_matching_service(db: Session = Depends(get_db)) -> MatchingService:
    return MatchingService(
        shipment_repo=ShipmentRepository(db),
        carrier_repo=CarrierRepository(db),
        route_repo=RouteRepository(db),
    )


@router.get("/{shipment_id}/ranked", response_model=list[CarrierScoreResponse])
async def rank_carriers(
    shipment_id: int,
    top_k: int = 5,
    service: MatchingService = Depends(get_matching_service),
):
    """Get ranked carriers for a shipment by matching score."""
    try:
        return service.rank_carriers(shipment_id, top_k=top_k)
    except ShipmentNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shipment not found")


@router.post("/{shipment_id}/match", response_model=MatchingResponse)
async def match_best_carrier(
    shipment_id: int,
    service: MatchingService = Depends(get_matching_service),
):
    """Find and return the best carrier match for a shipment."""
    try:
        return service.match_best(shipment_id)
    except ShipmentNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shipment not found")
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(e))
