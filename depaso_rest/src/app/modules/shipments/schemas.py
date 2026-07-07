"""
Shipments module schemas.
"""
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class ShipmentBase(BaseModel):
    """Base shipment schema."""

    client_id: int
    package_size: str
    modality: str
    assignment_mode: str
    origin_lat: float = Field(..., ge=-90, le=90)
    origin_lon: float = Field(..., ge=-180, le=180)
    destination_lat: float = Field(..., ge=-90, le=90)
    destination_lon: float = Field(..., ge=-180, le=180)
    weight_kg: float = Field(..., gt=0)
    photo_url: str | None = None
    description: str | None = None


class ShipmentCreate(BaseModel):
    """Schema for shipment creation — client_id is injected from JWT, not sent by client."""

    package_size: str
    modality: str
    assignment_mode: str
    origin_lat: float = Field(..., ge=-90, le=90)
    origin_lon: float = Field(..., ge=-180, le=180)
    destination_lat: float = Field(..., ge=-90, le=90)
    destination_lon: float = Field(..., ge=-180, le=180)
    weight_kg: float = Field(..., gt=0)
    photo_url: str | None = None
    description: str | None = None


class ShipmentUpdate(BaseModel):
    """Schema for updating a pending shipment."""

    package_size: str | None = None
    modality: str | None = None
    assignment_mode: str | None = None
    origin_lat: float | None = Field(default=None, ge=-90, le=90)
    origin_lon: float | None = Field(default=None, ge=-180, le=180)
    destination_lat: float | None = Field(default=None, ge=-90, le=90)
    destination_lon: float | None = Field(default=None, ge=-180, le=180)
    weight_kg: float | None = Field(default=None, gt=0)
    photo_url: str | None = None
    description: str | None = None


class ShipmentResponse(ShipmentBase):
    """Schema for shipment response."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    carrier_id: int | None = None
    status: str
    payment_status: str = "pending"
    estimated_price: float | None = None
    co2_savings_kg: float | None = None
    created_at: datetime
    updated_at: datetime


class PaymentResponse(BaseModel):
    """Breakdown returned after a simulated payment, so the UI can show the
    platform commission transparently (survey finding #1: no hidden charges)."""

    shipment_id: int
    payment_status: str
    amount: float                    # what the client pays (gross price)
    platform_fee: float              # platform commission
    carrier_payout: float            # what the carrier receives
    platform_commission_rate: float  # e.g. 0.15


class AssignedCarrierResponse(BaseModel):
    """Public contact info of the carrier assigned to a shipment. Only the
    shipment's client (or the carrier themselves) may read it — the phone is
    not exposed to anyone else (privacy)."""

    carrier_id: int
    name: str
    phone: str | None = None
    rating: float
    trips: int


class QuoteRequest(BaseModel):
    """Price quote before creating the shipment (price shown upfront)."""

    origin_lat: float = Field(..., ge=-90, le=90)
    origin_lon: float = Field(..., ge=-180, le=180)
    destination_lat: float = Field(..., ge=-90, le=90)
    destination_lon: float = Field(..., ge=-180, le=180)
    package_size: str = Field(..., pattern="^(s|m|l|xl)$")


class QuoteResponse(BaseModel):
    """Both modality prices + ETAs + estimated CO2 benefit."""

    distance_km: float
    price_dedicated: float
    price_collaborative: float
    eta_dedicated_min: int
    eta_collaborative_min: int
    co2_savings_estimate_kg: float


class StatusUpdateRequest(BaseModel):
    """Carrier milestone update (RF-CAR-05)."""

    new_status: str
    lat: float | None = None
    lon: float | None = None


class AcceptRequest(BaseModel):
    """Carrier accepts a shipment, optionally via a matched route."""

    route_id: int | None = None


class ShipmentEventResponse(BaseModel):
    """One entry of the status audit trail."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    shipment_id: int
    status: str
    lat: float | None
    lon: float | None
    notes: str | None
    created_at: datetime


class RatingCreate(BaseModel):
    """Client rating after delivery (RF-SHP-08)."""

    stars: int = Field(..., ge=1, le=5)
    comment: str | None = Field(None, max_length=500)


class RatingResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    shipment_id: int
    carrier_id: int
    stars: int
    comment: str | None
    created_at: datetime
