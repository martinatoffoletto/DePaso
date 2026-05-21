"""
CO2 module schemas.
"""
from pydantic import BaseModel, Field


class CO2CalculationRequest(BaseModel):
    """Request for CO2 calculation."""

    distance_km: float = Field(..., gt=0)
    vehicle_type: str = Field(..., pattern="^(pedestrian|bike|motorcycle|car|van|truck)$")
    weight_kg: float = Field(..., gt=0)


class CO2SavingsResponse(BaseModel):
    """Response with CO2 savings."""

    direct_emissions_gco2: float = Field(..., ge=0)
    counterfactual_emissions_gco2: float = Field(..., ge=0)
    savings_gco2: float = Field(..., ge=0)
    savings_percentage: float = Field(..., ge=0, le=100)
