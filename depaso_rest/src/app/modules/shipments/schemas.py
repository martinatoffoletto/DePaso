"""
Shipments module schemas.
"""
from datetime import datetime
from pydantic import BaseModel, Field


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


class ShipmentCreate(ShipmentBase):
    """Schema for shipment creation."""

    pass


class ShipmentResponse(ShipmentBase):
    """Schema for shipment response."""

    id: int
    carrier_id: int | None = None
    status: str
    estimated_price: float | None = None
    co2_savings_kg: float | None = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
