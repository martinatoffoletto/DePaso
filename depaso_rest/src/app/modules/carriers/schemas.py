"""
Carriers module schemas.
"""
from datetime import datetime
from pydantic import BaseModel, Field, model_validator


MOTORIZED_VEHICLES = {"motorcycle", "car", "van", "truck"}


class CarrierBase(BaseModel):
    """Base carrier schema.

    license_plate es condicional: obligatoria para vehículos motorizados,
    None para movilidad blanda (un peatón/ciclista no tiene patente).
    """

    company_name: str = Field(..., min_length=1, max_length=255)
    vehicle_type: str = Field(..., pattern="^(pedestrian|bike|motorcycle|car|van|truck)$")
    license_plate: str | None = Field(default=None, max_length=20)
    capacity_kg: float = Field(..., gt=0)
    capacity_volume_m3: float | None = None


class _PlateRuleMixin(BaseModel):
    """Regla de creación (no aplica a los responses, que solo serializan)."""

    @model_validator(mode="after")
    def _plate_required_for_motorized(self):
        if self.vehicle_type in MOTORIZED_VEHICLES:
            if not self.license_plate or not self.license_plate.strip():
                raise ValueError(
                    f"license_plate is required for vehicle_type '{self.vehicle_type}'"
                )
            self.license_plate = self.license_plate.strip().upper()
        else:
            # movilidad blanda: se descarta cualquier valor enviado
            self.license_plate = None
        return self


class CarrierCreate(_PlateRuleMixin, CarrierBase):
    """Schema for carrier creation by an admin (explicit user_id)."""

    user_id: int


class CarrierProfileCreate(_PlateRuleMixin, CarrierBase):
    """Self-service carrier profile creation — user_id comes from the JWT."""


class CarrierUpdate(BaseModel):
    """Schema for carrier update."""

    company_name: str | None = None
    vehicle_type: str | None = Field(default=None, pattern="^(pedestrian|bike|motorcycle|car|van|truck)$")
    license_plate: str | None = None
    capacity_kg: float | None = Field(default=None, gt=0)
    capacity_volume_m3: float | None = None


class CarrierResponse(CarrierBase):
    """Schema for carrier response."""

    id: int
    user_id: int
    reputation: float
    is_active: bool
    is_verified: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CarrierSummaryResponse(BaseModel):
    """Carrier history and earnings (RF-CAR-06)."""

    carrier_id: int
    reputation: float
    deliveries_completed: int
    active_shipments: int
    total_earnings: float
    total_co2_saved_kg: float


class CarrierRatingResponse(BaseModel):
    """A single review received by the carrier (client identity omitted)."""

    stars: int
    comment: str | None
    created_at: datetime

    class Config:
        from_attributes = True


class AvailabilityWindowRequest(BaseModel):
    """Register or update the carrier's habitual availability window (BY_AVAILABILITY, RF-CAR-02).

    Creates a dedicated_window entry in carrier_routes so the matching engine
    can assign dedicated shipments to this carrier during their declared window.
    """

    origin_lat: float = Field(..., description="Latitude of the carrier's availability zone centre.")
    origin_lon: float = Field(..., description="Longitude of the carrier's availability zone centre.")
    window_start: datetime
    window_end: datetime
    recurrence_days: str | None = Field(
        default=None,
        description='Comma-separated weekday abbreviations, e.g. "mon,tue,wed,thu,fri".',
    )

    @model_validator(mode="after")
    def validate_window(self) -> "AvailabilityWindowRequest":
        if self.window_end <= self.window_start:
            raise ValueError("window_end must be strictly after window_start.")
        return self
