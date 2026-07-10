"""
Shared geospatial utilities — pure functions, no I/O.

Core of the route-efficiency logic: detour computation by optimal stop
insertion. Road distances are approximated with haversine x urban circuity
factor; swap in OSRM (shared/osrm_client.py) for real street routing.
"""
import math
from dataclasses import dataclass

# Average ratio between road distance and straight-line distance in dense
# urban areas (literature reports 1.2-1.4 for grid-like cities like Buenos Aires).
URBAN_CIRCUITY_FACTOR = 1.3

# Average urban speeds (km/h) per vehicle type, used for ETA estimation.
AVG_SPEED_KMH: dict[str, float] = {
    "pedestrian": 4.5,
    "bike": 14.0,
    "motorcycle": 28.0,
    "car": 22.0,
    "van": 20.0,
    "truck": 18.0,
}


@dataclass(frozen=True)
class Point:
    """Geographic coordinate (WGS84)."""
    lat: float
    lon: float


def haversine_km(a: Point, b: Point) -> float:
    """Great-circle distance in km between two coordinates."""
    R = 6371.0
    phi1, phi2 = math.radians(a.lat), math.radians(b.lat)
    dphi = math.radians(b.lat - a.lat)
    dlambda = math.radians(b.lon - a.lon)
    h = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(h), math.sqrt(1 - h))


def road_km(a: Point, b: Point) -> float:
    """Estimated road distance in km (haversine x urban circuity factor)."""
    return haversine_km(a, b) * URBAN_CIRCUITY_FACTOR


def path_km(points: list[Point]) -> float:
    """Total estimated road distance of a path visiting points in order."""
    return sum(road_km(points[i], points[i + 1]) for i in range(len(points) - 1))


@dataclass(frozen=True)
class DetourResult:
    """Result of inserting a pickup+dropoff into a carrier route."""
    base_km: float        # carrier route without the shipment
    total_km: float       # carrier route including pickup and dropoff
    detour_km: float      # additional km caused by the shipment
    detour_ratio: float   # detour_km / base_km (0 if base_km is 0)


def insertion_detour(
    route_origin: Point,
    route_destination: Point,
    pickup: Point,
    dropoff: Point,
) -> DetourResult:
    """
    Detour caused by inserting a shipment into an existing carrier route.

    The carrier travels origin -> ... -> destination; the shipment requires
    visiting pickup before dropoff. For a 2-stop insertion the optimal order
    is always origin -> pickup -> dropoff -> destination (any other order
    that respects pickup-before-dropoff visits the same 4 points with a
    crossing, which by triangle inequality cannot be shorter).

    This detour value is the explicit constraint required by Yang et al.
    (2022): collaborative assignment is only valid below a detour threshold,
    otherwise the emission advantage over a dedicated trip disappears.
    """
    base = road_km(route_origin, route_destination)
    total = path_km([route_origin, pickup, dropoff, route_destination])

    detour = max(0.0, total - base)
    ratio = detour / base if base > 0 else float("inf")
    return DetourResult(
        base_km=round(base, 3),
        total_km=round(total, 3),
        detour_km=round(detour, 3),
        detour_ratio=round(ratio, 4),
    )


def point_to_route_km(point: Point, route_origin: Point, route_destination: Point) -> float:
    """
    Approximate distance from a point to the straight segment of a route, in km.
    Used for fast geo-compatibility scoring (is the pickup "on the way"?).

    Uses an equirectangular projection around the point — accurate enough at
    city scale (AMBA spans < 100 km).
    """
    ref_lat = math.radians(point.lat)
    kx = 111.320 * math.cos(ref_lat)  # km per degree of longitude at this latitude
    ky = 110.574                       # km per degree of latitude

    px, py = point.lon * kx, point.lat * ky
    ax, ay = route_origin.lon * kx, route_origin.lat * ky
    bx, by = route_destination.lon * kx, route_destination.lat * ky

    dx, dy = bx - ax, by - ay
    seg_len_sq = dx * dx + dy * dy
    if seg_len_sq == 0:
        return math.hypot(px - ax, py - ay)

    t = max(0.0, min(1.0, ((px - ax) * dx + (py - ay) * dy) / seg_len_sq))
    cx, cy = ax + t * dx, ay + t * dy
    return math.hypot(px - cx, py - cy)


def eta_minutes(distance_km: float, vehicle_type: str) -> int:
    """Estimated travel time in minutes for a road distance and vehicle type."""
    speed = AVG_SPEED_KMH.get(vehicle_type, 20.0)
    return max(1, round(distance_km / speed * 60))


def greedy_multi_insertion(
    route_origin: Point,
    route_destination: Point,
    stops: list[tuple[Point, Point]],
) -> tuple[list[Point], float]:
    """
    Order multiple (pickup, dropoff) pairs along a carrier route minimizing
    total distance, with cheapest-insertion greedy (spec 5.4: the prototype
    uses the greedy variant of the bin-packing/routing problem, not the
    optimal combinatorial solution).

    Returns (ordered waypoints including route endpoints, total km).
    """
    waypoints: list[Point] = [route_origin, route_destination]
    for pickup, dropoff in stops:
        best_cost = float("inf")
        best_seq: list[Point] | None = None
        # try every pickup position i and dropoff position j >= i (after pickup)
        for i in range(1, len(waypoints)):
            for j in range(i, len(waypoints)):
                candidate = waypoints[:i] + [pickup] + waypoints[i:j] + [dropoff] + waypoints[j:]
                cost = path_km(candidate)
                if cost < best_cost:
                    best_cost = cost
                    best_seq = candidate
        waypoints = best_seq if best_seq is not None else waypoints
    return waypoints, round(path_km(waypoints), 3)
