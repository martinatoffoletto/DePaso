"""
Organizations module API router (B2B pymes).

Auth model: any authenticated user can create an organization and thereby
become its owner. The "org" role is derived from organization_members via the
`get_current_org` dependency — it is never carried in the JWT.
"""
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.app.core.database import get_db
from src.app.core.dependencies import CurrentUserId
from src.app.modules.carriers.repository import CarrierRepository
from src.app.modules.organizations.exceptions import (
    NotAnOrgMemberError,
)
from src.app.shared.exceptions import NotFoundError
from src.app.modules.organizations.models import Organization
from src.app.modules.organizations.repository import OrganizationRepository
from src.app.modules.organizations.schemas import (
    LinkCarrierRequest,
    MyOrganizationResponse,
    OrgCarrierResponse,
    OrgDashboardResponse,
    OrgFinanceResponse,
    OrganizationCreate,
    OrganizationResponse,
    OrganizationUpdate,
    OrgShipmentCreate,
    OrgShipmentResponse,
)
from src.app.modules.organizations.service import OrganizationService
from src.app.modules.routes.repository import RouteRepository
from src.app.modules.shipments.repository import ShipmentRepository
from src.app.modules.shipments.service import ShipmentService

router = APIRouter(prefix="/organizations", tags=["organizations"])


def get_org_service(db: AsyncSession = Depends(get_db)) -> OrganizationService:
    shipment_repo = ShipmentRepository(db)
    shipment_service = ShipmentService(
        shipment_repo,
        carrier_repo=CarrierRepository(db),
        route_repo=RouteRepository(db),
    )
    return OrganizationService(
        org_repo=OrganizationRepository(db),
        carrier_repo=CarrierRepository(db),
        shipment_repo=shipment_repo,
        shipment_service=shipment_service,
    )


async def get_current_org(
    current_user_id: CurrentUserId,
    service: OrganizationService = Depends(get_org_service),
) -> Organization:
    """Resolve the caller's active organization from their membership (403 if none)."""
    resolved = await service.resolve_membership(current_user_id)
    if resolved is None:
        raise NotAnOrgMemberError()
    org, _ = resolved
    return org


# -- organization CRUD ------------------------------------------------------

@router.post("", response_model=OrganizationResponse, status_code=status.HTTP_201_CREATED)
async def create_organization(
    data: OrganizationCreate,
    current_user_id: CurrentUserId,
    service: OrganizationService = Depends(get_org_service),
) -> OrganizationResponse:
    """Create an organization; the caller becomes its owner."""
    org = await service.create_organization(
        owner_user_id=current_user_id,
        name=data.name, cuit=data.cuit, kind=data.kind,
    )
    return OrganizationResponse.model_validate(org)


@router.get("", response_model=list[MyOrganizationResponse])
async def list_my_organizations(
    current_user_id: CurrentUserId,
    service: OrganizationService = Depends(get_org_service),
) -> list[MyOrganizationResponse]:
    """Organizations the current user administers (with their role in each)."""
    out: list[MyOrganizationResponse] = []
    for org, role in await service.list_my_organizations(current_user_id):
        payload = OrganizationResponse.model_validate(org).model_dump()
        out.append(MyOrganizationResponse(**payload, my_role=role))
    return out


@router.get("/me", response_model=MyOrganizationResponse)
async def get_my_organization(
    current_user_id: CurrentUserId,
    service: OrganizationService = Depends(get_org_service),
) -> MyOrganizationResponse:
    """The caller's active organization (resolved from membership)."""
    resolved = await service.resolve_membership(current_user_id)
    if resolved is None:
        raise NotAnOrgMemberError()
    org, membership = resolved
    payload = OrganizationResponse.model_validate(org).model_dump()
    return MyOrganizationResponse(**payload, my_role=membership.role)


@router.patch("/me", response_model=OrganizationResponse)
async def update_my_organization(
    data: OrganizationUpdate,
    org: Organization = Depends(get_current_org),
    service: OrganizationService = Depends(get_org_service),
) -> OrganizationResponse:
    """Update the caller's organization.

    Antes esto tomaba org_id del path y verificaba membresía con
    `get_membership(...) is None` SIN await: la coroutine nunca es None, así
    que el chequeo pasaba siempre y cualquier usuario podía editar cualquier
    organización (IDOR). Ahora la org se resuelve de la membresía real vía
    get_current_org, igual que el resto del módulo.
    """
    org = await service.update_organization(org.id, **data.model_dump(exclude_unset=True))
    return OrganizationResponse.model_validate(org)


# -- monitoring & finance ---------------------------------------------------

@router.get("/me/dashboard", response_model=OrgDashboardResponse)
async def my_dashboard(
    org: Organization = Depends(get_current_org),
    service: OrganizationService = Depends(get_org_service),
) -> OrgDashboardResponse:
    """Monitoring KPIs for the pyme panel."""
    return OrgDashboardResponse(**await service.dashboard(org))


@router.get("/me/finance", response_model=OrgFinanceResponse)
async def my_finance(
    org: Organization = Depends(get_current_org),
    service: OrganizationService = Depends(get_org_service),
) -> OrgFinanceResponse:
    """Money spent (on shipments) vs earned (by the fleet), per month + total."""
    return OrgFinanceResponse(**await service.finance(org))


# -- fleet: carriers --------------------------------------------------------

@router.get("/me/carriers", response_model=list[OrgCarrierResponse])
async def list_my_carriers(
    org: Organization = Depends(get_current_org),
    service: OrganizationService = Depends(get_org_service),
) -> list[OrgCarrierResponse]:
    """List the organization's fleet (active and inactive links)."""
    return [OrgCarrierResponse(**row) for row in await service.list_fleet(org)]


@router.post("/me/carriers", response_model=OrgCarrierResponse,
             status_code=status.HTTP_201_CREATED)
async def link_carrier(
    data: LinkCarrierRequest,
    org: Organization = Depends(get_current_org),
    service: OrganizationService = Depends(get_org_service),
) -> OrgCarrierResponse:
    """Link an existing carrier to the fleet (fleet orgs only)."""
    await service.link_carrier(org, data.carrier_id)
    return await _carrier_row(service, org, data.carrier_id)


@router.delete("/me/carriers/{carrier_id}", response_model=OrgCarrierResponse)
async def unlink_carrier(
    carrier_id: int,
    org: Organization = Depends(get_current_org),
    service: OrganizationService = Depends(get_org_service),
) -> OrgCarrierResponse:
    """Unlink a carrier (status=inactive, keeps the user). Fleet orgs only."""
    await service.unlink_carrier(org, carrier_id)
    return await _carrier_row(service, org, carrier_id)


async def _carrier_row(service: OrganizationService, org: Organization, carrier_id: int) -> OrgCarrierResponse:
    for row in await service.list_fleet(org):
        if row["carrier_id"] == carrier_id:
            return OrgCarrierResponse(**row)
    raise NotFoundError("Carrier link", code="CARRIER_LINK_NOT_FOUND")


# -- merchant: shipments ----------------------------------------------------

@router.get("/me/shipments", response_model=list[OrgShipmentResponse])
async def list_my_shipments(
    status_filter: str | None = Query(default=None, alias="status"),
    skip: int = 0,
    limit: int = 50,
    org: Organization = Depends(get_current_org),
    service: OrganizationService = Depends(get_org_service),
) -> list[OrgShipmentResponse]:
    """Shipments created by the organization (optional ?status= filter)."""
    shipments, _ = await service.list_shipments(org, status_filter, skip, limit)
    return [OrgShipmentResponse.model_validate(s) for s in shipments]


@router.post("/me/shipments", response_model=OrgShipmentResponse,
             status_code=status.HTTP_201_CREATED)
async def create_my_shipment(
    data: OrgShipmentCreate,
    current_user_id: CurrentUserId,
    org: Organization = Depends(get_current_org),
    service: OrganizationService = Depends(get_org_service),
) -> OrgShipmentResponse:
    """Create a shipment as a merchant org (merchant orgs only)."""
    shipment = await service.create_shipment(
        org, owner_user_id=current_user_id, **data.model_dump()
    )
    return OrgShipmentResponse.model_validate(shipment)
