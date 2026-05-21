"""
Shipments module API router.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from src.app.core.database import get_db
from src.app.core.dependencies import CurrentUserId
from src.app.shared.exceptions import DomainException
from src.app.modules.shipments.schemas import ShipmentCreate, ShipmentResponse
from src.app.modules.shipments.service import ShipmentService
from src.app.modules.shipments.repository import ShipmentRepository

router = APIRouter(prefix="/shipments", tags=["shipments"])

def get_shipment_service(db: Session = Depends(get_db)) -> ShipmentService:
    return ShipmentService(ShipmentRepository(db))

@router.post("", response_model=ShipmentResponse, status_code=status.HTTP_201_CREATED)
async def create_shipment(
    data: ShipmentCreate,
    current_user_id: CurrentUserId,
    service: ShipmentService = Depends(get_shipment_service),
):
    try:
        # Override client_id with current_user_id for safety
        shipment = service.create_shipment(
            client_id=current_user_id,
            package_size=data.package_size,
            modality=data.modality,
            assignment_mode=data.assignment_mode,
            origin_lat=data.origin_lat,
            origin_lon=data.origin_lon,
            destination_lat=data.destination_lat,
            destination_lon=data.destination_lon,
            weight_kg=data.weight_kg,
            photo_url=data.photo_url,
        )
        return ShipmentResponse.model_validate(shipment)
    except DomainException as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=e.message)

@router.get("", response_model=list[ShipmentResponse])
async def list_my_shipments(
    current_user_id: CurrentUserId,
    skip: int = 0,
    limit: int = 20,
    service: ShipmentService = Depends(get_shipment_service),
):
    # Depending on user type, this should return client shipments or carrier assigned shipments.
    # For now, return client shipments.
    shipments, _ = service.list_shipments_by_client(current_user_id, skip, limit)
    return [ShipmentResponse.model_validate(s) for s in shipments]

@router.get("/available", response_model=list[ShipmentResponse])
async def list_available_shipments(
    service: ShipmentService = Depends(get_shipment_service),
):
    shipments = service.list_pending()
    return [ShipmentResponse.model_validate(s) for s in shipments]

@router.get("/{shipment_id}", response_model=ShipmentResponse)
async def get_shipment(
    shipment_id: int,
    service: ShipmentService = Depends(get_shipment_service),
):
    try:
        shipment = service.get_shipment_by_id(shipment_id)
        return ShipmentResponse.model_validate(shipment)
    except DomainException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=e.message)

@router.patch("/{shipment_id}/status", response_model=ShipmentResponse)
async def update_status(
    shipment_id: int,
    new_status: str,
    service: ShipmentService = Depends(get_shipment_service),
):
    try:
        shipment = service.update_status(shipment_id, new_status)
        return ShipmentResponse.model_validate(shipment)
    except DomainException as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=e.message)

@router.patch("/{shipment_id}/assign", response_model=ShipmentResponse)
async def assign_carrier(
    shipment_id: int,
    carrier_id: int,
    service: ShipmentService = Depends(get_shipment_service),
):
    try:
        shipment = service.assign_carrier(shipment_id, carrier_id)
        return ShipmentResponse.model_validate(shipment)
    except DomainException as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=e.message)
