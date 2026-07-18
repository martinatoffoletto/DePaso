"""
Admin module API router (RF-ADM).

Admin access: users with user_type == "admin". For the prototype demo an
admin is created by the seed script. All logic lives in AdminService — the
router only handles auth and HTTP mapping.
"""
from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.app.core.database import get_db
from src.app.core.dependencies import AdminUserId
from src.app.modules.admin.schemas import (
    ActivityResponse,
    AdminCreateOrganizationRequest,
    AdminCreateOrganizationResponse,
    ClassificationActivityItem,
    DashboardResponse,
    ModerationRequest,
    ShipmentEventActivityItem,
    SystemStatusResponse,
)
from src.app.modules.admin.service import AdminService
from src.app.modules.carriers.schemas import CarrierResponse

router = APIRouter(prefix="/admin", tags=["admin"])


def get_admin_service(db: AsyncSession = Depends(get_db)) -> AdminService:
    return AdminService(db)


@router.get("/dashboard", response_model=DashboardResponse)
async def dashboard(
    _admin: AdminUserId,
    service: AdminService = Depends(get_admin_service),
):
    """Operational aggregates for the monitoring panel (RF-ADM-01/02)."""
    return DashboardResponse(**await service.dashboard())


@router.get("/carriers/pending", response_model=list[CarrierResponse])
async def pending_carriers(
    _admin: AdminUserId,
    service: AdminService = Depends(get_admin_service),
):
    """Carriers awaiting verification (RF-USR-07)."""
    return [CarrierResponse.model_validate(c) for c in await service.pending_carriers()]


@router.patch("/carriers/{carrier_id}", response_model=CarrierResponse)
async def moderate_carrier(
    carrier_id: int,
    data: ModerationRequest,
    _admin: AdminUserId,
    service: AdminService = Depends(get_admin_service),
):
    """Verify, suspend or reactivate a carrier (RF-USR-07, RF-ADM-03)."""
    carrier = await service.moderate_carrier(carrier_id, data.action)
    return CarrierResponse.model_validate(carrier)


@router.get("/status", response_model=SystemStatusResponse)
async def system_status(
    request: Request,
    _admin: AdminUserId,
    service: AdminService = Depends(get_admin_service),
):
    """Operational health for the monitoring panel (RF-ADM): API/DB health and
    whether the vision classifier runs the trained model or the stub fallback."""
    classifier = getattr(request.app.state, "classifier", None)
    return SystemStatusResponse(**await service.system_status(classifier))


@router.get("/activity", response_model=ActivityResponse)
async def recent_activity(
    _admin: AdminUserId,
    limit: int = 20,
    service: AdminService = Depends(get_admin_service),
):
    """Latest classifications and shipment status changes (RF-ADM monitoring)."""
    data = await service.recent_activity(limit)
    return ActivityResponse(
        recent_classifications=[
            ClassificationActivityItem.model_validate(c, from_attributes=True)
            for c in data["classifications"]
        ],
        recent_events=[
            ShipmentEventActivityItem.model_validate(e, from_attributes=True)
            for e in data["events"]
        ],
    )


@router.post(
    "/organizations", response_model=AdminCreateOrganizationResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_organization_account(
    data: AdminCreateOrganizationRequest,
    _admin: AdminUserId,
    service: AdminService = Depends(get_admin_service),
):
    """Alta manual de una cuenta B2B (pyme/fletero): crea el usuario dueño y
    su organización de una sola vez (RF-ADM)."""
    user, org = await service.create_org_account(
        name=data.name, cuit=data.cuit, kind=data.kind,
        email=data.email, password=data.password,
    )
    return AdminCreateOrganizationResponse(
        organization_id=org.id, name=org.name, cuit=org.cuit, kind=org.kind,
        owner_user_id=user.id, owner_email=user.email,
    )
