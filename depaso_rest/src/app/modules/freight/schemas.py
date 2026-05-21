"""
Freight module schemas.
"""
from datetime import datetime
from pydantic import BaseModel, Field


class FreightShipmentCreate(BaseModel):
    """Request for freight shipment creation."""

    client_id: int
    origin_lat: float = Field(..., ge=-90, le=90)
    origin_lon: float = Field(..., ge=-180, le=180)
    destination_lat: float = Field(..., ge=-90, le=90)
    destination_lon: float = Field(..., ge=-180, le=180)
    weight_kg: float = Field(..., gt=0)
    description: str
    requires_dedicated_carrier: bool = True


class FreightShipmentResponse(BaseModel):
    """Response for freight shipment."""

    id: int
    client_id: int
    carrier_id: int | None = None
    origin_lat: float
    origin_lon: float
    destination_lat: float
    destination_lon: float
    weight_kg: float
    description: str
    requires_dedicated_carrier: bool
    status: str
    estimated_cost: float | None = None
    created_at: datetime

    class Config:
        from_attributes = True
