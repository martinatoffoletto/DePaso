"""
Admin module schemas.
"""
from datetime import datetime

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


class SystemStatusResponse(BaseModel):
    """Operational health of the platform for the admin panel.

    vision_model_loaded == False means the classifier is running in stub
    fallback mode (no trained model / TensorFlow available).
    """

    api: str                         # "ok"
    environment: str
    debug: bool
    database: str                    # "ok" | "error"
    vision_model_loaded: bool
    vision_model_path: str


class ClassificationActivityItem(BaseModel):
    id: int
    shipment_id: int | None = None
    user_id: int | None = None
    predicted_category: str
    confidence: float
    model_loaded: bool               # False = stub fallback produced this result
    accepted: bool | None = None
    manual_category: str | None = None
    created_at: datetime


class ShipmentEventActivityItem(BaseModel):
    id: int
    shipment_id: int
    status: str
    actor_user_id: int | None = None
    created_at: datetime


class ActivityResponse(BaseModel):
    """Recent platform activity for the monitoring panel."""

    recent_classifications: list[ClassificationActivityItem]
    recent_events: list[ShipmentEventActivityItem]
