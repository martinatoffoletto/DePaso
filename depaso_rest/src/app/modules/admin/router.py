"""
Admin module API router (RF-ADM).

Admin access: users with user_type == "admin". For the prototype demo an
admin is created by the seed script.
"""
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import func, text
from sqlalchemy.orm import Session

from src.app.core.config import settings
from src.app.core.database import get_db
from src.app.core.dependencies import CurrentUserId
from src.app.modules.admin.schemas import (
    ActivityResponse,
    ClassificationActivityItem,
    DashboardResponse,
    ModerationRequest,
    ShipmentEventActivityItem,
    SystemStatusResponse,
)
from src.app.modules.carriers.models import Carrier
from src.app.modules.carriers.schemas import CarrierResponse
from src.app.modules.shipments.models import Shipment, ShipmentEvent
from src.app.modules.users.models import User
from src.app.modules.vision.models import Classification
from src.app.shared.enums import ShipmentStatus

router = APIRouter(prefix="/admin", tags=["admin"])

ACTIVE_STATUSES = (
    ShipmentStatus.ASSIGNED,
    ShipmentStatus.PICKUP_ARRIVED,
    ShipmentStatus.IN_TRANSIT,
)


def require_admin(current_user_id: CurrentUserId, db: Session = Depends(get_db)) -> User:
    user = db.query(User).filter(User.id == current_user_id).first()
    if not user or user.user_type != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                            detail="Admin access required")
    return user


@router.get("/dashboard", response_model=DashboardResponse)
async def dashboard(
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Operational aggregates for the monitoring panel (RF-ADM-01/02)."""
    def count(model, *filters) -> int:
        q = db.query(func.count(model.id))
        for f in filters:
            q = q.filter(f)
        return q.scalar() or 0

    delivered = count(Shipment, Shipment.status == ShipmentStatus.DELIVERED)
    cancelled = count(Shipment, Shipment.status == ShipmentStatus.CANCELLED)
    closed = delivered + cancelled
    co2_total = (
        db.query(func.coalesce(func.sum(Shipment.co2_savings_kg), 0.0))
        .filter(Shipment.status == ShipmentStatus.DELIVERED)
        .scalar()
    )

    return DashboardResponse(
        total_users=count(User),
        total_carriers=count(Carrier),
        carriers_pending_verification=count(
            Carrier, Carrier.is_verified == False, Carrier.is_active == True
        ),
        shipments_total=count(Shipment),
        shipments_active=count(Shipment, Shipment.status.in_(ACTIVE_STATUSES)),
        shipments_delivered=delivered,
        shipments_pending=count(Shipment, Shipment.status == ShipmentStatus.PENDING),
        total_co2_saved_kg=round(float(co2_total), 3),
        matching_success_rate=round(delivered / closed, 4) if closed else 0.0,
    )


@router.get("/carriers/pending", response_model=list[CarrierResponse])
async def pending_carriers(
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Carriers awaiting verification (RF-USR-07)."""
    carriers = (
        db.query(Carrier)
        .filter(Carrier.is_verified == False, Carrier.is_active == True)
        .order_by(Carrier.created_at)
        .all()
    )
    return [CarrierResponse.model_validate(c) for c in carriers]


@router.patch("/carriers/{carrier_id}", response_model=CarrierResponse)
async def moderate_carrier(
    carrier_id: int,
    data: ModerationRequest,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Verify, suspend or reactivate a carrier (RF-USR-07, RF-ADM-03)."""
    carrier = db.query(Carrier).filter(Carrier.id == carrier_id).first()
    if not carrier:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Carrier not found")

    if data.action == "verify":
        carrier.is_verified = True
    elif data.action == "suspend":
        carrier.is_active = False
    elif data.action == "reactivate":
        carrier.is_active = True
    else:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                            detail="action must be verify | suspend | reactivate")
    db.commit()
    db.refresh(carrier)
    return CarrierResponse.model_validate(carrier)

# Matching weights live under GET/PATCH /matching/weights (validated, sum==1).
