"""
Matching module schemas.
"""
from pydantic import BaseModel


class CarrierScoreResponse(BaseModel):
    """Score breakdown for a single carrier candidate."""

    carrier_id: int
    company_name: str
    vehicle_type: str
    license_plate: str
    total_score: float
    distance_score: float
    detour_score: float
    capacity_score: float
    reputation_score: float
    time_window_score: float


class MatchingResponse(BaseModel):
    """Full matching result for a shipment."""

    shipment_id: int
    matched_carrier_id: int
    total_score: float
    ranked_carriers: list[CarrierScoreResponse]
