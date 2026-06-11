"""
Routes module repository for data access.
"""
from datetime import datetime

from sqlalchemy.orm import Session

from src.app.shared.base_repository import BaseRepository
from src.app.modules.routes.models import CarrierRoute


class RouteRepository(BaseRepository[CarrierRoute]):
    """Repository for carrier route data access."""

    def __init__(self, db: Session) -> None:
        super().__init__(CarrierRoute, db)

    def list_by_carrier(self, carrier_id: int) -> list[CarrierRoute]:
        """All routes published by a carrier."""
        return (
            self.db.query(CarrierRoute)
            .filter(CarrierRoute.carrier_id == carrier_id)
            .order_by(CarrierRoute.window_start)
            .all()
        )

    def list_active_in_window(self, at: datetime | None = None) -> list[CarrierRoute]:
        """Active routes whose time window contains the given moment (default: now).

        Recurring routes are stored with a reference window; for the prototype
        we match on time-of-day overlap handled at service level, so here we
        only filter active ones whose window has not fully expired.
        """
        at = at or datetime.utcnow()
        return (
            self.db.query(CarrierRoute)
            .filter(
                CarrierRoute.is_active == True,
                CarrierRoute.window_end >= at,
            )
            .all()
        )

    def deactivate(self, route_id: int) -> bool:
        """Deactivate a route. Returns True if found."""
        route = self.get_by_id(route_id)
        if not route:
            return False
        route.is_active = False
        self.db.commit()
        return True
