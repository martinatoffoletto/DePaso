"""
Admin module schemas.
"""
from pydantic import BaseModel


class DashboardResponse(BaseModel):
    """Operational dashboard aggregates (RF-ADM-01/02)."""

    total_users: int
    total_carriers: int
    carriers_pending_verification: int
    shipments_total: int
    shipments_active: int
    shipments_delivered: int
    shipments_pending: int
    total_co2_saved_kg: float
    matching_success_rate: float  # delivered / (delivered + cancelled)


class ModerationRequest(BaseModel):
    """Verify or suspend a carrier (RF-USR-07, RF-ADM-03)."""

    action: str  # "verify" | "suspend" | "reactivate"
