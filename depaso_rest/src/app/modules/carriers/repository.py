"""
Carriers module repository for data access.
"""
from sqlalchemy.orm import Session

from src.app.shared.base_repository import BaseRepository
from src.app.modules.carriers.models import Carrier


class CarrierRepository(BaseRepository[Carrier]):
    """Repository for carrier data access."""

    def __init__(self, db: Session) -> None:
        super().__init__(Carrier, db)

    def get_by_user_id(self, user_id: int) -> Carrier | None:
        """Get carrier profile by user ID."""
        return self.db.query(Carrier).filter(Carrier.user_id == user_id).first()

    def list_active(self, skip: int = 0, limit: int = 20) -> tuple[list[Carrier], int]:
        """List all active and verified carriers."""
        query = self.db.query(Carrier).filter(
            Carrier.is_active == True,
            Carrier.is_verified == True,
        )
        total = query.count()
        carriers = query.offset(skip).limit(limit).all()
        return carriers, total

    def list_available_by_vehicle_type(self, vehicle_type: str) -> list[Carrier]:
        """List active carriers filtered by vehicle type."""
        return self.db.query(Carrier).filter(
            Carrier.is_active == True,
            Carrier.is_verified == True,
            Carrier.vehicle_type == vehicle_type,
        ).all()

    def list_with_capacity(self, min_capacity_kg: float) -> list[Carrier]:
        """List carriers with at least the given capacity."""
        return self.db.query(Carrier).filter(
            Carrier.is_active == True,
            Carrier.is_verified == True,
            Carrier.capacity_kg >= min_capacity_kg,
        ).all()
