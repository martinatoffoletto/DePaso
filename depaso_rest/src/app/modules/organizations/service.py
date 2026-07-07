"""
Organizations module service — B2B pyme business logic.

Two organization types (a single org may be `both`):
  - fleet:    manages linking/unlinking of its carriers (never deletes them).
  - merchant: creates/schedules shipments reusing shipments.service (no logic
              duplication) — every shipment is stamped with organization_id.

The "org" role is derived from organization_members, never from the JWT.
"""
from collections import defaultdict

from src.app.modules.carriers.repository import CarrierRepository
from src.app.modules.organizations.exceptions import (
    CarrierNotLinkableError,
    OrganizationAlreadyExistsError,
    OrganizationNotFoundError,
    OrgKindNotAllowedError,
)
from src.app.modules.organizations.models import Organization, OrganizationMember
from src.app.modules.organizations.repository import OrganizationRepository
from src.app.modules.shipments import pricing
from src.app.modules.shipments.models import Shipment
from src.app.modules.shipments.repository import ShipmentRepository
from src.app.modules.shipments.service import ShipmentService
from src.app.shared.enums import (
    OrganizationCarrierStatus,
    OrganizationKind,
    OrganizationMemberRole,
    ShipmentStatus,
)

ACTIVE_STATUSES = {
    ShipmentStatus.ASSIGNED,
    ShipmentStatus.PICKUP_ARRIVED,
    ShipmentStatus.IN_TRANSIT,
}

_FLEET_KINDS = {OrganizationKind.FLEET, OrganizationKind.BOTH}
_MERCHANT_KINDS = {OrganizationKind.MERCHANT, OrganizationKind.BOTH}


class OrganizationService:
    """Service for organization (pyme) business logic."""

    def __init__(
        self,
        org_repo: OrganizationRepository,
        carrier_repo: CarrierRepository,
        shipment_repo: ShipmentRepository,
        shipment_service: ShipmentService,
    ) -> None:
        self.org_repo = org_repo
        self.carrier_repo = carrier_repo
        self.shipment_repo = shipment_repo
        self.shipment_service = shipment_service

    # -- organization lifecycle ------------------------------------------------

    def create_organization(self, owner_user_id: int, name: str, cuit: str,
                            kind: str) -> Organization:
        """Create an org; the caller becomes owner + first member."""
        if self.org_repo.get_by_cuit(cuit):
            raise OrganizationAlreadyExistsError()
        org = self.org_repo.create(
            name=name, cuit=cuit, kind=kind, owner_user_id=owner_user_id,
        )
        self.org_repo.add_member(org.id, owner_user_id, OrganizationMemberRole.OWNER)
        return org

    def get_organization(self, org_id: int) -> Organization:
        org = self.org_repo.get_by_id(org_id)
        if not org:
            raise OrganizationNotFoundError()
        return org

    def update_organization(self, org_id: int, **updates) -> Organization:
        self.get_organization(org_id)
        clean = {k: v for k, v in updates.items() if v is not None}
        return self.org_repo.update(org_id, **clean)

    def list_my_organizations(self, user_id: int) -> list[tuple[Organization, str]]:
        """Organizations the user administers, with their role in each."""
        result: list[tuple[Organization, str]] = []
        for m in self.org_repo.list_memberships_for_user(user_id):
            org = self.org_repo.get_by_id(m.org_id)
            if org is not None:
                result.append((org, m.role))
        return result

    def resolve_membership(self, user_id: int) -> tuple[Organization, OrganizationMember] | None:
        """Resolve the caller's active organization (most recent membership).

        MVP assumption: an administrator manages one org; if they belong to
        several, the most recently joined one is used.
        """
        memberships = self.org_repo.list_memberships_for_user(user_id)
        for m in memberships:
            org = self.org_repo.get_by_id(m.org_id)
            if org is not None:
                return org, m
        return None

    # -- fleet: carrier management ---------------------------------------------

    def link_carrier(self, org: Organization, carrier_id: int):
        self._require_kind(org, _FLEET_KINDS, "manage fleet carriers")
        carrier = self.carrier_repo.get_by_id(carrier_id)
        if carrier is None:
            raise CarrierNotLinkableError("Carrier not found.")
        return self.org_repo.link_carrier(org.id, carrier_id)

    def unlink_carrier(self, org: Organization, carrier_id: int):
        self._require_kind(org, _FLEET_KINDS, "manage fleet carriers")
        link = self.org_repo.unlink_carrier(org.id, carrier_id)
        if link is None:
            raise CarrierNotLinkableError("Carrier is not linked to this organization.")
        return link

    def list_fleet(self, org: Organization) -> list[dict]:
        """Carrier profiles + link metadata for the org's fleet."""
        rows: list[dict] = []
        for link in self.org_repo.list_carrier_links(org.id):
            carrier = self.carrier_repo.get_by_id(link.carrier_id)
            if carrier is None:
                continue
            rows.append({
                "carrier_id": carrier.id,
                "company_name": carrier.company_name,
                "vehicle_type": carrier.vehicle_type,
                "license_plate": carrier.license_plate,
                "capacity_kg": carrier.capacity_kg,
                "reputation": carrier.reputation or 0.0,
                "is_active": carrier.is_active,
                "is_verified": carrier.is_verified,
                "status": link.status,
                "linked_at": link.linked_at,
                "unlinked_at": link.unlinked_at,
            })
        return rows

    # -- merchant: shipments ---------------------------------------------------

    def create_shipment(self, org: Organization, owner_user_id: int, **data) -> Shipment:
        """Create a shipment on behalf of the merchant org.

        Reuses shipments.service for pricing/state, then stamps organization_id.
        """
        self._require_kind(org, _MERCHANT_KINDS, "create shipments")
        shipment = self.shipment_service.create_shipment(client_id=owner_user_id, **data)
        updated = self.shipment_repo.update(shipment.id, organization_id=org.id)
        return updated or shipment

    def list_shipments(self, org: Organization, status: str | None = None,
                       skip: int = 0, limit: int = 50) -> tuple[list[Shipment], int]:
        return self.shipment_repo.list_by_organization(org.id, status, skip, limit)

    # -- monitoring & finance --------------------------------------------------

    def dashboard(self, org: Organization) -> dict:
        shipments = self.shipment_repo.list_all_by_organization(org.id)
        active_carrier_ids = self.org_repo.active_carrier_ids(org.id)
        earned_shipments = self.shipment_repo.list_delivered_by_carriers(active_carrier_ids)

        return {
            "organization_id": org.id,
            "kind": org.kind,
            "fleet_size": len(active_carrier_ids),
            "shipments_total": len(shipments),
            "shipments_active": sum(1 for s in shipments if s.status in ACTIVE_STATUSES),
            "shipments_pending": sum(1 for s in shipments if s.status == ShipmentStatus.PENDING),
            "shipments_delivered": sum(1 for s in shipments if s.status == ShipmentStatus.DELIVERED),
            "total_spent": round(sum(s.estimated_price or 0.0 for s in shipments), 2),
            # Earned by the fleet is net of the platform commission (payout).
            "total_earned": round(sum(pricing.carrier_payout(s.estimated_price or 0.0) for s in earned_shipments), 2),
            "total_co2_saved_kg": round(
                sum(s.co2_savings_kg or 0.0 for s in shipments
                    if s.status == ShipmentStatus.DELIVERED), 3
            ),
        }

    def finance(self, org: Organization) -> dict:
        """Money put in (spent on org shipments) vs earned (by the fleet),
        aggregated per calendar month plus an accumulated total.

        Aggregation is done in Python to stay portable across SQLite/Postgres.
        Spent is keyed by shipment creation month; earned by delivery month
        (updated_at of the delivered shipment).
        """
        spent_shipments = self.shipment_repo.list_all_by_organization(org.id)
        active_carrier_ids = self.org_repo.active_carrier_ids(org.id)
        earned_shipments = self.shipment_repo.list_delivered_by_carriers(active_carrier_ids)

        spent = self._series(
            [(s.created_at, s.estimated_price or 0.0) for s in spent_shipments]
        )
        earned = self._series(
            [(s.updated_at, pricing.carrier_payout(s.estimated_price or 0.0)) for s in earned_shipments]
        )
        return {
            "organization_id": org.id,
            "currency": "ARS",
            "spent": spent,
            "earned": earned,
        }

    # -- helpers ---------------------------------------------------------------

    @staticmethod
    def _series(rows: list[tuple]) -> dict:
        buckets: dict[str, float] = defaultdict(float)
        total = 0.0
        for when, amount in rows:
            total += amount
            if when is not None:
                buckets[when.strftime("%Y-%m")] += amount
        by_month = [
            {"month": m, "amount": round(v, 2)} for m, v in sorted(buckets.items())
        ]
        return {"total": round(total, 2), "by_month": by_month}

    @staticmethod
    def _require_kind(org: Organization, allowed: set[str], action: str) -> None:
        if org.kind not in allowed:
            raise OrgKindNotAllowedError(action)
