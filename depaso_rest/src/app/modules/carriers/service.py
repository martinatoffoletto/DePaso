"""
Carriers module service.
Business logic for carrier management.
"""
from src.app.modules.carriers.repository import CarrierRepository
from src.app.modules.carriers.models import Carrier
from src.app.modules.carriers.exceptions import CarrierNotFoundError
from src.app.modules.carriers.schemas import MOTORIZED_VEHICLES
from src.app.modules.shipments import pricing
from src.app.shared.exceptions import ValidationError


class CarrierService:
    """Service for carrier business logic."""

    def __init__(self, repository: CarrierRepository) -> None:
        """Initialize with repository."""
        self.repository = repository

    async def summary(self, carrier_id: int, shipment_repo) -> dict:
        """Carrier history: deliveries, net earnings, reputation, CO2 (RF-CAR-06).

        Earnings are net of the platform commission. Uses targeted queries
        (delivered + active) instead of loading the full shipment history.
        """
        carrier = await self.get_carrier_by_id(carrier_id)  # raises if missing
        delivered = await shipment_repo.list_delivered_by_carriers([carrier_id])
        active = await shipment_repo.list_active_by_carrier(carrier_id)
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

    async def create_carrier(self, user_id: int, company_name: str, vehicle_type: str,
                       license_plate: str, capacity_kg: float,
                       capacity_volume_m3: float | None = None) -> Carrier:
        """Create a new carrier profile."""
        return await self.repository.create(
            user_id=user_id,
            company_name=company_name,
            vehicle_type=vehicle_type,
            license_plate=license_plate,
            capacity_kg=capacity_kg,
            capacity_volume_m3=capacity_volume_m3,
        )

    async def get_carrier_by_id(self, carrier_id: int) -> Carrier:
        """Get a carrier by ID. Raises CarrierNotFoundError if not found."""
        carrier = await self.repository.get_by_id(carrier_id)
        if not carrier:
            raise CarrierNotFoundError()
        return carrier

    async def get_carrier_by_user_id(self, user_id: int) -> Carrier:
        """Get carrier profile by user ID."""
        carrier = await self.repository.get_by_user_id(user_id)
        if not carrier:
            raise CarrierNotFoundError()
        return carrier

    async def list_carriers(self, skip: int = 0, limit: int = 20) -> tuple[list[Carrier], int]:
        """List active and verified carriers."""
        return await self.repository.list_active(skip, limit)

    async def update_carrier(self, carrier_id: int, **kwargs: object) -> Carrier:
        """Update carrier information."""
        carrier = await self.repository.update(carrier_id, **kwargs)
        if not carrier:
            raise CarrierNotFoundError()
        return carrier

    async def update_profile(self, carrier: Carrier, updates: dict,
                             shipment_repo=None) -> Carrier:
        """Self-service PATCH del perfil, con reglas sobre el estado MERGEADO.

        El schema de creación exige patente para motorizados, pero un update
        parcial podía convertir una bici en auto sin patente, o cambiar de
        vehículo con entregas en curso (rompiendo la compatibilidad de carga
        ya chequeada al aceptar).
        """
        new_vehicle = updates.get("vehicle_type", carrier.vehicle_type)

        if new_vehicle != carrier.vehicle_type and shipment_repo is not None:
            active = await shipment_repo.list_active_by_carrier(carrier.id)
            if active:
                raise ValidationError(
                    "Cannot change vehicle while there are active shipments.",
                    code="CARRIER_HAS_ACTIVE_SHIPMENTS",
                )

        if new_vehicle in MOTORIZED_VEHICLES:
            plate = updates.get("license_plate", carrier.license_plate)
            if not plate or not str(plate).strip():
                raise ValidationError(
                    f"license_plate is required for vehicle_type '{new_vehicle}'",
                    code="LICENSE_PLATE_REQUIRED",
                )
            if "license_plate" in updates:
                updates["license_plate"] = str(plate).strip().upper()
        elif carrier.license_plate is not None:
            # movilidad blanda: la patente no aplica (update() saltea None,
            # así que se limpia con un método explícito del repo)
            updates.pop("license_plate", None)
            await self.repository.clear_license_plate(carrier.id)

        return await self.update_carrier(carrier.id, **updates)

    async def get_available_carriers(self, min_capacity_kg: float) -> list[Carrier]:
        """Get carriers with sufficient capacity for a shipment."""
        return await self.repository.list_with_capacity(min_capacity_kg)
