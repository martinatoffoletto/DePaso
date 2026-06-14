"""
Routes module schemas.
"""
from datetime import datetime

from pydantic import BaseModel, model_validator


class RouteCreateRequest(BaseModel):
    """Publish a carrier route (RF-CAR-01) or dedicated window (RF-CAR-02)."""

    kind: str = "collaborative_route"  # collaborative_route | dedicated_window
    origin_lat: float
    origin_lon: float
    destination_lat: float | None = None
    destination_lon: float | None = None
    window_start: datetime
    window_end: datetime
    recurrence_days: str | None = None  # e.g. "mon,tue,wed,thu,fri"

    @model_validator(mode="after")
    def validate_route(self) -> "RouteCreateRequest":
        if self.kind == "collaborative_route":
            if self.destination_lat is None or self.destination_lon is None:
                raise ValueError("A collaborative route requires a destination.")
        if self.window_end <= self.window_start:
            raise ValueError("window_end must be after window_start.")
        return self


class RouteUpdate(BaseModel):
    """Schema for updating an existing route."""

    origin_lat: float | None = None
    origin_lon: float | None = None
    destination_lat: float | None = None
    destination_lon: float | None = None
    window_start: datetime | None = None
    window_end: datetime | None = None
    recurrence_days: str | None = None


class RouteResponse(BaseModel):
    """A published carrier route."""

    id: int
    carrier_id: int
    kind: str
    origin_lat: float
    origin_lon: float
    destination_lat: float | None
    destination_lon: float | None
    window_start: datetime
    window_end: datetime
    recurrence_days: str | None
    is_active: bool

    model_config = {"from_attributes": True}
