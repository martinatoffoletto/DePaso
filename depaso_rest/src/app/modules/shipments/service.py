"""
Shipments module service.
Business logic for shipment management.
"""
from src.app.shared.enums import ShipmentStatus
from src.app.modules.shipments.repository import ShipmentRepository
from src.app.modules.shipments.models import Shipment
from src.app.modules.shipments.exceptions import ShipmentNotFoundError, InvalidShipmentStatusError


# Valid status transitions (RF-SHP-05)
VALID_TRANSITIONS: dict[str, list[str]] = {
    ShipmentStatus.PENDING: [ShipmentStatus.ASSIGNED, ShipmentStatus.CANCELLED],
    ShipmentStatus.ASSIGNED: [ShipmentStatus.IN_TRANSIT, ShipmentStatus.CANCELLED],
    ShipmentStatus.IN_TRANSIT: [ShipmentStatus.DELIVERED, ShipmentStatus.CANCELLED],
    ShipmentStatus.DELIVERED: [],
    ShipmentStatus.CANCELLED: [],
}


class ShipmentService:
    """Service for shipment business logic."""

    def __init__(self, repository: ShipmentRepository) -> None:
        """Initialize with repository."""
        self.repository = repository

    def create_shipment(self, client_id: int, package_size: str,
                        modality: str, assignment_mode: str,
                        origin_lat: float, origin_lon: float,
                        destination_lat: float, destination_lon: float,
                        weight_kg: float, photo_url: str | None = None) -> Shipment:
        """Create a new shipment."""
        return self.repository.create(
            client_id=client_id,
            package_size=package_size,
            modality=modality,
            assignment_mode=assignment_mode,
            origin_lat=origin_lat,
            origin_lon=origin_lon,
            destination_lat=destination_lat,
            destination_lon=destination_lon,
            weight_kg=weight_kg,
            photo_url=photo_url,
            status=ShipmentStatus.PENDING,
        )

    def get_shipment_by_id(self, shipment_id: int) -> Shipment:
        """Get a shipment by ID."""
        shipment = self.repository.get_by_id(shipment_id)
        if not shipment:
            raise ShipmentNotFoundError()
        return shipment

    def list_shipments_by_client(self, client_id: int, skip: int = 0, limit: int = 20) -> tuple[list[Shipment], int]:
        """List shipments for a client."""
        return self.repository.list_by_client(client_id, skip, limit)

    def list_shipments_by_carrier(self, carrier_id: int, skip: int = 0, limit: int = 20) -> tuple[list[Shipment], int]:
        """List shipments assigned to a carrier."""
        return self.repository.list_by_carrier(carrier_id, skip, limit)

    def update_status(self, shipment_id: int, new_status: str) -> Shipment:
        """Update shipment status with transition validation."""
        shipment = self.get_shipment_by_id(shipment_id)
        allowed = VALID_TRANSITIONS.get(shipment.status, [])
        if new_status not in allowed:
            raise InvalidShipmentStatusError(shipment.status, new_status)

        updated = self.repository.update_status(shipment_id, new_status)
        if not updated:
            raise ShipmentNotFoundError()
        return updated

    def cancel_shipment(self, shipment_id: int) -> Shipment:
        """Cancel a shipment (only from pending or assigned)."""
        return self.update_status(shipment_id, ShipmentStatus.CANCELLED)

    def assign_carrier(self, shipment_id: int, carrier_id: int) -> Shipment:
        """Assign a carrier to a pending shipment."""
        shipment = self.get_shipment_by_id(shipment_id)
        if shipment.status != ShipmentStatus.PENDING:
            raise InvalidShipmentStatusError(shipment.status, ShipmentStatus.ASSIGNED)

        updated = self.repository.assign_carrier(shipment_id, carrier_id)
        if not updated:
            raise ShipmentNotFoundError()
        return updated

    def list_pending(self) -> list[Shipment]:
        """Get all pending shipments (for matching)."""
        return self.repository.list_pending()
