"""
Shipments module repository for data access.
"""
from sqlalchemy.orm import Session

from src.app.shared.base_repository import BaseRepository
from src.app.shared.enums import ShipmentStatus
from src.app.modules.shipments.models import Shipment


class ShipmentRepository(BaseRepository[Shipment]):
    """Repository for shipment data access."""

    def __init__(self, db: Session) -> None:
        super().__init__(Shipment, db)

    def list_by_client(self, client_id: int, skip: int = 0, limit: int = 20) -> tuple[list[Shipment], int]:
        """List shipments for a specific client."""
        query = self.db.query(Shipment).filter(Shipment.client_id == client_id)
        total = query.count()
        shipments = query.order_by(Shipment.created_at.desc()).offset(skip).limit(limit).all()
        return shipments, total

    def list_by_carrier(self, carrier_id: int, skip: int = 0, limit: int = 20) -> tuple[list[Shipment], int]:
        """List shipments assigned to a specific carrier."""
        query = self.db.query(Shipment).filter(Shipment.carrier_id == carrier_id)
        total = query.count()
        shipments = query.order_by(Shipment.created_at.desc()).offset(skip).limit(limit).all()
        return shipments, total

    def list_by_status(self, status: str, skip: int = 0, limit: int = 20) -> tuple[list[Shipment], int]:
        """List shipments filtered by status."""
        query = self.db.query(Shipment).filter(Shipment.status == status)
        total = query.count()
        shipments = query.order_by(Shipment.created_at.desc()).offset(skip).limit(limit).all()
        return shipments, total

    def list_pending(self) -> list[Shipment]:
        """List all pending shipments (for matching algorithm)."""
        return self.db.query(Shipment).filter(
            Shipment.status == ShipmentStatus.PENDING
        ).all()

    def update_status(self, shipment_id: int, new_status: str) -> Shipment | None:
        """Update shipment status."""
        return self.update(shipment_id, status=new_status)

    def assign_carrier(self, shipment_id: int, carrier_id: int) -> Shipment | None:
        """Assign a carrier to a shipment."""
        return self.update(shipment_id, carrier_id=carrier_id, status=ShipmentStatus.ASSIGNED)
