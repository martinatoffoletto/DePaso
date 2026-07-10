"""
Organizations module repository for data access.
"""
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.app.modules.organizations.models import (
    Organization,
    OrganizationCarrier,
    OrganizationMember,
)
from src.app.shared.base_repository import BaseRepository
from src.app.shared.enums import OrganizationCarrierStatus


class OrganizationRepository(BaseRepository[Organization]):
    """Data access for organizations and their memberships/carriers."""

    def __init__(self, db: AsyncSession) -> None:
        super().__init__(Organization, db)

    async def get_by_cuit(self, cuit: str) -> Organization | None:
        result = await self.db.execute(select(Organization).where(Organization.cuit == cuit))
        return result.scalar_one_or_none()

    # -- members --------------------------------------------------------------

    async def add_member(self, org_id: int, user_id: int, role: str) -> OrganizationMember:
        from datetime import datetime, timezone

        member = OrganizationMember(
            org_id=org_id, user_id=user_id, role=role,
            joined_at=datetime.now(timezone.utc).replace(tzinfo=None),
        )
        self.db.add(member)
        await self.db.flush()
        await self.db.refresh(member)
        return member

    async def get_membership(self, org_id: int, user_id: int) -> OrganizationMember | None:
        result = await self.db.execute(
            select(OrganizationMember).where(
                OrganizationMember.org_id == org_id,
                OrganizationMember.user_id == user_id,
            )
        )
        return result.scalars().first()

    async def list_memberships_for_user(self, user_id: int) -> list[OrganizationMember]:
        result = await self.db.execute(
            select(OrganizationMember)
            .where(OrganizationMember.user_id == user_id)
            .order_by(OrganizationMember.created_at.desc())
        )
        return list(result.scalars().all())

    # -- fleet carriers -------------------------------------------------------

    async def get_carrier_link(self, org_id: int, carrier_id: int) -> OrganizationCarrier | None:
        result = await self.db.execute(
            select(OrganizationCarrier).where(
                OrganizationCarrier.org_id == org_id,
                OrganizationCarrier.carrier_id == carrier_id,
            )
        )
        return result.scalars().first()

    async def link_carrier(self, org_id: int, carrier_id: int) -> OrganizationCarrier:
        from datetime import datetime, timezone

        now = datetime.now(timezone.utc).replace(tzinfo=None)
        link = await self.get_carrier_link(org_id, carrier_id)
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
        await self.db.flush()
        await self.db.refresh(link)
        return link

    async def unlink_carrier(self, org_id: int, carrier_id: int) -> OrganizationCarrier | None:
        from datetime import datetime, timezone

        link = await self.get_carrier_link(org_id, carrier_id)
        if link is None:
            return None
        link.status = OrganizationCarrierStatus.INACTIVE
        link.unlinked_at = datetime.now(timezone.utc).replace(tzinfo=None)
        await self.db.flush()
        await self.db.refresh(link)
        return link

    async def list_carrier_links(self, org_id: int, active_only: bool = False) -> list[OrganizationCarrier]:
        query = select(OrganizationCarrier).where(OrganizationCarrier.org_id == org_id)
        if active_only:
            query = query.where(
                OrganizationCarrier.status == OrganizationCarrierStatus.ACTIVE
            )
        result = await self.db.execute(query.order_by(OrganizationCarrier.linked_at.desc()))
        return list(result.scalars().all())

    async def active_carrier_ids(self, org_id: int) -> list[int]:
        rows = await self.list_carrier_links(org_id, active_only=True)
        return [r.carrier_id for r in rows]
