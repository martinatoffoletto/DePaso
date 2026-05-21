"""
Freight module - Mudanzas (large-scale moves) specific logic.
Extends shipments with freight-specific constraints and features.
"""
from src.app.modules.shipments import ShipmentService
from src.app.modules.carriers import CarrierService
from src.app.modules.matching import MatchingService


class FreightService:
    """Service for freight/mudanza handling.

    Constraints per spec (section 3.3):
    - Only van and truck vehicles allowed
    - Always dedicated modality, never collaborative
    - Minimum weight threshold (e.g., 100 kg)

    TODO: Implement the following:
    - create_freight_shipment() - Same as shipment but vehicle_type in (van, truck)
    - get_available_freight_carriers(origin, destination) -> list[Carrier]
    - estimate_freight_cost(weight_kg, distance_km) -> float
    - calculate_freight_co2() -> float
    """

    def __init__(self, shipment_service: ShipmentService,
                 carrier_service: CarrierService,
                 matching_service: MatchingService) -> None:
        """Initialize with dependencies."""
        self.shipment_service = shipment_service
        self.carrier_service = carrier_service
        self.matching_service = matching_service
