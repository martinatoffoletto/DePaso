"""
Routes module repository for data access.
"""
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.app.shared.base_repository import BaseRepository
from src.app.modules.routes.models import CarrierRoute


class RouteRepository(BaseRepository[CarrierRoute]):
    """Repository for carrier route data access."""

    def __init__(self, db: AsyncSession) -> None:
        super().__init__(CarrierRoute, db)

    async def list_by_carrier(self, carrier_id: int) -> list[CarrierRoute]:
        """All routes published by a carrier."""
        result = await self.db.execute(
            select(CarrierRoute)
            .where(CarrierRoute.carrier_id == carrier_id)
            .order_by(CarrierRoute.window_start)
        )
        return list(result.scalars().all())

    async def list_active_in_window(self, at: datetime | None = None) -> list[CarrierRoute]:
        """Active routes whose time window contains the given moment (default: now).

        Recurring routes are stored with a reference window; for the prototype
        we match on time-of-day overlap handled at service level, so here we
        only filter active ones whose window has not fully expired.
        """
        at = at or datetime.now(timezone.utc).replace(tzinfo=None)
        result = await self.db.execute(
            select(CarrierRoute).where(
                CarrierRoute.is_active == True,  # noqa: E712
                CarrierRoute.window_end >= at,
            )
        )
        return list(result.scalars().all())

    async def deactivate(self, route_id: int) -> bool:
        """Deactivate a route. Returns True if found."""
        route = await self.get_by_id(route_id)
        if not route:
            return False
        route.is_active = False
        await self.db.flush()
        return True
