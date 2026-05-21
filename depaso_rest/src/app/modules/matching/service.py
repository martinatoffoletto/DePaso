"""
Matching module - Carrier matching algorithm.
Deterministic scoring algorithm — NOT ML.
"""
from src.app.modules.carriers import CarrierService
from src.app.modules.shipments import ShipmentService


class MatchingService:
    """Service for matching shipments with carriers.

    Scoring formula (deterministic, per spec section 5.2):
    score = w1 · compat_geo + w2 · (1 - desvio_norm) + w3 · compat_carga
          + w4 · reputacion_norm + w5 · compat_horaria

    Weights (configurable, initial defaults):
    w1=0.35, w2=0.30, w3=0.15, w4=0.10, w5=0.10
    """

    # Default scoring weights (configurable via DB in production)
    DEFAULT_WEIGHTS = {
        "geo": 0.35,
        "detour": 0.30,
        "cargo": 0.15,
        "reputation": 0.10,
        "time_window": 0.10,
    }

    def __init__(self, shipment_service: ShipmentService,
                 carrier_service: CarrierService) -> None:
        """Initialize with dependencies."""
        self.shipment_service = shipment_service
        self.carrier_service = carrier_service
        self.weights = self.DEFAULT_WEIGHTS.copy()

    # TODO: Implement scoring components:
    # - calculate_geo_compatibility(carrier, shipment) -> float
    # - calculate_detour_score(carrier_route, shipment) -> float
    # - calculate_cargo_compatibility(carrier, shipment) -> float (0 or 1)
    # - calculate_reputation_score(carrier) -> float
    # - calculate_time_window_score(carrier, shipment) -> float
    # - calculate_total_score(carrier, shipment) -> float
    # - rank_carriers(shipment_id) -> list[CarrierScoreResponse]
    # - match_best_carrier(shipment_id) -> Carrier
