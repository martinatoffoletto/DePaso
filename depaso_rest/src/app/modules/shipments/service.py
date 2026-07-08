"""
Shipments module service.
Business logic: lifecycle state machine, accept/reject, ratings, capacity,
pricing and CO2 persistence.
"""
from src.app.shared.enums import ShipmentStatus, ShipmentModality, PaymentStatus
from src.app.shared.geo import Point
from src.app.modules.shipments import pricing
from src.app.modules.shipments.repository import ShipmentRepository
from src.app.modules.shipments.models import Shipment, ShipmentEvent, Rating
from src.app.modules.shipments.exceptions import ShipmentNotFoundError, InvalidShipmentStatusError
from src.app.shared.exceptions import ValidationError
from src.app.modules.carriers.repository import CarrierRepository
from src.app.modules.routes.repository import RouteRepository
from src.app.modules.co2.service import CO2Service


# Valid status transitions (RF-SHP-05, RF-CAR-05)
VALID_TRANSITIONS: dict[str, list[str]] = {
    ShipmentStatus.PENDING: [ShipmentStatus.ASSIGNED, ShipmentStatus.CANCELLED],
    ShipmentStatus.ASSIGNED: [ShipmentStatus.PICKUP_ARRIVED, ShipmentStatus.CANCELLED],
    ShipmentStatus.PICKUP_ARRIVED: [ShipmentStatus.IN_TRANSIT, ShipmentStatus.CANCELLED],
    ShipmentStatus.IN_TRANSIT: [ShipmentStatus.DELIVERED],
    ShipmentStatus.DELIVERED: [],
    ShipmentStatus.CANCELLED: [],
}

# Statuses the assigned carrier advances through (RF-CAR-05); cancel is client-side.
CARRIER_STATUSES = {
    ShipmentStatus.PICKUP_ARRIVED,
    ShipmentStatus.IN_TRANSIT,
    ShipmentStatus.DELIVERED,
}

# Cancelling after accepting penalizes the carrier's reputation (RF-CAR-07).
CARRIER_CANCEL_PENALTY = 0.3


class ShipmentService:
    """Service for shipment business logic."""

    def __init__(
        self,
        repository: ShipmentRepository,
        carrier_repo: CarrierRepository | None = None,
        route_repo: RouteRepository | None = None,
        user_repo=None,
    ) -> None:
        self.repository = repository
        self.carrier_repo = carrier_repo
        self.route_repo = route_repo
        self.user_repo = user_repo
        self.co2 = CO2Service()

    # -- creation & queries -----------------------------------------------------

    def create_shipment(self, client_id: int, package_size: str,
                        modality: str, assignment_mode: str,
                        origin_lat: float, origin_lon: float,
                        destination_lat: float, destination_lon: float,
                        weight_kg: float, photo_url: str | None = None,
                        description: str | None = None,
                        declared_value: float | None = None,
                        recipient_name: str | None = None,
                        recipient_phone: str | None = None) -> Shipment:
        """Create a new shipment with its estimated price (RF-SHP-01)."""
        estimated_price = pricing.price_for(
            Point(origin_lat, origin_lon),
            Point(destination_lat, destination_lon),
            package_size, modality,
        )
        shipment = self.repository.create(
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
            description=description,
            declared_value=declared_value,
            recipient_name=recipient_name,
            recipient_phone=recipient_phone,
            estimated_price=estimated_price,
            status=ShipmentStatus.PENDING,
        )
        self.repository.add_event(shipment.id, ShipmentStatus.PENDING, actor_user_id=client_id)
        return shipment

    def get_shipment_by_id(self, shipment_id: int) -> Shipment:
        shipment = self.repository.get_by_id(shipment_id)
        if not shipment:
            raise ShipmentNotFoundError()
        return shipment

    def update_shipment(self, shipment_id: int, client_id: int, **updates) -> Shipment:
        """Update a pending shipment. Re-calculates price if needed."""
        shipment = self.get_shipment_by_id(shipment_id)
        if shipment.client_id != client_id:
            raise ValueError("Only the shipment owner can update it.")
        if shipment.status != ShipmentStatus.PENDING:
            raise ValidationError(
                "Only pending shipments can be updated.", "SHIPMENT_NOT_PENDING"
            )

        # Clean None values from updates
        updates = {k: v for k, v in updates.items() if v is not None}
        if not updates:
            return shipment

        # If origin, destination, package_size or modality changed, recalculate price
        needs_repricing = any(k in updates for k in ("origin_lat", "origin_lon", "destination_lat", "destination_lon", "package_size", "modality"))
        if needs_repricing:
            origin = Point(
                updates.get("origin_lat", shipment.origin_lat),
                updates.get("origin_lon", shipment.origin_lon)
            )
            dest = Point(
                updates.get("destination_lat", shipment.destination_lat),
                updates.get("destination_lon", shipment.destination_lon)
            )
            pkg_size = updates.get("package_size", shipment.package_size)
            modality = updates.get("modality", shipment.modality)
            updates["estimated_price"] = pricing.price_for(origin, dest, pkg_size, modality)

        updated = self.repository.update(shipment_id, **updates)
        return updated

    def list_shipments_by_client(self, client_id: int, skip: int = 0, limit: int = 20) -> tuple[list[Shipment], int]:
        return self.repository.list_by_client(client_id, skip, limit)

    def list_shipments_by_carrier(self, carrier_id: int, skip: int = 0, limit: int = 20) -> tuple[list[Shipment], int]:
        return self.repository.list_by_carrier(carrier_id, skip, limit)

    def list_pending(self) -> list[Shipment]:
        return self.repository.list_pending()

    def list_events(self, shipment_id: int) -> list[ShipmentEvent]:
        """Status history (audit trail)."""
        self.get_shipment_by_id(shipment_id)
        return self.repository.list_events(shipment_id)

    # -- lifecycle ----------------------------------------------------------------

    def update_status(self, shipment_id: int, new_status: str,
                      actor_user_id: int | None = None,
                      lat: float | None = None, lon: float | None = None) -> Shipment:
        """Advance the state machine, recording the audit event.

        On delivery: releases carrier capacity and persists CO2 savings for
        collaborative shipments (RF-CO2-01).
        """
        shipment = self.get_shipment_by_id(shipment_id)
        allowed = VALID_TRANSITIONS.get(shipment.status, [])
        if new_status not in allowed:
            raise InvalidShipmentStatusError(shipment.status, new_status)

        updated = self.repository.update_status(shipment_id, new_status)
        self.repository.add_event(shipment_id, new_status, actor_user_id=actor_user_id,
                                  lat=lat, lon=lon)

        if new_status == ShipmentStatus.DELIVERED:
            self._on_delivered(updated)
        elif new_status == ShipmentStatus.CANCELLED:
            if shipment.carrier_id is not None:
                self._release_capacity(shipment)
            # Refund a simulated payment when the shipment is cancelled.
            if updated.payment_status == PaymentStatus.PAID:
                updated = self.repository.update(
                    shipment_id, payment_status=PaymentStatus.REFUNDED
                )
        return updated

    def get_assigned_carrier_contact(self, shipment_id: int, requester_user_id: int) -> dict | None:
        """Public contact of the carrier assigned to a shipment. Returns None if
        no carrier is assigned yet. Raises PermissionError if the requester is
        neither the shipment's client nor the assigned carrier (privacy)."""
        shipment = self.get_shipment_by_id(shipment_id)  # raises ShipmentNotFoundError
        if shipment.carrier_id is None or not self.carrier_repo:
            return None
        carrier = self.carrier_repo.get_by_id(shipment.carrier_id)
        if not carrier:
            return None
        if requester_user_id not in (shipment.client_id, carrier.user_id):
            raise PermissionError("Not allowed to view this carrier")
        user = self.user_repo.get_by_id(carrier.user_id) if self.user_repo else None
        name = f"{user.first_name} {user.last_name}".strip() if user else None
        return {
            "carrier_id": carrier.id,
            "name": name or carrier.company_name or "Cadete",
            "phone": user.phone_number if user else None,
            "rating": round(carrier.reputation or 5.0, 1),
            "trips": self.repository.count_delivered_by_carrier(carrier.id),
        }

    # -- payment (simulated pasarela, RF-SHP) ------------------------------------

    def pay_shipment(self, shipment_id: int, client_id: int) -> Shipment:
        """Client pays for the shipment (simulated). Money is held by the
        platform until delivery, when the carrier's share is released."""
        shipment = self.get_shipment_by_id(shipment_id)
        if shipment.client_id != client_id:
            raise ValueError("Only the shipment owner can pay for it.")
        if shipment.status == ShipmentStatus.CANCELLED:
            raise ValidationError("Cannot pay a cancelled shipment.", "SHIPMENT_CANCELLED")
        if shipment.payment_status != PaymentStatus.PENDING:
            raise ValidationError(
                "Shipment is not awaiting payment.", "PAYMENT_NOT_PENDING"
            )
        return self.repository.update(shipment_id, payment_status=PaymentStatus.PAID)

    def cancel_shipment(self, shipment_id: int, client_id: int) -> Shipment:
        """Client cancels before pickup (RF-SHP-07)."""
        shipment = self.get_shipment_by_id(shipment_id)
        if shipment.client_id != client_id:
            raise ValueError("Only the shipment owner can cancel it.")
        return self.update_status(shipment_id, ShipmentStatus.CANCELLED, actor_user_id=client_id)

    # -- carrier accept / reject / cancel (RF-CAR-03/04/07) -------------------------

    def accept_shipment(self, shipment_id: int, carrier_id: int,
                        route_id: int | None = None) -> Shipment:
        """Carrier accepts a pending shipment: assign + reserve capacity.

        For collaborative shipments matched against a published route, the
        CO2 savings are computed at accept time (route geometry is known)
        and persisted on delivery.
        """
        shipment = self.get_shipment_by_id(shipment_id)
        if shipment.status != ShipmentStatus.PENDING:
            raise InvalidShipmentStatusError(shipment.status, ShipmentStatus.ASSIGNED)

        carrier = self._get_carrier(carrier_id)
        available = self._available_capacity(carrier)
        if available < shipment.weight_kg:
            raise ValueError("Carrier does not have enough available capacity.")

        updated = self.repository.assign_carrier(shipment_id, carrier_id)
        self.repository.add_event(shipment_id, ShipmentStatus.ASSIGNED,
                                  actor_user_id=carrier.user_id)
        self._reserve_capacity(carrier, shipment.weight_kg)

        if shipment.modality == ShipmentModality.COLLABORATIVE and route_id and self.route_repo:
            route = self.route_repo.get_by_id(route_id)
            if route and route.destination_lat is not None:
                savings = self.co2.calculate_shipment_savings(
                    route_origin=Point(route.origin_lat, route.origin_lon),
                    route_destination=Point(route.destination_lat, route.destination_lon),
                    pickup=Point(shipment.origin_lat, shipment.origin_lon),
                    dropoff=Point(shipment.destination_lat, shipment.destination_lon),
                    vehicle_type=carrier.vehicle_type,
                )
                updated = self.repository.update(
                    shipment_id, co2_savings_kg=savings["savings_kg"]
                )
        return updated

    def carrier_cancel(self, shipment_id: int, carrier_id: int) -> Shipment:
        """Carrier cancels after accepting: reputation penalty (RF-CAR-07)."""
        shipment = self.get_shipment_by_id(shipment_id)
        if shipment.carrier_id != carrier_id:
            raise ValueError("Shipment is not assigned to this carrier.")
        carrier = self._get_carrier(carrier_id)

        updated = self.update_status(shipment_id, ShipmentStatus.CANCELLED,
                                     actor_user_id=carrier.user_id)
        # re-open for other carriers
        updated = self.repository.update_status(shipment_id, ShipmentStatus.PENDING)
        self.repository.update(shipment_id, carrier_id=None)
        if self.carrier_repo:
            new_rep = max(0.0, (carrier.reputation or 5.0) - CARRIER_CANCEL_PENALTY)
            self.carrier_repo.update(carrier_id, reputation=new_rep)
        return updated

    # -- ratings (RF-SHP-08) ----------------------------------------------------------

    def rate_shipment(self, shipment_id: int, client_id: int,
                      stars: int, comment: str | None = None) -> Rating:
        """Client rates the carrier after delivery; updates carrier reputation."""
        shipment = self.get_shipment_by_id(shipment_id)
        if shipment.client_id != client_id:
            raise ValueError("Only the shipment owner can rate it.")
        if shipment.status != ShipmentStatus.DELIVERED:
            raise ValueError("Only delivered shipments can be rated.")
        if shipment.carrier_id is None:
            raise ValueError("Shipment has no assigned carrier.")
        if self.repository.get_rating_by_shipment(shipment_id):
            raise ValueError("This shipment was already rated.")
        if not 1 <= stars <= 5:
            raise ValueError("Stars must be between 1 and 5.")

        rating = self.repository.add_rating(
            shipment_id, shipment.carrier_id, client_id, stars, comment
        )
        if self.carrier_repo:
            avg = self.repository.carrier_rating_avg(shipment.carrier_id)
            if avg is not None:
                self.carrier_repo.update(shipment.carrier_id, reputation=round(avg, 2))
        return rating

    # -- capacity (RF-CAP) ------------------------------------------------------------

    def _get_carrier(self, carrier_id: int):
        if not self.carrier_repo:
            raise ValueError("Carrier repository not configured.")
        carrier = self.carrier_repo.get_by_id(carrier_id)
        if not carrier:
            raise ValueError("Carrier not found.")
        return carrier

    def _available_capacity(self, carrier) -> float:
        reserved = sum(
            s.weight_kg for s in self.repository.list_active_by_carrier(carrier.id)
        )
        return carrier.capacity_kg - reserved

    def _reserve_capacity(self, carrier, weight_kg: float) -> None:
        # Capacity is derived from active shipments (single source of truth),
        # so reserving is implicit in the assignment. Hook kept for clarity.
        pass

    def _release_capacity(self, shipment: Shipment) -> None:
        # Implicit: delivered/cancelled shipments leave list_active_by_carrier.
        pass

    def _on_delivered(self, shipment: Shipment) -> None:
        """Post-delivery side effects: capacity release is implicit; CO2 was
        computed at accept time for collaborative shipments. If the client paid,
        release the carrier's payout (simulated escrow)."""
        self._release_capacity(shipment)
        if shipment.payment_status == PaymentStatus.PAID:
            self.repository.update(shipment.id, payment_status=PaymentStatus.RELEASED)
