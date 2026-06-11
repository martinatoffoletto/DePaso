"""
CO2 module API router.
"""
from fastapi import APIRouter

from src.app.modules.co2.schemas import CO2EstimateRequest, CO2EstimateResponse
from src.app.modules.co2.service import CO2Service
from src.app.shared.geo import Point

router = APIRouter(prefix="/co2", tags=["co2"])


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
