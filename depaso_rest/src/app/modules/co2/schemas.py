"""
CO2 module schemas.
"""
from pydantic import BaseModel, Field


class CO2EstimateRequest(BaseModel):
    """Estimate CO2 savings for a candidate collaborative assignment (RF-CO2-01)."""

    route_origin_lat: float
    route_origin_lon: float
    route_destination_lat: float
    route_destination_lon: float
    pickup_lat: float
    pickup_lon: float
    dropoff_lat: float
    dropoff_lon: float
    vehicle_type: str = Field(..., pattern="^(pedestrian|bike|motorcycle|car|van|truck)$")
    dedicated_vehicle_type: str | None = Field(
        None, pattern="^(pedestrian|bike|motorcycle|car|van|truck)$"
    )


class CO2EstimateResponse(BaseModel):
    """CO2 savings breakdown: real vs counterfactual dedicated trip."""

    real_emissions_kg: float
    counterfactual_emissions_kg: float
    savings_kg: float
    savings_percent: float
    detour_km: float
    dedicated_distance_km: float


class ImpactEquivalences(BaseModel):
    """Everyday equivalences of the saved CO2 (for the impact screen)."""

    car_km: float            # km in an average car (0.18 kg/km)
    tree_months: float       # months of absorption of one urban tree (~21 kg/yr)
    smartphone_charges: int  # full phone charges (~8 g each)


class ClientImpactResponse(BaseModel):
    """Accumulated environmental impact of a client (RF-CO2-02)."""

    total_co2_saved_kg: float
    shipments_delivered: int
    shipments_collaborative: int
    equivalences: ImpactEquivalences
