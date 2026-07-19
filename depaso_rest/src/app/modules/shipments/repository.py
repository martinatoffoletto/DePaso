"""
Shipments module repository for data access.
"""
from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from src.app.shared.base_repository import BaseRepository
from src.app.shared.enums import ShipmentStatus
from src.app.modules.shipments.models import Shipment, ShipmentEvent, Rating


class ShipmentRepository(BaseRepository[Shipment]):
    """Repository for shipment data access."""

    def __init__(self, db: AsyncSession) -> None:
        super().__init__(Shipment, db)

    async def _paged(self, base, skip: int, limit: int) -> tuple[list[Shipment], int]:
        total = (
            await self.db.execute(select(func.count()).select_from(base.subquery()))
        ).scalar_one()
        result = await self.db.execute(
            base.order_by(Shipment.created_at.desc()).offset(skip).limit(limit)
        )
        return list(result.scalars().all()), total

    async def list_by_client(self, client_id: int, skip: int = 0, limit: int = 20) -> tuple[list[Shipment], int]:
        """List shipments for a specific client."""
        return await self._paged(select(Shipment).where(Shipment.client_id == client_id), skip, limit)

    async def list_by_carrier(self, carrier_id: int, skip: int = 0, limit: int = 20) -> tuple[list[Shipment], int]:
        """List shipments assigned to a specific carrier."""
        return await self._paged(select(Shipment).where(Shipment.carrier_id == carrier_id), skip, limit)

    async def list_by_status(self, status: str, skip: int = 0, limit: int = 20) -> tuple[list[Shipment], int]:
        """List shipments filtered by status."""
        return await self._paged(select(Shipment).where(Shipment.status == status), skip, limit)

    async def list_pending(self) -> list[Shipment]:
        """List all pending shipments (for matching algorithm)."""
        result = await self.db.execute(
            select(Shipment).where(Shipment.status == ShipmentStatus.PENDING)
        )
        return list(result.scalars().all())

    async def list_by_organization(self, org_id: int, status: str | None = None,
                                   skip: int = 0, limit: int = 50) -> tuple[list[Shipment], int]:
        """Shipments created by a merchant organization (optionally by status)."""
        base = select(Shipment).where(Shipment.organization_id == org_id)
        if status is not None:
            base = base.where(Shipment.status == status)
        return await self._paged(base, skip, limit)

    async def list_all_by_organization(self, org_id: int) -> list[Shipment]:
        """Every shipment of an organization (for dashboard/finance aggregation)."""
        result = await self.db.execute(
            select(Shipment).where(Shipment.organization_id == org_id)
        )
        return list(result.scalars().all())

    async def list_delivered_by_carriers(self, carrier_ids: list[int]) -> list[Shipment]:
        """Delivered shipments handled by any of the given carriers (fleet earnings)."""
        if not carrier_ids:
            return []
        result = await self.db.execute(
            select(Shipment).where(
                Shipment.carrier_id.in_(carrier_ids),
                Shipment.status == ShipmentStatus.DELIVERED,
            )
        )
        return list(result.scalars().all())

    async def count_delivered_by_carrier(self, carrier_id: int) -> int:
        """Number of delivered shipments for a carrier (COUNT, not load-all)."""
        return (
            await self.db.execute(
                select(func.count()).select_from(Shipment).where(
                    Shipment.carrier_id == carrier_id,
                    Shipment.status == ShipmentStatus.DELIVERED,
                )
            )
        ).scalar_one()

    async def list_active_by_carrier(self, carrier_id: int) -> list[Shipment]:
        """Shipments the carrier is currently working on."""
        result = await self.db.execute(
            select(Shipment).where(
                Shipment.carrier_id == carrier_id,
                Shipment.status.in_([
                    ShipmentStatus.ASSIGNED,
                    ShipmentStatus.PICKUP_ARRIVED,
                    ShipmentStatus.IN_TRANSIT,
                ]),
            )
        )
        return list(result.scalars().all())

    # -- atomic state transitions (anti double-accept race) -----------------------

    async def transition_status(self, shipment_id: int, from_status: str,
                                new_status: str) -> Shipment | None:
        """Atomically move a shipment from one status to another.

        The WHERE clause on the CURRENT status makes this a compare-and-set:
        if two requests race, only one UPDATE matches and the other returns
        None. This is what prevents e.g. two carriers accepting the same
        shipment — the guarantee holds across workers and instances because
        it lives in the DB, not in Python.
        """
        result = await self.db.execute(
            update(Shipment)
            .where(Shipment.id == shipment_id, Shipment.status == from_status)
            .values(status=new_status)
        )
        if result.rowcount == 0:
            return None
        await self.db.flush()
        return await self.get_by_id(shipment_id)

    async def assign_carrier_if_pending(self, shipment_id: int, carrier_id: int) -> Shipment | None:
        """Atomically assign a carrier to a PENDING shipment (compare-and-set)."""
        result = await self.db.execute(
            update(Shipment)
            .where(Shipment.id == shipment_id, Shipment.status == ShipmentStatus.PENDING)
            .values(carrier_id=carrier_id, status=ShipmentStatus.ASSIGNED)
        )
        if result.rowcount == 0:
            return None
        await self.db.flush()
        return await self.get_by_id(shipment_id)

    async def release_to_pending(self, shipment_id: int, carrier_id: int) -> Shipment | None:
        """Back to PENDING with no carrier (after a carrier cancels).

        Compare-and-set: only fires while the shipment is still assigned to
        THIS carrier and before it is in transit — a concurrent delivery or
        client cancellation makes the UPDATE match zero rows. Explicit UPDATE
        because the generic update() skips None values and would silently
        keep the old carrier_id.
        """
        result = await self.db.execute(
            update(Shipment)
            .where(
                Shipment.id == shipment_id,
                Shipment.carrier_id == carrier_id,
                Shipment.status.in_([ShipmentStatus.ASSIGNED, ShipmentStatus.PICKUP_ARRIVED]),
            )
            .values(status=ShipmentStatus.PENDING, carrier_id=None)
        )
        if result.rowcount == 0:
            return None
        await self.db.flush()
        return await self.get_by_id(shipment_id)

    async def mark_paid_if_pending(self, shipment_id: int, paid_status: str,
                                   pending_status: str) -> Shipment | None:
        """Atomically flip payment_status PENDING→PAID (prevents double pay)."""
        result = await self.db.execute(
            update(Shipment)
            .where(Shipment.id == shipment_id, Shipment.payment_status == pending_status)
            .values(payment_status=paid_status)
        )
        if result.rowcount == 0:
            return None
        await self.db.flush()
        return await self.get_by_id(shipment_id)

    # -- events (audit trail) ---------------------------------------------------

    async def add_event(self, shipment_id: int, status: str, actor_user_id: int | None = None,
                        lat: float | None = None, lon: float | None = None,
                        notes: str | None = None) -> ShipmentEvent:
        """Record a status transition event."""
        event = ShipmentEvent(
            shipment_id=shipment_id, status=status, actor_user_id=actor_user_id,
            lat=lat, lon=lon, notes=notes,
        )
        self.db.add(event)
        await self.db.flush()
        await self.db.refresh(event)
        return event

    async def list_events(self, shipment_id: int) -> list[ShipmentEvent]:
        """Status history of a shipment, oldest first."""
        result = await self.db.execute(
            select(ShipmentEvent)
            .where(ShipmentEvent.shipment_id == shipment_id)
            .order_by(ShipmentEvent.created_at)
        )
        return list(result.scalars().all())

    # -- ratings ------------------------------------------------------------------

    async def add_rating(self, shipment_id: int, carrier_id: int, client_id: int,
                         stars: int, comment: str | None) -> Rating:
        """Store a rating for a delivered shipment."""
        rating = Rating(
            shipment_id=shipment_id, carrier_id=carrier_id,
            client_id=client_id, stars=stars, comment=comment,
        )
        self.db.add(rating)
        await self.db.flush()
        await self.db.refresh(rating)
        return rating

    async def get_rating_by_shipment(self, shipment_id: int) -> Rating | None:
        result = await self.db.execute(
            select(Rating).where(Rating.shipment_id == shipment_id)
        )
        return result.scalars().first()

    async def list_ratings_by_carrier(self, carrier_id: int, limit: int = 50) -> list[Rating]:
        """Ratings received by a carrier, newest first (for the reviews screen)."""
        result = await self.db.execute(
            select(Rating)
            .where(Rating.carrier_id == carrier_id)
            .order_by(Rating.created_at.desc())
            .limit(limit)
        )
        return list(result.scalars().all())

    async def ratings_by_shipment_ids(self, shipment_ids: list[int]) -> dict[int, int]:
        """Return {shipment_id: stars} for the given shipment IDs (batch, no N+1)."""
        if not shipment_ids:
            return {}
        result = await self.db.execute(
            select(Rating.shipment_id, Rating.stars)
            .where(Rating.shipment_id.in_(shipment_ids))
        )
        return {row.shipment_id: row.stars for row in result.all()}

    async def carrier_rating_avg(self, carrier_id: int) -> float | None:
        """Average stars for a carrier across all ratings."""
        result = (
            await self.db.execute(
                select(func.avg(Rating.stars)).where(Rating.carrier_id == carrier_id)
            )
        ).scalar()
        return float(result) if result is not None else None
