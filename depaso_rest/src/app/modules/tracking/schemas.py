"""
Tracking module schemas.
"""
from datetime import datetime
from pydantic import BaseModel, Field


class TrackingEventCreate(BaseModel):
    """Request to create tracking event."""

    status: str
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    notes: str | None = None


class TrackingEventResponse(BaseModel):
    """Response for tracking event."""

    id: int
    shipment_id: int
    status: str
    latitude: float
    longitude: float
    notes: str | None
    created_at: datetime

    class Config:
        from_attributes = True


class ShipmentTrackingResponse(BaseModel):
    """Response for full shipment tracking."""

    shipment_id: int
    current_status: str
    current_latitude: float
    current_longitude: float
    last_update: datetime
    history: list[TrackingEventResponse]
