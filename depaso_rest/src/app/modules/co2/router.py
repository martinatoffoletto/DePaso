"""
CO2 module API router.
"""
from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from src.app.core.database import get_db
from src.app.core.dependencies import CurrentUserId
from src.app.modules.co2.schemas import (
    ClientImpactResponse,
    CO2EstimateRequest,
    CO2EstimateResponse,
    ImpactEquivalences,
)
from src.app.modules.co2.service import CO2Service
from src.app.modules.shipments.models import Shipment
from src.app.shared.enums import ShipmentModality, ShipmentStatus
from src.app.shared.geo import Point

router = APIRouter(prefix="/co2", tags=["co2"])

# Equivalence factors for the impact screen:
# - average car: 0.18 kg CO2/km (same factor as EMISSION_FACTORS[car])
# - one urban tree absorbs ~21 kg CO2/year (FAO/EPA commonly cited figure)
# - one full smartphone charge ~8 g CO2 (EPA greenhouse gas equivalencies)
CAR_KG_PER_KM = 0.18
TREE_KG_PER_YEAR = 21.0
SMARTPHONE_KG_PER_CHARGE = 0.008


@router.post("/estimate", response_model=CO2EstimateResponse)
async def estimate_savings(data: CO2EstimateRequest):
    """Estimate CO2 savings of a collaborative assignment (RF-CO2-01).

    Pure deterministic calculation — used by the offer screen to show the
    environmental benefit before confirming, and on completion to persist
    the final value on the shipment.
    """
    result = CO2Service().calculate_shipment_savings(
        route_origin=Point(data.route_origin_lat, data.route_origin_lon),
        route_destination=Point(data.route_destination_lat, data.route_destination_lon),
        pickup=Point(data.pickup_lat, data.pickup_lon),
        dropoff=Point(data.dropoff_lat, data.dropoff_lon),
        vehicle_type=data.vehicle_type,
        dedicated_vehicle_type=data.dedicated_vehicle_type,
    )
    return CO2EstimateResponse(**result)


@router.get("/me/summary", response_model=ClientImpactResponse)
async def my_impact(
    current_user_id: CurrentUserId,
    db: Session = Depends(get_db),
):
    """Accumulated CO2 savings of the authenticated client + equivalences (RF-CO2-02).

    Sums the per-shipment savings persisted when each collaborative
    shipment was accepted, over the client's delivered shipments.
    """
    delivered = Shipment.status == ShipmentStatus.DELIVERED
    mine = Shipment.client_id == current_user_id

    total_kg = (
        db.query(func.coalesce(func.sum(Shipment.co2_savings_kg), 0.0))
        .filter(mine, delivered)
        .scalar()
    )
    delivered_count = db.query(func.count(Shipment.id)).filter(mine, delivered).scalar() or 0
    collaborative_count = (
        db.query(func.count(Shipment.id))
        .filter(mine, delivered, Shipment.modality == ShipmentModality.COLLABORATIVE)
        .scalar()
        or 0
    )

    total_kg = float(total_kg)
    return ClientImpactResponse(
        total_co2_saved_kg=round(total_kg, 3),
        shipments_delivered=delivered_count,
        shipments_collaborative=collaborative_count,
        equivalences=ImpactEquivalences(
            car_km=round(total_kg / CAR_KG_PER_KM, 1),
            tree_months=round(total_kg / TREE_KG_PER_YEAR * 12, 1),
            smartphone_charges=int(total_kg / SMARTPHONE_KG_PER_CHARGE),
        ),
    )
