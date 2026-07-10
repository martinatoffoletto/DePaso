"""
Tracking module - Carrier GPS publication and shipment location queries.

Polling-based (RF-TRK, RNF-PERF-04: up to 30 s of delay is acceptable).
Productive push notifications are out of scope (spec 7.2) — the client app
polls GET /tracking/{shipment_id} on an interval.
"""
from src.app.modules.tracking.models import GpsTrace
from src.app.modules.tracking.repository import TrackingRepository
from src.app.modules.carriers.repository import CarrierRepository
from src.app.modules.shipments.repository import ShipmentRepository
from src.app.shared.enums import ShipmentStatus
from src.app.shared.exceptions import ForbiddenError, NotFoundError

# Statuses during which the client may see the carrier position (RNF-PRV-02).
TRACKABLE_STATUSES = {
    ShipmentStatus.ASSIGNED,
    ShipmentStatus.PICKUP_ARRIVED,
    ShipmentStatus.IN_TRANSIT,
}


class TrackingService:
    """Service for shipment tracking."""

    def __init__(
        self,
        repository: TrackingRepository,
        carrier_repo: CarrierRepository,
        shipment_repo: ShipmentRepository,
    ) -> None:
        self.repository = repository
        self.carrier_repo = carrier_repo
        self.shipment_repo = shipment_repo

    async def publish_position(self, carrier_id: int, lat: float, lon: float) -> int:
        """Carrier publishes its position (RF-TRK-01).

        Also refreshes the carrier's current location (used by dedicated
        matching) and attaches the sample to every active shipment.
        Returns the number of active shipments traced.
        """
        await self.carrier_repo.update(carrier_id, current_lat=lat, current_lon=lon)
        active = await self.shipment_repo.list_active_by_carrier(carrier_id)
        if not active:
            await self.repository.create(carrier_id=carrier_id, shipment_id=None, lat=lat, lon=lon)
            return 0
        for shipment in active:
            await self.repository.create(
                carrier_id=carrier_id, shipment_id=shipment.id, lat=lat, lon=lon
            )
        return len(active)

    async def shipment_location(self, shipment_id: int, requester_user_id: int) -> GpsTrace | None:
        """Latest carrier position for a shipment (RF-TRK-02).

        Privacy (RNF-PRV-02): only the shipment's client (or the assigned
        carrier) can see positions, and only while the shipment is active.
        """
        shipment = await self.shipment_repo.get_by_id(shipment_id)
        if not shipment:
            raise NotFoundError("Shipment")
        if shipment.status not in TRACKABLE_STATUSES:
            return None

        is_client = shipment.client_id == requester_user_id
        carrier = (
            await self.carrier_repo.get_by_id(shipment.carrier_id)
            if shipment.carrier_id else None
        )
        is_carrier = carrier is not None and carrier.user_id == requester_user_id
        if not (is_client or is_carrier):
            raise ForbiddenError("Not authorized to track this shipment.")

        return await self.repository.latest_for_shipment(shipment_id)

    async def shipment_history(self, shipment_id: int) -> list[GpsTrace]:
        """Full trace history for auditing (RF-TRK-03)."""
        return await self.repository.history_for_shipment(shipment_id)
