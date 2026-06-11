"""
Tracking module schemas.
"""
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class PositionPublish(BaseModel):
    """Carrier GPS sample (RF-TRK-01)."""

    lat: float = Field(..., ge=-90, le=90)
    lon: float = Field(..., ge=-180, le=180)


class PositionResponse(BaseModel):
    """Latest known carrier position for a shipment (RF-TRK-02)."""

    model_config = ConfigDict(from_attributes=True)

    shipment_id: int | None
    lat: float
    lon: float
    created_at: datetime


class TraceResponse(BaseModel):
    """One historical GPS sample (RF-TRK-03)."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    lat: float
    lon: float
    created_at: datetime
