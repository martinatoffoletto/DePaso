"""
Tracking module repository.
"""
from sqlalchemy.orm import Session

from src.app.shared.base_repository import BaseRepository
from src.app.modules.tracking.models import GpsTrace


class TrackingRepository(BaseRepository[GpsTrace]):
    """Repository for GPS trace data."""

    def __init__(self, db: Session) -> None:
        super().__init__(GpsTrace, db)

    def latest_for_shipment(self, shipment_id: int) -> GpsTrace | None:
        return (
            self.db.query(GpsTrace)
            .filter(GpsTrace.shipment_id == shipment_id)
            .order_by(GpsTrace.created_at.desc())
            .first()
        )

    def history_for_shipment(self, shipment_id: int, limit: int = 500) -> list[GpsTrace]:
        return (
            self.db.query(GpsTrace)
            .filter(GpsTrace.shipment_id == shipment_id)
            .order_by(GpsTrace.created_at)
            .limit(limit)
            .all()
        )
