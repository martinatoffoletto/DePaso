"""
Organizations module schemas (Pydantic v2).

These schemas are the source of truth for the ORGANIZATIONS_API_CONTRACT.md
consumed by depaso_web. Keep field names/shapes in sync when they change.
"""
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

CUIT_PATTERN = r"^\d{2}-?\d{8}-?\d$"
KIND_PATTERN = r"^(fleet|merchant)$"


# -- organizations ----------------------------------------------------------

class OrganizationCreate(BaseModel):
    """Create an organization. The caller becomes its owner + first member."""

    name: str = Field(..., min_length=1, max_length=255)
    cuit: str = Field(..., pattern=CUIT_PATTERN, description="Argentine CUIT, e.g. 30-71234567-8")
    kind: str = Field(..., pattern=KIND_PATTERN)


class OrganizationUpdate(BaseModel):
    """Patch an organization (owner/manager)."""

    name: str | None = Field(default=None, min_length=1, max_length=255)
    kind: str | None = Field(default=None, pattern=KIND_PATTERN)


class OrganizationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    cuit: str
    kind: str
    owner_user_id: int
    created_at: datetime
    updated_at: datetime


class MyOrganizationResponse(OrganizationResponse):
    """An organization plus the caller's role in it."""

    my_role: str  # owner | manager


# -- fleet: carriers --------------------------------------------------------

class LinkCarrierRequest(BaseModel):
    """Link an existing carrier to the fleet organization."""

    carrier_id: int


class OrgCarrierResponse(BaseModel):
    """A fleet carrier: profile snapshot + link metadata."""

    model_config = ConfigDict(from_attributes=True)

    carrier_id: int
    company_name: str
    vehicle_type: str
    license_plate: str | None = None
    capacity_kg: float
    reputation: float
    is_active: bool
    is_verified: bool
    status: str  # active | inactive
    linked_at: datetime | None = None
    unlinked_at: datetime | None = None


# -- merchant: shipments ----------------------------------------------------

class OrgShipmentCreate(BaseModel):
    """Create a shipment as a merchant org. client_id is the org owner; the
    shipment is stamped with organization_id automatically."""

    package_size: str = Field(..., pattern=r"^(s|m|l|xl)$")
    modality: str = Field(..., pattern=r"^(dedicated|collaborative)$")
    assignment_mode: str = Field(..., pattern=r"^(on_demand|by_availability)$")
    origin_lat: float = Field(..., ge=-90, le=90)
    origin_lon: float = Field(..., ge=-180, le=180)
    destination_lat: float = Field(..., ge=-90, le=90)
    destination_lon: float = Field(..., ge=-180, le=180)
    weight_kg: float = Field(..., gt=0)
    photo_url: str | None = None
    description: str | None = None
    # Contacto en destino: sin esto el carrier no tenía a quién llamar al
    # entregar un envío creado por una pyme.
    recipient_name: str | None = Field(None, max_length=120)
    recipient_phone: str | None = Field(None, max_length=30)


class OrgShipmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    organization_id: int | None = None
    client_id: int
    carrier_id: int | None = None
    package_size: str
    status: str
    modality: str
    assignment_mode: str
    origin_lat: float
    origin_lon: float
    destination_lat: float
    destination_lon: float
    weight_kg: float
    estimated_price: float | None = None
    co2_savings_kg: float | None = None
    created_at: datetime
    updated_at: datetime


# -- dashboard & finance ----------------------------------------------------

class OrgDashboardResponse(BaseModel):
    """Monitoring KPIs for the pyme panel."""

    organization_id: int
    kind: str
    fleet_size: int              # active linked carriers
    shipments_total: int         # shipments created by this org
    shipments_active: int        # assigned / pickup_arrived / in_transit
    shipments_pending: int
    shipments_delivered: int
    total_spent: float           # sum of price of org shipments
    total_earned: float          # sum of earnings of fleet-delivered shipments
    total_co2_saved_kg: float


class MonthlyAmount(BaseModel):
    month: str  # "YYYY-MM"
    amount: float


class FinanceSeries(BaseModel):
    total: float
    by_month: list[MonthlyAmount]


class OrgFinanceResponse(BaseModel):
    """Money put in (spent on shipments) vs earned (by the fleet)."""

    organization_id: int
    currency: str = "ARS"
    spent: FinanceSeries         # merchant side
    earned: FinanceSeries        # fleet side
