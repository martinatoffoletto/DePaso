"""
Tracking module repository.
"""
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.app.shared.base_repository import BaseRepository
from src.app.modules.tracking.models import GpsTrace


class TrackingRepository(BaseRepository[GpsTrace]):
    """Repository for GPS trace data."""

    def __init__(self, db: AsyncSession) -> None:
        super().__init__(GpsTrace, db)

    async def latest_for_shipment(self, shipment_id: int) -> GpsTrace | None:
        result = await self.db.execute(
            select(GpsTrace)
            .where(GpsTrace.shipment_id == shipment_id)
            .order_by(GpsTrace.created_at.desc())
            .limit(1)
        )
        return result.scalars().first()

    async def history_for_shipment(self, shipment_id: int, limit: int = 500) -> list[GpsTrace]:
        result = await self.db.execute(
            select(GpsTrace)
            .where(GpsTrace.shipment_id == shipment_id)
            .order_by(GpsTrace.created_at)
            .limit(limit)
        )
        return list(result.scalars().all())
