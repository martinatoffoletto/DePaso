"""
Routes module repository for data access.
"""
from datetime import datetime, timezone

from sqlalchemy import or_, select
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
        """Active routes that may apply at the given moment (default: now).

        Incluye las recurrentes aunque su ventana de referencia haya expirado:
        la vigencia real (día habilitado + franja horaria) la decide
        routes.windows.effective_window en la capa de matching. Sin el OR,
        una ruta habitual desaparecía para siempre tras su primera ventana.
        """
        at = at or datetime.now(timezone.utc).replace(tzinfo=None)
        result = await self.db.execute(
            select(CarrierRoute).where(
                CarrierRoute.is_active == True,  # noqa: E712
                or_(
                    CarrierRoute.window_end >= at,
                    CarrierRoute.recurrence_days.isnot(None),
                ),
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
