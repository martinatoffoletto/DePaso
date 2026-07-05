"""
Organizations module repository for data access.
"""
from sqlalchemy.orm import Session

from src.app.modules.organizations.models import (
    Organization,
    OrganizationCarrier,
    OrganizationMember,
)
from src.app.shared.base_repository import BaseRepository
from src.app.shared.enums import OrganizationCarrierStatus


class OrganizationRepository(BaseRepository[Organization]):
    """Data access for organizations and their memberships/carriers."""

    def __init__(self, db: Session) -> None:
        super().__init__(Organization, db)

    def get_by_cuit(self, cuit: str) -> Organization | None:
        return self.db.query(Organization).filter(Organization.cuit == cuit).first()

    # -- members --------------------------------------------------------------

    def add_member(self, org_id: int, user_id: int, role: str) -> OrganizationMember:
        from datetime import datetime, timezone

        member = OrganizationMember(
            org_id=org_id, user_id=user_id, role=role,
            joined_at=datetime.now(timezone.utc).replace(tzinfo=None),
        )
        self.db.add(member)
        self.db.commit()
        self.db.refresh(member)
        return member

    def get_membership(self, org_id: int, user_id: int) -> OrganizationMember | None:
        return (
            self.db.query(OrganizationMember)
            .filter(
                OrganizationMember.org_id == org_id,
                OrganizationMember.user_id == user_id,
            )
            .first()
        )

    def list_memberships_for_user(self, user_id: int) -> list[OrganizationMember]:
        return (
            self.db.query(OrganizationMember)
            .filter(OrganizationMember.user_id == user_id)
            .order_by(OrganizationMember.created_at.desc())
            .all()
        )

    # -- fleet carriers -------------------------------------------------------

    def get_carrier_link(self, org_id: int, carrier_id: int) -> OrganizationCarrier | None:
        return (
            self.db.query(OrganizationCarrier)
            .filter(
                OrganizationCarrier.org_id == org_id,
                OrganizationCarrier.carrier_id == carrier_id,
            )
            .first()
        )

    def link_carrier(self, org_id: int, carrier_id: int) -> OrganizationCarrier:
        from datetime import datetime, timezone

        now = datetime.now(timezone.utc).replace(tzinfo=None)
        link = self.get_carrier_link(org_id, carrier_id)
        if link is not None:
            # Re-linking a previously removed carrier reactivates the row.
            link.status = OrganizationCarrierStatus.ACTIVE
            link.linked_at = now
            link.unlinked_at = None
        else:
            link = OrganizationCarrier(
                org_id=org_id, carrier_id=carrier_id,
                status=OrganizationCarrierStatus.ACTIVE, linked_at=now,
            )
            self.db.add(link)
        self.db.commit()
        self.db.refresh(link)
        return link

    def unlink_carrier(self, org_id: int, carrier_id: int) -> OrganizationCarrier | None:
        from datetime import datetime, timezone

        link = self.get_carrier_link(org_id, carrier_id)
        if link is None:
            return None
        link.status = OrganizationCarrierStatus.INACTIVE
        link.unlinked_at = datetime.now(timezone.utc).replace(tzinfo=None)
        self.db.commit()
        self.db.refresh(link)
        return link

    def list_carrier_links(self, org_id: int, active_only: bool = False) -> list[OrganizationCarrier]:
        query = self.db.query(OrganizationCarrier).filter(
            OrganizationCarrier.org_id == org_id
        )
        if active_only:
            query = query.filter(
                OrganizationCarrier.status == OrganizationCarrierStatus.ACTIVE
            )
        return query.order_by(OrganizationCarrier.linked_at.desc()).all()

    def active_carrier_ids(self, org_id: int) -> list[int]:
        rows = self.list_carrier_links(org_id, active_only=True)
        return [r.carrier_id for r in rows]
