"""
Shipments module API router.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.app.core.database import get_db
from src.app.core.dependencies import CurrentUserId
from src.app.shared.geo import Point
from src.app.modules.shipments import pricing
from src.app.modules.shipments.schemas import (
    AcceptRequest,
    AssignedCarrierResponse,
    PaymentResponse,
    QuoteRequest,
    QuoteResponse,
    RatingCreate,
    RatingResponse,
    ShipmentCreate,
    ShipmentEventResponse,
    ShipmentResponse,
    ShipmentUpdate,
    StatusUpdateRequest,
)
from src.app.modules.shipments.service import ShipmentService
from src.app.modules.shipments.repository import ShipmentRepository
from src.app.modules.carriers.repository import CarrierRepository
from src.app.modules.users.repository import UserRepository
from src.app.modules.routes.repository import RouteRepository
from src.app.modules.co2.service import CO2Service

router = APIRouter(prefix="/shipments", tags=["shipments"])


def get_shipment_service(db: AsyncSession = Depends(get_db)) -> ShipmentService:
    return ShipmentService(
        ShipmentRepository(db),
        carrier_repo=CarrierRepository(db),
        route_repo=RouteRepository(db),
        user_repo=UserRepository(db),
    )


async def _carrier_for_user(user_id: int, db: AsyncSession):
    carrier = await CarrierRepository(db).get_by_user_id(user_id)
    if not carrier:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                            detail="User has no carrier profile")
    return carrier


@router.post("/quote", response_model=QuoteResponse)
async def get_quote(data: QuoteRequest):
    """Price both modalities upfront — no hidden charges (survey finding #1)."""
    origin = Point(data.origin_lat, data.origin_lon)
    destination = Point(data.destination_lat, data.destination_lon)
    q = pricing.quote(origin, destination, data.package_size)
    # Optimistic CO2 estimate for the offer screen: a collaborative match with
    # zero detour saves the full dedicated trip emissions (reference vehicle).
    co2 = CO2Service().calculate_direct_emissions(q["distance_km"], pricing.QUOTE_VEHICLE)
    return QuoteResponse(**q, co2_savings_estimate_kg=round(co2, 3))


@router.post("", response_model=ShipmentResponse, status_code=status.HTTP_201_CREATED)
async def create_shipment(
    data: ShipmentCreate,
    current_user_id: CurrentUserId,
    service: ShipmentService = Depends(get_shipment_service),
):
    shipment = await service.create_shipment(
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
        description=data.description,
        declared_value=data.declared_value,
        recipient_name=data.recipient_name,
        recipient_phone=data.recipient_phone,
    )
    return ShipmentResponse.model_validate(shipment)


@router.patch("/{shipment_id}", response_model=ShipmentResponse)
async def update_shipment(
    shipment_id: int,
    data: ShipmentUpdate,
    current_user_id: CurrentUserId,
    service: ShipmentService = Depends(get_shipment_service),
):
    """Update a pending shipment."""
    shipment = await service.update_shipment(
        shipment_id=shipment_id,
        client_id=current_user_id,
        **data.model_dump(exclude_unset=True)
    )
    return ShipmentResponse.model_validate(shipment)


@router.get("", response_model=list[ShipmentResponse])
async def list_my_shipments(
    current_user_id: CurrentUserId,
    skip: int = 0,
    limit: int = 20,
    service: ShipmentService = Depends(get_shipment_service),
):
    """Shipments created by the current user (client history, RF-SHP)."""
    shipments, _ = await service.list_shipments_by_client(current_user_id, skip, limit)
    return [ShipmentResponse.model_validate(s) for s in shipments]


@router.get("/assigned", response_model=list[ShipmentResponse])
async def list_assigned_shipments(
    current_user_id: CurrentUserId,
    skip: int = 0,
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
    service: ShipmentService = Depends(get_shipment_service),
):
    """Shipments assigned to the current carrier (RF-CAR-06)."""
    carrier = await _carrier_for_user(current_user_id, db)
    shipments, _ = await service.list_shipments_by_carrier(carrier.id, skip, limit)
    return [ShipmentResponse.model_validate(s) for s in shipments]


@router.get("/{shipment_id}", response_model=ShipmentResponse)
async def get_shipment(
    shipment_id: int,
    current_user_id: CurrentUserId,
    service: ShipmentService = Depends(get_shipment_service),
):
    shipment = await service.get_shipment_for_user(shipment_id, current_user_id)
    return ShipmentResponse.model_validate(shipment)


@router.get("/{shipment_id}/events", response_model=list[ShipmentEventResponse])
async def get_shipment_events(
    shipment_id: int,
    current_user_id: CurrentUserId,
    service: ShipmentService = Depends(get_shipment_service),
):
    """Status timeline (audit trail, RF-TRK-03)."""
    events = await service.list_events(shipment_id, current_user_id)
    return [ShipmentEventResponse.model_validate(e) for e in events]


@router.get("/{shipment_id}/carrier", response_model=AssignedCarrierResponse)
async def get_assigned_carrier(
    shipment_id: int,
    current_user_id: CurrentUserId,
    service: ShipmentService = Depends(get_shipment_service),
):
    """Contact info of the carrier assigned to the shipment. Only the shipment's
    client or the carrier themselves may read it (the phone is private)."""
    contact = await service.get_assigned_carrier_contact(shipment_id, current_user_id)
    if contact is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail="No carrier assigned yet")
    return AssignedCarrierResponse(**contact)


@router.post("/{shipment_id}/status", response_model=ShipmentResponse)
async def update_status(
    shipment_id: int,
    data: StatusUpdateRequest,
    current_user_id: CurrentUserId,
    db: AsyncSession = Depends(get_db),
    service: ShipmentService = Depends(get_shipment_service),
):
    """Carrier advances the shipment through its milestones (RF-CAR-05)."""
    shipment = await service.get_shipment_by_id(shipment_id)
    carrier = await _carrier_for_user(current_user_id, db)
    if shipment.carrier_id != carrier.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                            detail="Shipment is not assigned to this carrier")
    updated = await service.update_status(shipment_id, data.new_status,
                                    actor_user_id=current_user_id,
                                    lat=data.lat, lon=data.lon)
    return ShipmentResponse.model_validate(updated)


@router.post("/{shipment_id}/pay", response_model=PaymentResponse)
async def pay_shipment(
    shipment_id: int,
    current_user_id: CurrentUserId,
    service: ShipmentService = Depends(get_shipment_service),
):
    """Client pays for the shipment (simulated pasarela). Returns the breakdown
    with the platform commission shown transparently (no hidden charges)."""
    shipment = await service.pay_shipment(shipment_id, current_user_id)
    amount = shipment.estimated_price or 0.0
    return PaymentResponse(
        shipment_id=shipment.id,
        payment_status=shipment.payment_status,
        amount=round(amount, 2),
        platform_fee=pricing.platform_fee(amount),
        carrier_payout=pricing.carrier_payout(amount),
        platform_commission_rate=pricing.PLATFORM_COMMISSION_RATE,
    )


@router.post("/{shipment_id}/cancel", response_model=ShipmentResponse)
async def cancel_shipment(
    shipment_id: int,
    current_user_id: CurrentUserId,
    service: ShipmentService = Depends(get_shipment_service),
):
    """Client cancels before pickup (RF-SHP-07)."""
    shipment = await service.cancel_shipment(shipment_id, current_user_id)
    return ShipmentResponse.model_validate(shipment)


@router.post("/{shipment_id}/accept", response_model=ShipmentResponse)
async def accept_shipment(
    shipment_id: int,
    data: AcceptRequest,
    current_user_id: CurrentUserId,
    db: AsyncSession = Depends(get_db),
    service: ShipmentService = Depends(get_shipment_service),
):
    """Carrier accepts a pending shipment (RF-CAR-03/04)."""
    carrier = await _carrier_for_user(current_user_id, db)
    shipment = await service.accept_shipment(shipment_id, carrier.id, route_id=data.route_id)
    return ShipmentResponse.model_validate(shipment)


@router.post("/{shipment_id}/carrier-cancel", response_model=ShipmentResponse)
async def carrier_cancel(
    shipment_id: int,
    current_user_id: CurrentUserId,
    db: AsyncSession = Depends(get_db),
    service: ShipmentService = Depends(get_shipment_service),
):
    """Carrier backs out after accepting — reputation penalty (RF-CAR-07)."""
    carrier = await _carrier_for_user(current_user_id, db)
    shipment = await service.carrier_cancel(shipment_id, carrier.id)
    return ShipmentResponse.model_validate(shipment)


@router.post("/{shipment_id}/rating", response_model=RatingResponse,
             status_code=status.HTTP_201_CREATED)
async def rate_shipment(
    shipment_id: int,
    data: RatingCreate,
    current_user_id: CurrentUserId,
    service: ShipmentService = Depends(get_shipment_service),
):
    """Client rates the carrier after delivery (RF-SHP-08)."""
    rating = await service.rate_shipment(shipment_id, current_user_id,
                                   stars=data.stars, comment=data.comment)
    return RatingResponse.model_validate(rating)
