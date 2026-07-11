"""
Carriers module repository for data access.
"""
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.app.shared.base_repository import BaseRepository
from src.app.modules.carriers.models import Carrier


class CarrierRepository(BaseRepository[Carrier]):
    """Repository for carrier data access."""

    def __init__(self, db: AsyncSession) -> None:
        super().__init__(Carrier, db)

    async def get_by_id_for_update(self, carrier_id: int) -> Carrier | None:
        """Get a carrier locking its row until the request commits (SELECT FOR
        UPDATE). Serializes concurrent accepts on the SAME carrier so the
        capacity/exclusivity checks can't race. No-op on SQLite (single writer).
        """
        result = await self.db.execute(
            select(Carrier).where(Carrier.id == carrier_id).with_for_update()
        )
        return result.scalar_one_or_none()

    async def get_by_user_id(self, user_id: int) -> Carrier | None:
        """Get carrier profile by user ID."""
        result = await self.db.execute(select(Carrier).where(Carrier.user_id == user_id))
        return result.scalar_one_or_none()

    async def clear_license_plate(self, carrier_id: int) -> None:
        """Set license_plate to NULL (BaseRepository.update saltea Nones)."""
        carrier = await self.get_by_id(carrier_id)
        if carrier:
            carrier.license_plate = None
            await self.db.flush()

    async def get_by_ids(self, carrier_ids: list[int]) -> dict[int, Carrier]:
        """Batch-fetch carriers by id, keyed by id (avoids N+1 in loops)."""
        if not carrier_ids:
            return {}
        result = await self.db.execute(select(Carrier).where(Carrier.id.in_(carrier_ids)))
        return {c.id: c for c in result.scalars().all()}

    async def list_active(self, skip: int = 0, limit: int = 20) -> tuple[list[Carrier], int]:
        """List all active and verified carriers."""
        base = select(Carrier).where(
            Carrier.is_active == True,  # noqa: E712
            Carrier.is_verified == True,  # noqa: E712
        )
        total = (
            await self.db.execute(select(func.count()).select_from(base.subquery()))
        ).scalar_one()
        carriers = (await self.db.execute(base.offset(skip).limit(limit))).scalars().all()
        return list(carriers), total

    async def list_available_by_vehicle_type(self, vehicle_type: str) -> list[Carrier]:
        """List active carriers filtered by vehicle type."""
        result = await self.db.execute(
            select(Carrier).where(
                Carrier.is_active == True,  # noqa: E712
                Carrier.is_verified == True,  # noqa: E712
                Carrier.vehicle_type == vehicle_type,
            )
        )
        return list(result.scalars().all())

    async def list_with_capacity(self, min_capacity_kg: float) -> list[Carrier]:
        """List carriers with at least the given capacity."""
        result = await self.db.execute(
            select(Carrier).where(
                Carrier.is_active == True,  # noqa: E712
                Carrier.is_verified == True,  # noqa: E712
                Carrier.capacity_kg >= min_capacity_kg,
            )
        )
        return list(result.scalars().all())

    async def list_available_with_location(self, min_capacity_kg: float) -> list[Carrier]:
        """List available carriers that have a known location (for matching)."""
        result = await self.db.execute(
            select(Carrier).where(
                Carrier.is_active == True,  # noqa: E712
                Carrier.is_verified == True,  # noqa: E712
                Carrier.is_available == True,  # noqa: E712
                Carrier.capacity_kg >= min_capacity_kg,
                Carrier.current_lat.isnot(None),
                Carrier.current_lon.isnot(None),
            )
        )
        return list(result.scalars().all())
