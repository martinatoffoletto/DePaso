"""
Routes module API router.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from src.app.core.database import get_db
from src.app.core.dependencies import CurrentUserId
from src.app.modules.carriers.repository import CarrierRepository
from src.app.modules.routes.repository import RouteRepository
from src.app.modules.routes.schemas import RouteCreateRequest, RouteResponse, RouteUpdate
from src.app.modules.routes.service import RouteService

router = APIRouter(prefix="/routes", tags=["routes"])


def get_route_service(db: Session = Depends(get_db)) -> RouteService:
    return RouteService(
        route_repo=RouteRepository(db),
        carrier_repo=CarrierRepository(db),
    )


def _get_carrier_id(user_id: int, db: Session) -> int:
    carrier = CarrierRepository(db).get_by_user_id(user_id)
    if not carrier:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User has no carrier profile",
        )
    return carrier.id


@router.post("", response_model=RouteResponse, status_code=status.HTTP_201_CREATED)
async def publish_route(
    data: RouteCreateRequest,
    user_id: CurrentUserId,
    db: Session = Depends(get_db),
    service: RouteService = Depends(get_route_service),
):
    """Publish a collaborative route (RF-CAR-01) or dedicated window (RF-CAR-02)."""
    carrier_id = _get_carrier_id(user_id, db)
    try:
        return service.publish(carrier_id, data)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(e))


@router.get("/mine", response_model=list[RouteResponse])
async def my_routes(
    user_id: CurrentUserId,
    db: Session = Depends(get_db),
    service: RouteService = Depends(get_route_service),
):
    """List routes published by the current carrier."""
    carrier_id = _get_carrier_id(user_id, db)
    return service.list_for_carrier(carrier_id)


@router.patch("/{route_id}", response_model=RouteResponse)
async def update_route(
    route_id: int,
    data: RouteUpdate,
    user_id: CurrentUserId,
    db: Session = Depends(get_db),
    service: RouteService = Depends(get_route_service),
):
    """Update a route owned by the current carrier."""
    carrier_id = _get_carrier_id(user_id, db)
    try:
        return service.update_route(carrier_id, route_id, data.model_dump(exclude_unset=True))
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.delete("/{route_id}", status_code=status.HTTP_204_NO_CONTENT)
async def deactivate_route(
    route_id: int,
    user_id: CurrentUserId,
    db: Session = Depends(get_db),
    service: RouteService = Depends(get_route_service),
):
    """Deactivate a route owned by the current carrier."""
    carrier_id = _get_carrier_id(user_id, db)
    try:
        service.deactivate(carrier_id, route_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
