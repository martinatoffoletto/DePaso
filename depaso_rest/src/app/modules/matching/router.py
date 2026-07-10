"""
Matching module API router.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.app.core.database import get_db
from src.app.core.dependencies import AdminUserId
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
from src.app.modules.shipments.repository import ShipmentRepository

router = APIRouter(prefix="/matching", tags=["matching"])

WEIGHTS_SUM_TOLERANCE = 1e-6


async def get_matching_service(db: AsyncSession = Depends(get_db)) -> MatchingService:
    weights = await MatchingWeightsRepository(db).load(DEFAULT_WEIGHTS)
    return MatchingService(
        shipment_repo=ShipmentRepository(db),
        carrier_repo=CarrierRepository(db),
        route_repo=RouteRepository(db),
        weights=weights,
    )


@router.get("/weights", response_model=WeightsResponse)
async def get_weights(
    _admin: AdminUserId,
    db: AsyncSession = Depends(get_db),
):
    """Current scoring weights — DB values over code defaults (RF-ADM)."""
    return WeightsResponse(**await MatchingWeightsRepository(db).load(DEFAULT_WEIGHTS))


@router.patch("/weights", response_model=WeightsResponse)
async def update_weights(
    data: WeightsUpdateRequest,
    _admin: AdminUserId,
    db: AsyncSession = Depends(get_db),
):
    """Tune scoring weights without redeploy (admin). The set must sum to 1."""
    repo = MatchingWeightsRepository(db)
    updates = {k: v for k, v in data.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Provide at least one weight to update",
        )
    merged = await repo.load(DEFAULT_WEIGHTS) | updates
    total = sum(merged.values())
    if abs(total - 1.0) > WEIGHTS_SUM_TOLERANCE:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Weights must sum to 1.0 (got {total:.4f})",
        )
    await repo.save(updates)
    return WeightsResponse(**await repo.load(DEFAULT_WEIGHTS))


# Inspección del matching (ranking completo con scores, patentes y ubicaciones
# de TODOS los candidatos) -> admin-only. El flujo de usuario no lo usa: el
# carrier ve ofertas por GET /carriers/me/feed. Antes estaban SIN autenticación,
# exponiendo datos de todos los carriers a cualquiera.

@router.get("/{shipment_id}/ranked", response_model=list[CarrierScoreResponse])
async def rank_carriers(
    shipment_id: int,
    _admin: AdminUserId,
    top_k: int = 5,
    service: MatchingService = Depends(get_matching_service),
):
    """Ranked carriers for a shipment by matching score (admin/inspección)."""
    return await service.rank_carriers(shipment_id, top_k=top_k)


@router.post("/{shipment_id}/match", response_model=MatchingResponse)
async def match_best_carrier(
    shipment_id: int,
    _admin: AdminUserId,
    service: MatchingService = Depends(get_matching_service),
):
    """Best carrier match for a shipment (admin/inspección)."""
    return await service.match_best(shipment_id)
