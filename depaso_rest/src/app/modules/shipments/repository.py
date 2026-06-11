"""
Shipments module repository for data access.
"""
from sqlalchemy.orm import Session

from src.app.shared.base_repository import BaseRepository
from src.app.shared.enums import ShipmentStatus
from src.app.modules.shipments.models import Shipment, ShipmentEvent, Rating


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

    def list_active_by_carrier(self, carrier_id: int) -> list[Shipment]:
        """Shipments the carrier is currently working on."""
        return self.db.query(Shipment).filter(
            Shipment.carrier_id == carrier_id,
            Shipment.status.in_([
                ShipmentStatus.ASSIGNED,
                ShipmentStatus.PICKUP_ARRIVED,
                ShipmentStatus.IN_TRANSIT,
            ]),
        ).all()

    def update_status(self, shipment_id: int, new_status: str) -> Shipment | None:
        """Update shipment status."""
        return self.update(shipment_id, status=new_status)

    def assign_carrier(self, shipment_id: int, carrier_id: int) -> Shipment | None:
        """Assign a carrier to a shipment."""
        return self.update(shipment_id, carrier_id=carrier_id, status=ShipmentStatus.ASSIGNED)

    # -- events (audit trail) ---------------------------------------------------

    def add_event(self, shipment_id: int, status: str, actor_user_id: int | None = None,
                  lat: float | None = None, lon: float | None = None,
                  notes: str | None = None) -> ShipmentEvent:
        """Record a status transition event."""
        event = ShipmentEvent(
            shipment_id=shipment_id, status=status, actor_user_id=actor_user_id,
            lat=lat, lon=lon, notes=notes,
        )
        self.db.add(event)
        self.db.commit()
        self.db.refresh(event)
        return event

    def list_events(self, shipment_id: int) -> list[ShipmentEvent]:
        """Status history of a shipment, oldest first."""
        return (
            self.db.query(ShipmentEvent)
            .filter(ShipmentEvent.shipment_id == shipment_id)
            .order_by(ShipmentEvent.created_at)
            .all()
        )

    # -- ratings ------------------------------------------------------------------

    def add_rating(self, shipment_id: int, carrier_id: int, client_id: int,
                   stars: int, comment: str | None) -> Rating:
        """Store a rating for a delivered shipment."""
        rating = Rating(
            shipment_id=shipment_id, carrier_id=carrier_id,
            client_id=client_id, stars=stars, comment=comment,
        )
        self.db.add(rating)
        self.db.commit()
        self.db.refresh(rating)
        return rating

    def get_rating_by_shipment(self, shipment_id: int) -> Rating | None:
        return self.db.query(Rating).filter(Rating.shipment_id == shipment_id).first()

    def carrier_rating_avg(self, carrier_id: int) -> float | None:
        """Average stars for a carrier across all ratings."""
        from sqlalchemy import func

        result = (
            self.db.query(func.avg(Rating.stars))
            .filter(Rating.carrier_id == carrier_id)
            .scalar()
        )
        return float(result) if result is not None else None
