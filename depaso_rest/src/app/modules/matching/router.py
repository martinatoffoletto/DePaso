"""
Matching module API router.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from src.app.core.database import get_db
from src.app.modules.admin.router import require_admin
from src.app.modules.carriers.repository import CarrierRepository
from src.app.modules.matching.repository import MatchingWeightsRepository
from src.app.modules.matching.schemas import (
    CarrierScoreResponse,
    MatchingResponse,
    WeightsResponse,
    WeightsUpdateRequest,
)
from src.app.modules.matching.service import DEFAULT_WEIGHTS, MatchingService
from src.app.modules.routes.repository import RouteRepository
from src.app.modules.shipments.exceptions import ShipmentNotFoundError
from src.app.modules.shipments.repository import ShipmentRepository
from src.app.modules.users.models import User

router = APIRouter(prefix="/matching", tags=["matching"])

WEIGHTS_SUM_TOLERANCE = 1e-6


def get_matching_service(db: Session = Depends(get_db)) -> MatchingService:
    weights = MatchingWeightsRepository(db).load(DEFAULT_WEIGHTS)
    return MatchingService(
        shipment_repo=ShipmentRepository(db),
        carrier_repo=CarrierRepository(db),
        route_repo=RouteRepository(db),
        weights=weights,
    )


@router.get("/weights", response_model=WeightsResponse)
async def get_weights(
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Current scoring weights — DB values over code defaults (RF-ADM)."""
    return WeightsResponse(**MatchingWeightsRepository(db).load(DEFAULT_WEIGHTS))


@router.patch("/weights", response_model=WeightsResponse)
async def update_weights(
    data: WeightsUpdateRequest,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Tune scoring weights without redeploy (admin). The set must sum to 1."""
    repo = MatchingWeightsRepository(db)
    updates = {k: v for k, v in data.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Provide at least one weight to update",
        )
    merged = repo.load(DEFAULT_WEIGHTS) | updates
    total = sum(merged.values())
    if abs(total - 1.0) > WEIGHTS_SUM_TOLERANCE:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Weights must sum to 1.0 (got {total:.4f})",
        )
    repo.save(updates)
    return WeightsResponse(**repo.load(DEFAULT_WEIGHTS))


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
