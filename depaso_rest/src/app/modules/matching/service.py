"""
Matching module - Carrier matching algorithm.
Deterministic scoring algorithm — NOT ML (spec section 5.2).

Formula:
  score = w1·compat_geo + w2·(1-desvio_norm) + w3·compat_carga
        + w4·reputacion_norm + w5·compat_horaria
"""
import math

from src.app.modules.carriers.models import Carrier
from src.app.modules.carriers.repository import CarrierRepository
from src.app.modules.shipments.models import Shipment
from src.app.modules.shipments.repository import ShipmentRepository
from src.app.modules.shipments.exceptions import ShipmentNotFoundError
from src.app.modules.matching.schemas import CarrierScoreResponse, MatchingResponse
from src.app.shared.enums import VehicleType, PackageSize

# Default weights (configurable, spec section 5.2)
DEFAULT_WEIGHTS = {
    "geo": 0.35,
    "detour": 0.30,
    "cargo": 0.15,
    "reputation": 0.10,
    "time_window": 0.10,
}

# Max distance for geo scoring (km). Beyond this, geo score = 0.
MAX_GEO_DISTANCE_KM = 15.0

# Cargo compatibility table (spec section 3.3)
# vehicle_type -> set of compatible package sizes
CARGO_COMPATIBILITY: dict[str, set[str]] = {
    VehicleType.PEDESTRIAN: {PackageSize.XS},
    VehicleType.BIKE:       {PackageSize.XS},
    VehicleType.MOTORCYCLE: {PackageSize.XS, PackageSize.S, PackageSize.M},
    VehicleType.CAR:        {PackageSize.XS, PackageSize.S, PackageSize.M, PackageSize.L},
    VehicleType.VAN:        {PackageSize.XS, PackageSize.S, PackageSize.M, PackageSize.L, PackageSize.XL},
    VehicleType.TRUCK:      {PackageSize.XS, PackageSize.S, PackageSize.M, PackageSize.L, PackageSize.XL},
}


def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate great-circle distance in km between two coordinates."""
    R = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def _geo_score(carrier: Carrier, shipment: Shipment) -> float:
    """
    Geographic compatibility score [0, 1].
    Decreases linearly with distance from carrier to shipment origin.
    """
    if carrier.current_lat is None or carrier.current_lon is None:
        return 0.5  # neutral score if no location known
    distance = _haversine_km(
        carrier.current_lat, carrier.current_lon,
        shipment.origin_lat, shipment.origin_lon,
    )
    return max(0.0, 1.0 - distance / MAX_GEO_DISTANCE_KM)


def _cargo_score(carrier: Carrier, shipment: Shipment) -> float:
    """
    Cargo compatibility score: 1 if vehicle can carry the package size, 0 otherwise.
    A score of 0 is a knockout filter.
    """
    compatible = CARGO_COMPATIBILITY.get(carrier.vehicle_type, set())
    return 1.0 if shipment.package_size in compatible else 0.0


def _reputation_score(carrier: Carrier) -> float:
    """Normalized reputation score [0, 1]."""
    return min(1.0, max(0.0, (carrier.reputation or 0.0) / 5.0))


def _score_carrier(carrier: Carrier, shipment: Shipment, weights: dict) -> CarrierScoreResponse:
    """Calculate total weighted score for a carrier/shipment pair."""
    geo = _geo_score(carrier, shipment)
    detour = 0.5        # neutral default — no route data in POC
    cargo = _cargo_score(carrier, shipment)
    reputation = _reputation_score(carrier)
    time_window = 1.0   # neutral default — no time window data yet

    total = (
        weights["geo"] * geo
        + weights["detour"] * (1.0 - detour)
        + weights["cargo"] * cargo
        + weights["reputation"] * reputation
        + weights["time_window"] * time_window
    )

    return CarrierScoreResponse(
        carrier_id=carrier.id,
        company_name=carrier.company_name,
        vehicle_type=carrier.vehicle_type,
        license_plate=carrier.license_plate,
        total_score=round(total, 4),
        distance_score=round(geo, 4),
        detour_score=round(detour, 4),
        capacity_score=round(cargo, 4),
        reputation_score=round(reputation, 4),
        time_window_score=round(time_window, 4),
    )


class MatchingService:
    """
    Service for matching shipments with carriers.
    Deterministic scoring, spec section 5.2.
    """

    def __init__(
        self,
        shipment_repo: ShipmentRepository,
        carrier_repo: CarrierRepository,
        weights: dict | None = None,
    ) -> None:
        self.shipment_repo = shipment_repo
        self.carrier_repo = carrier_repo
        self.weights = weights or DEFAULT_WEIGHTS.copy()

    def rank_carriers(self, shipment_id: int, top_k: int = 5) -> list[CarrierScoreResponse]:
        """
        Rank available carriers for a shipment by score (descending).
        Applies knockout filter: cargo incompatible carriers are excluded.
        Returns up to top_k results.
        """
        shipment = self.shipment_repo.get_by_id(shipment_id)
        if not shipment:
            raise ShipmentNotFoundError()

        # Get candidates: active, verified, available, enough capacity
        candidates = self.carrier_repo.list_available_with_location(
            min_capacity_kg=shipment.weight_kg
        )

        scored = [_score_carrier(c, shipment, self.weights) for c in candidates]

        # Knockout: exclude carriers with cargo_score = 0
        scored = [s for s in scored if s.capacity_score > 0]

        scored.sort(key=lambda s: s.total_score, reverse=True)
        return scored[:top_k]

    def match_best(self, shipment_id: int) -> MatchingResponse:
        """
        Find the best carrier for a shipment and return full matching result.
        """
        ranked = self.rank_carriers(shipment_id, top_k=5)
        if not ranked:
            raise ValueError("No available carriers match this shipment.")

        best = ranked[0]
        return MatchingResponse(
            shipment_id=shipment_id,
            matched_carrier_id=best.carrier_id,
            total_score=best.total_score,
            ranked_carriers=ranked,
        )
