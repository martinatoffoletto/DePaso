"""
Routes module schemas.
"""
from datetime import datetime, timezone

from pydantic import BaseModel, Field, field_validator, model_validator

ROUTE_KIND_PATTERN = r"^(collaborative_route|dedicated_window)$"
# CSV de días: la recurrencia se evalúa en el matching (routes/windows.py) —
# un valor con formato libre nunca matchearía y la ruta quedaría muerta.
RECURRENCE_PATTERN = r"^(mon|tue|wed|thu|fri|sat|sun)(,(mon|tue|wed|thu|fri|sat|sun))*$"


def _to_naive_utc(dt: datetime | None) -> datetime | None:
    """Normaliza a naive UTC: las fechas guardadas y las que compara el matching
    son naive UTC, así que un payload con tz (ej. '...Z') debe convertirse para
    no chocar aware-vs-naive."""
    if dt is None:
        return None
    if dt.tzinfo is not None:
        dt = dt.astimezone(timezone.utc).replace(tzinfo=None)
    return dt


class RouteCreateRequest(BaseModel):
    """Publish a carrier route (RF-CAR-01) or dedicated window (RF-CAR-02)."""

    # pattern: un kind fuera de estos dos se guardaría y nunca matchearía
    # (ruta huérfana que ensucia el matching).
    kind: str = Field(default="collaborative_route", pattern=ROUTE_KIND_PATTERN)
    origin_lat: float = Field(..., ge=-90, le=90)
    origin_lon: float = Field(..., ge=-180, le=180)
    destination_lat: float | None = Field(default=None, ge=-90, le=90)
    destination_lon: float | None = Field(default=None, ge=-180, le=180)
    window_start: datetime
    window_end: datetime
    recurrence_days: str | None = Field(default=None, pattern=RECURRENCE_PATTERN)

    _norm_windows = field_validator("window_start", "window_end")(_to_naive_utc)

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

    origin_lat: float | None = Field(default=None, ge=-90, le=90)
    origin_lon: float | None = Field(default=None, ge=-180, le=180)
    destination_lat: float | None = Field(default=None, ge=-90, le=90)
    destination_lon: float | None = Field(default=None, ge=-180, le=180)
    window_start: datetime | None = None
    window_end: datetime | None = None
    recurrence_days: str | None = Field(default=None, pattern=RECURRENCE_PATTERN)

    _norm_windows = field_validator("window_start", "window_end")(_to_naive_utc)


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
