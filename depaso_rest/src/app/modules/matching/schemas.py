"""
Matching module schemas.
"""
from pydantic import BaseModel, Field


class WeightsResponse(BaseModel):
    """Current scoring weights (spec 5.2). Must sum to 1."""

    geo: float
    detour: float
    cargo: float
    reputation: float
    time_window: float


class WeightsUpdateRequest(BaseModel):
    """Partial update of scoring weights — admin only (no redeploy needed).

    Omitted components keep their current value; the resulting set must sum to 1.
    """

    geo: float | None = Field(None, ge=0.0, le=1.0)
    detour: float | None = Field(None, ge=0.0, le=1.0)
    cargo: float | None = Field(None, ge=0.0, le=1.0)
    reputation: float | None = Field(None, ge=0.0, le=1.0)
    time_window: float | None = Field(None, ge=0.0, le=1.0)


class ScoreBreakdown(BaseModel):
    """Individual components of the multivariable score (explainability)."""

    geo: float          # compatibility of pickup/dropoff with carrier position or route
    detour: float       # 1 - normalized detour (higher = less deviation)
    cargo: float        # 1 if vehicle can carry the category, else knocked out
    reputation: float   # carrier rating / 5
    time_window: float  # overlap between shipment window and carrier availability


class CarrierScoreResponse(BaseModel):
    """Score and explanation for a single carrier candidate."""

    carrier_id: int
    company_name: str
    vehicle_type: str
    license_plate: str
    total_score: float
    breakdown: ScoreBreakdown
    detour_km: float | None = None      # real additional km (collaborative only)
    detour_ratio: float | None = None   # detour / carrier route length
    eta_to_pickup_min: int | None = None
    route_id: int | None = None         # matched carrier route (collaborative)
    explanation: list[str] = []         # human-readable reasons (auditable assignment)


class MatchingResponse(BaseModel):
    """Full matching result for a shipment."""

    shipment_id: int
    modality: str
    matched_carrier_id: int
    total_score: float
    ranked_carriers: list[CarrierScoreResponse]


class FeedItemResponse(BaseModel):
    """A compatible pending shipment offered to a carrier (RF-MAT-03)."""

    shipment_id: int
    modality: str
    package_size: str
    weight_kg: float
    origin_lat: float
    origin_lon: float
    destination_lat: float
    destination_lon: float
    estimated_price: float | None
    photo_url: str | None = None
    description: str | None = None
    declared_value: float | None = None
    score: float
    detour_km: float | None = None      # collaborative: extra km on the carrier's route
    detour_ratio: float | None = None
    distance_to_pickup_km: float | None = None  # dedicated: how far the pickup is
    route_id: int | None = None         # which published route matched
    explanation: list[str] = []
