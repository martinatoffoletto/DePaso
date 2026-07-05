"""
Matching module - Intelligent carrier assignment.

Deterministic multivariable scoring — NOT a trained ML model (spec 5.2).
This is a deliberate design decision grounded in the state of the art:

- Yang et al. (2022): the emission advantage of collaborative delivery
  disappears when carrier detour exceeds a threshold -> detour is a HARD
  filter computed on real route insertion, not a soft preference.
- Akamatsu & Oyama (2023/24): market-based matching mechanisms need large
  historical datasets, unavailable at platform launch -> deterministic
  scoring with configurable weights is the correct cold-start design.
- Saleh et al. (2024): deep RL assignment is not explainable to users ->
  every score here returns its component breakdown plus human-readable
  reasons, making each assignment auditable.

Formula (spec 5.2):
  score = w1*compat_geo + w2*(1 - detour_norm) + w3*compat_cargo
        + w4*reputation_norm + w5*compat_time
"""
from datetime import datetime, timezone

from src.app.modules.carriers.models import Carrier
from src.app.modules.carriers.repository import CarrierRepository
from src.app.modules.matching.schemas import (
    CarrierScoreResponse,
    FeedItemResponse,
    MatchingResponse,
    ScoreBreakdown,
)
from src.app.modules.routes.repository import RouteRepository
from src.app.modules.shipments.exceptions import ShipmentNotFoundError
from src.app.modules.shipments.models import Shipment
from src.app.modules.shipments.repository import ShipmentRepository
from src.app.shared.enums import PackageSize, ShipmentModality, VehicleType
from src.app.shared.geo import (
    Point,
    eta_minutes,
    insertion_detour,
    point_to_route_km,
    road_km,
)

# Default weights (spec 5.2) — designed to be admin-configurable in DB.
# Survey finding (n=145): 62% of potential carriers only participate if they
# don't deviate from their daily trajectory -> geo + detour carry 65% of the score.
DEFAULT_WEIGHTS = {
    "geo": 0.35,
    "detour": 0.30,
    "cargo": 0.15,
    "reputation": 0.10,
    "time_window": 0.10,
}


def _naive_utcnow() -> datetime:
    """Current UTC as a naive datetime.

    Stored route/window datetimes are naive UTC, so comparisons must use a
    naive 'now' (avoids the deprecated datetime.utcnow() and aware/naive clash).
    """
    return datetime.now(timezone.utc).replace(tzinfo=None)

# --- Hard (knockout) constraints -------------------------------------------

# Collaborative assignment is only valid below this detour ratio (Yang et al.;
# spec 5.2: "colaborativo: hasta 15% del trayecto").
MAX_DETOUR_RATIO_COLLABORATIVE = 0.15

# Pedestrian/bike only carry S (small packages/docs) over short trips (spec 3.3).
MAX_SOFT_MOBILITY_TRIP_KM = 5.0
SOFT_MOBILITY = {VehicleType.PEDESTRIAN, VehicleType.BIKE}

# Vehicle -> categories it may carry (spec 3.3). Empty intersection = knockout.
CARGO_COMPATIBILITY: dict[str, set[str]] = {
    VehicleType.PEDESTRIAN: {PackageSize.S},
    VehicleType.BIKE:       {PackageSize.S},
    VehicleType.MOTORCYCLE: {PackageSize.S, PackageSize.M},
    VehicleType.CAR:        {PackageSize.S, PackageSize.M, PackageSize.L},
    VehicleType.VAN:        {PackageSize.S, PackageSize.M, PackageSize.L, PackageSize.XL},
    VehicleType.TRUCK:      {PackageSize.S, PackageSize.M, PackageSize.L, PackageSize.XL},
}

# Moves/freight (XL) are always dedicated, never collaborative (spec 3.3).
COLLABORATIVE_FORBIDDEN_SIZES = {PackageSize.XL}

# --- Soft scoring parameters ------------------------------------------------

# compat_geo: 1.0 when pickup is on the route, linearly down to 0 at this distance.
MAX_GEO_DISTANCE_KM = 15.0
# For dedicated on-demand: proximity of carrier to pickup.
MAX_PICKUP_DISTANCE_KM = 15.0
# compat_time: full score inside the window, decaying to 0 this many hours outside.
TIME_DECAY_HOURS = 3.0


def cargo_compatible(vehicle_type: str, package_size: str) -> bool:
    """Hard filter: can this vehicle carry this package category? (spec 3.3)"""
    return package_size in CARGO_COMPATIBILITY.get(vehicle_type, set())


def geo_score_collaborative(pickup: Point, dropoff: Point,
                            route_origin: Point, route_destination: Point) -> float:
    """
    Geographic compatibility for collaborative routes [0, 1]: how close the
    pickup AND dropoff are to the carrier's existing trajectory. Both must be
    "on the way" — averaging would let a perfect pickup hide an off-route dropoff.
    """
    d_pickup = point_to_route_km(pickup, route_origin, route_destination)
    d_dropoff = point_to_route_km(dropoff, route_origin, route_destination)
    worst = max(d_pickup, d_dropoff)
    return max(0.0, 1.0 - worst / MAX_GEO_DISTANCE_KM)


def geo_score_dedicated(carrier_pos: Point | None, pickup: Point) -> float:
    """Geographic compatibility for dedicated on-demand [0, 1]: proximity to pickup."""
    if carrier_pos is None:
        return 0.5  # neutral when position unknown
    return max(0.0, 1.0 - road_km(carrier_pos, pickup) / MAX_PICKUP_DISTANCE_KM)


def time_window_score(window_start: datetime, window_end: datetime,
                      requested_at: datetime) -> float:
    """
    Temporal compatibility [0, 1]: 1 inside the carrier's window, decaying
    linearly to 0 at TIME_DECAY_HOURS outside it.
    """
    if window_start <= requested_at <= window_end:
        return 1.0
    gap_s = min(
        abs((requested_at - window_end).total_seconds()),
        abs((window_start - requested_at).total_seconds()),
    )
    return max(0.0, 1.0 - gap_s / (TIME_DECAY_HOURS * 3600))


def reputation_score(carrier: Carrier) -> float:
    """Normalized reputation [0, 1]."""
    return min(1.0, max(0.0, (carrier.reputation or 0.0) / 5.0))


class MatchingService:
    """Ranks carrier candidates for a shipment (RF-MAT-01..03)."""

    def __init__(
        self,
        shipment_repo: ShipmentRepository,
        carrier_repo: CarrierRepository,
        route_repo: RouteRepository | None = None,
        weights: dict | None = None,
    ) -> None:
        self.shipment_repo = shipment_repo
        self.carrier_repo = carrier_repo
        self.route_repo = route_repo
        self.weights = weights or DEFAULT_WEIGHTS.copy()
        
        from src.app.shared.osrm_client import OSRMClient
        self.osrm = OSRMClient()

    # -- public API -----------------------------------------------------------

    def rank_carriers(self, shipment_id: int, top_k: int = 5) -> list[CarrierScoreResponse]:
        """Ranked candidates for a shipment, best first (RF-MAT-01/02)."""
        shipment = self.shipment_repo.get_by_id(shipment_id)
        if not shipment:
            raise ShipmentNotFoundError()

        if shipment.modality == ShipmentModality.COLLABORATIVE:
            scored = self._rank_collaborative(shipment)
        else:
            scored = self._rank_dedicated(shipment)

        scored.sort(key=lambda s: s.total_score, reverse=True)
        return scored[:top_k]

    def match_best(self, shipment_id: int) -> MatchingResponse:
        """Best candidate plus the full ranking (for timeout fallback, RF-MAT-05)."""
        shipment = self.shipment_repo.get_by_id(shipment_id)
        if not shipment:
            raise ShipmentNotFoundError()
        ranked = self.rank_carriers(shipment_id, top_k=5)
        if not ranked:
            raise ValueError("No available carriers match this shipment.")
        best = ranked[0]
        return MatchingResponse(
            shipment_id=shipment_id,
            modality=shipment.modality,
            matched_carrier_id=best.carrier_id,
            total_score=best.total_score,
            ranked_carriers=ranked,
        )

    def feed_for_carrier(self, carrier_id: int, limit: int = 20) -> list[FeedItemResponse]:
        """Pending shipments compatible with a carrier (RF-MAT-03, RF-CAR-03).

        Collaborative shipments are matched against the carrier's published
        routes (detour hard-capped at 15%); dedicated ones by vehicle
        compatibility and proximity to the pickup.
        """
        carrier = self.carrier_repo.get_by_id(carrier_id)
        if carrier is None or not (carrier.is_active and carrier.is_verified):
            return []

        my_routes = []
        if self.route_repo is not None:
            my_routes = [
                r for r in self.route_repo.list_active_in_window(_naive_utcnow())
                if r.carrier_id == carrier_id and r.kind == "collaborative_route"
            ]

        items: list[FeedItemResponse] = []
        for shipment in self.shipment_repo.list_pending():
            if not self._passes_common_knockouts(carrier, shipment):
                continue
            pickup = Point(shipment.origin_lat, shipment.origin_lon)
            dropoff = Point(shipment.destination_lat, shipment.destination_lon)

            if shipment.modality == ShipmentModality.COLLABORATIVE:
                if shipment.package_size in COLLABORATIVE_FORBIDDEN_SIZES:
                    continue
                if (carrier.vehicle_type in SOFT_MOBILITY
                        and road_km(pickup, dropoff) > MAX_SOFT_MOBILITY_TRIP_KM):
                    continue
                best = self._best_route_match(my_routes, pickup, dropoff)
                if best is None:
                    continue
                route, detour, geo = best
                detour_component = 1.0 - min(1.0, detour.detour_ratio / MAX_DETOUR_RATIO_COLLABORATIVE)
                score = (self.weights["geo"] * geo
                         + self.weights["detour"] * detour_component
                         + self.weights["cargo"]
                         + self.weights["reputation"] * reputation_score(carrier)
                         + self.weights["time_window"])
                items.append(FeedItemResponse(
                    shipment_id=shipment.id,
                    modality=shipment.modality,
                    package_size=shipment.package_size,
                    weight_kg=shipment.weight_kg,
                    origin_lat=shipment.origin_lat,
                    origin_lon=shipment.origin_lon,
                    destination_lat=shipment.destination_lat,
                    destination_lon=shipment.destination_lon,
                    estimated_price=shipment.estimated_price,
                    score=round(score, 4),
                    detour_km=detour.detour_km,
                    detour_ratio=detour.detour_ratio,
                    route_id=route.id,
                    explanation=[
                        f"Compatible con tu trayecto publicado (desvío {detour.detour_km} km, "
                        f"{detour.detour_ratio:.0%} del recorrido)",
                    ],
                ))
            else:
                carrier_pos = (
                    Point(carrier.current_lat, carrier.current_lon)
                    if carrier.current_lat is not None and carrier.current_lon is not None
                    else None
                )
                geo = geo_score_dedicated(carrier_pos, pickup)
                distance = road_km(carrier_pos, pickup) if carrier_pos else None
                score = (self.weights["geo"] * geo
                         + self.weights["detour"]
                         + self.weights["cargo"]
                         + self.weights["reputation"] * reputation_score(carrier)
                         + self.weights["time_window"])
                items.append(FeedItemResponse(
                    shipment_id=shipment.id,
                    modality=shipment.modality,
                    package_size=shipment.package_size,
                    weight_kg=shipment.weight_kg,
                    origin_lat=shipment.origin_lat,
                    origin_lon=shipment.origin_lon,
                    destination_lat=shipment.destination_lat,
                    destination_lon=shipment.destination_lon,
                    estimated_price=shipment.estimated_price,
                    score=round(score, 4),
                    distance_to_pickup_km=round(distance, 2) if distance is not None else None,
                    explanation=["Envío dedicado: te desplazás especialmente para este pedido"],
                ))

        items.sort(key=lambda i: i.score, reverse=True)
        return items[:limit]

    def _best_route_match(self, routes, pickup: Point, dropoff: Point):
        """Lowest-detour route accepting this shipment, or None if all exceed the cap."""
        best = None
        for route in routes:
            route_origin = Point(route.origin_lat, route.origin_lon)
            route_dest = Point(route.destination_lat, route.destination_lon)
            detour = insertion_detour(route_origin, route_dest, pickup, dropoff, osrm_client=self.osrm)
            if detour.detour_ratio > MAX_DETOUR_RATIO_COLLABORATIVE:
                continue
            geo = geo_score_collaborative(pickup, dropoff, route_origin, route_dest)
            if best is None or detour.detour_km < best[1].detour_km:
                best = (route, detour, geo)
        return best

    # -- collaborative: match against published routes -------------------------

    def _rank_collaborative(self, shipment: Shipment) -> list[CarrierScoreResponse]:
        if self.route_repo is None:
            return []
        if shipment.package_size in COLLABORATIVE_FORBIDDEN_SIZES:
            return []  # moves/freight are never collaborative (spec 3.3)

        pickup = Point(shipment.origin_lat, shipment.origin_lon)
        dropoff = Point(shipment.destination_lat, shipment.destination_lon)
        trip_km = road_km(pickup, dropoff)
        now = _naive_utcnow()

        results: list[CarrierScoreResponse] = []
        for route in self.route_repo.list_active_in_window(now):
            if route.kind != "collaborative_route":
                continue
            carrier = self.carrier_repo.get_by_id(route.carrier_id)
            if carrier is None or not self._passes_common_knockouts(carrier, shipment):
                continue
            if carrier.vehicle_type in SOFT_MOBILITY and trip_km > MAX_SOFT_MOBILITY_TRIP_KM:
                continue

            route_origin = Point(route.origin_lat, route.origin_lon)
            route_dest = Point(route.destination_lat, route.destination_lon)
            detour = insertion_detour(route_origin, route_dest, pickup, dropoff, osrm_client=self.osrm)

            # HARD constraint (Yang et al.): excessive detour cancels the
            # environmental advantage — exclude, don't just penalize.
            if detour.detour_ratio > MAX_DETOUR_RATIO_COLLABORATIVE:
                continue

            geo = geo_score_collaborative(pickup, dropoff, route_origin, route_dest)
            detour_component = 1.0 - min(1.0, detour.detour_ratio / MAX_DETOUR_RATIO_COLLABORATIVE)
            time_c = time_window_score(route.window_start, route.window_end, now)
            results.append(self._build_response(
                carrier=carrier,
                shipment=shipment,
                geo=geo,
                detour_component=detour_component,
                time_component=time_c,
                detour_km=detour.detour_km,
                detour_ratio=detour.detour_ratio,
                eta_min=eta_minutes(road_km(route_origin, pickup), carrier.vehicle_type),
                route_id=route.id,
                extra_reasons=[
                    f"Desvío de {detour.detour_km} km ({detour.detour_ratio:.0%} del trayecto, "
                    f"máximo permitido {MAX_DETOUR_RATIO_COLLABORATIVE:.0%})",
                ],
            ))
        return results

    # -- dedicated: match against available carriers ---------------------------

    def _rank_dedicated(self, shipment: Shipment) -> list[CarrierScoreResponse]:
        """Score dedicated-mode candidates.

        Two sub-modalities (spec 3):
        - ON_DEMAND: carrier flagged is_available=True with a real-time location.
        - BY_AVAILABILITY: carrier has published a dedicated_window route that
          covers the shipment's request time (spec 3.3, RF-CAR-02).
        """
        pickup = Point(shipment.origin_lat, shipment.origin_lon)
        # Use naive UTC for DB comparisons (stored datetimes are naive UTC).
        now = _naive_utcnow()

        results: list[CarrierScoreResponse] = []
        seen_carrier_ids: set[int] = set()

        # --- 1. ON_DEMAND ---------------------------------------------------
        candidates = self.carrier_repo.list_available_with_location(
            min_capacity_kg=shipment.weight_kg
        )
        for carrier in candidates:
            if not self._passes_common_knockouts(carrier, shipment):
                continue
            seen_carrier_ids.add(carrier.id)
            carrier_pos = (
                Point(carrier.current_lat, carrier.current_lon)
                if carrier.current_lat is not None and carrier.current_lon is not None
                else None
            )
            geo = geo_score_dedicated(carrier_pos, pickup)
            eta = (
                eta_minutes(road_km(carrier_pos, pickup), carrier.vehicle_type)
                if carrier_pos else None
            )
            results.append(self._build_response(
                carrier=carrier,
                shipment=shipment,
                geo=geo,
                # Dedicated trips have no route to deviate from (spec 5.2:
                # "dedicado: sin límite") — neutral component.
                detour_component=1.0,
                time_component=1.0,
                detour_km=None,
                detour_ratio=None,
                eta_min=eta,
                route_id=None,
                extra_reasons=["Viaje dedicado on-demand: disponible ahora"],
            ))

        # --- 2. BY_AVAILABILITY ---------------------------------------------
        # Carriers who registered a habitual availability window are ranked even
        # if they don't have is_available=True in their carrier profile — their
        # commitment is the window itself (spec 3.3, RF-CAR-02).
        if self.route_repo is not None:
            for route in self.route_repo.list_active_in_window(now):
                if route.kind != "dedicated_window":
                    continue
                carrier = self.carrier_repo.get_by_id(route.carrier_id)
                if carrier is None or not self._passes_common_knockouts(carrier, shipment):
                    continue
                if carrier.id in seen_carrier_ids:
                    # Already ranked as ON_DEMAND — avoid double-counting.
                    continue
                time_c = time_window_score(route.window_start, route.window_end, now)
                if time_c == 0.0:
                    # Completely outside the time-decay window — skip.
                    continue
                seen_carrier_ids.add(carrier.id)
                # Use the zone centre (route origin) as the carrier's effective position.
                zone_center = Point(route.origin_lat, route.origin_lon)
                geo = geo_score_dedicated(zone_center, pickup)
                results.append(self._build_response(
                    carrier=carrier,
                    shipment=shipment,
                    geo=geo,
                    detour_component=1.0,
                    time_component=time_c,
                    detour_km=None,
                    detour_ratio=None,
                    eta_min=eta_minutes(road_km(zone_center, pickup), carrier.vehicle_type),
                    route_id=route.id,
                    extra_reasons=[
                        f"Disponible por ventana habitual hasta "
                        f"{route.window_end.strftime('%H:%M')} (BY_AVAILABILITY)",
                    ],
                ))

        return results

    # -- shared helpers ---------------------------------------------------------

    def _passes_common_knockouts(self, carrier: Carrier, shipment: Shipment) -> bool:
        """Hard filters common to both modalities (spec 5.2 'filtros duros')."""
        if not (carrier.is_active and carrier.is_verified):
            return False
        if carrier.capacity_kg < shipment.weight_kg:
            return False
        if not cargo_compatible(carrier.vehicle_type, shipment.package_size):
            return False
        # Soft mobility (pedestrian/bike) cannot handle trips longer than 5 km
        # in ANY modality — including dedicated (spec 3.3, RF-MAT-02).
        # Previously this check existed only inside _rank_collaborative and
        # feed_for_carrier, leaving a gap where a pedestrian could receive a
        # dedicated 8 km shipment.
        if carrier.vehicle_type in SOFT_MOBILITY:
            trip_pickup = Point(shipment.origin_lat, shipment.origin_lon)
            trip_dropoff = Point(shipment.destination_lat, shipment.destination_lon)
            if road_km(trip_pickup, trip_dropoff) > MAX_SOFT_MOBILITY_TRIP_KM:
                return False
        return True

    def _build_response(
        self,
        carrier: Carrier,
        shipment: Shipment,
        geo: float,
        detour_component: float,
        time_component: float,
        detour_km: float | None,
        detour_ratio: float | None,
        eta_min: int | None,
        route_id: int | None,
        extra_reasons: list[str],
    ) -> CarrierScoreResponse:
        cargo = 1.0  # knockout already guaranteed compatibility
        reputation = reputation_score(carrier)
        total = (
            self.weights["geo"] * geo
            + self.weights["detour"] * detour_component
            + self.weights["cargo"] * cargo
            + self.weights["reputation"] * reputation
            + self.weights["time_window"] * time_component
        )
        explanation = [
            f"Compatibilidad geográfica: {geo:.0%}",
            f"Vehículo ({carrier.vehicle_type}) compatible con carga {shipment.package_size.upper()}",
            f"Reputación: {(carrier.reputation or 0):.1f}/5",
            *extra_reasons,
        ]
        return CarrierScoreResponse(
            carrier_id=carrier.id,
            company_name=carrier.company_name,
            vehicle_type=carrier.vehicle_type,
            license_plate=carrier.license_plate,
            total_score=round(total, 4),
            breakdown=ScoreBreakdown(
                geo=round(geo, 4),
                detour=round(detour_component, 4),
                cargo=cargo,
                reputation=round(reputation, 4),
                time_window=round(time_component, 4),
            ),
            detour_km=detour_km,
            detour_ratio=detour_ratio,
            eta_to_pickup_min=eta_min,
            route_id=route_id,
            explanation=explanation,
        )
