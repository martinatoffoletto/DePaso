"""
Carriers module service.
Business logic for carrier management.
"""
from src.app.modules.carriers.repository import CarrierRepository
from src.app.modules.carriers.models import Carrier
from src.app.modules.carriers.exceptions import CarrierNotFoundError
from src.app.modules.shipments import pricing


class CarrierService:
    """Service for carrier business logic."""

    def __init__(self, repository: CarrierRepository) -> None:
        """Initialize with repository."""
        self.repository = repository

    def summary(self, carrier_id: int, shipment_repo) -> dict:
        """Carrier history: deliveries, net earnings, reputation, CO2 (RF-CAR-06).

        Earnings are net of the platform commission. Uses targeted queries
        (delivered + active) instead of loading the full shipment history.
        """
        carrier = self.get_carrier_by_id(carrier_id)  # raises if missing
        delivered = shipment_repo.list_delivered_by_carriers([carrier_id])
        active = shipment_repo.list_active_by_carrier(carrier_id)
        return {
            "carrier_id": carrier.id,
            "reputation": carrier.reputation or 5.0,
            "deliveries_completed": len(delivered),
            "active_shipments": len(active),
            "total_earnings": round(
                sum(pricing.carrier_payout(s.estimated_price or 0) for s in delivered), 2
            ),
            "total_co2_saved_kg": round(sum(s.co2_savings_kg or 0 for s in delivered), 3),
        }

    def create_carrier(self, user_id: int, company_name: str, vehicle_type: str,
                       license_plate: str, capacity_kg: float,
                       capacity_volume_m3: float | None = None) -> Carrier:
        """Create a new carrier profile."""
        return self.repository.create(
            user_id=user_id,
            company_name=company_name,
            vehicle_type=vehicle_type,
            license_plate=license_plate,
            capacity_kg=capacity_kg,
            capacity_volume_m3=capacity_volume_m3,
        )

    def get_carrier_by_id(self, carrier_id: int) -> Carrier:
        """Get a carrier by ID. Raises CarrierNotFoundError if not found."""
        carrier = self.repository.get_by_id(carrier_id)
        if not carrier:
            raise CarrierNotFoundError()
        return carrier

    def get_carrier_by_user_id(self, user_id: int) -> Carrier:
        """Get carrier profile by user ID."""
        carrier = self.repository.get_by_user_id(user_id)
        if not carrier:
            raise CarrierNotFoundError()
        return carrier

    def list_carriers(self, skip: int = 0, limit: int = 20) -> tuple[list[Carrier], int]:
        """List active and verified carriers."""
        return self.repository.list_active(skip, limit)

    def update_carrier(self, carrier_id: int, **kwargs: object) -> Carrier:
        """Update carrier information."""
        carrier = self.repository.update(carrier_id, **kwargs)
        if not carrier:
            raise CarrierNotFoundError()
        return carrier

    def update_reputation(self, carrier_id: int, new_rating: float) -> Carrier:
        """Update carrier reputation score."""
        self.get_carrier_by_id(carrier_id)  # validates existence (raises if missing)
        # Simple running average (can be improved with weighted average)
        updated = self.repository.update(carrier_id, reputation=new_rating)
        if not updated:
            raise CarrierNotFoundError()
        return updated

    def get_available_carriers(self, min_capacity_kg: float) -> list[Carrier]:
        """Get carriers with sufficient capacity for a shipment."""
        return self.repository.list_with_capacity(min_capacity_kg)
