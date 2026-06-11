"""
Unit tests for shared geospatial utilities (pure functions, no DB).
"""
import math

from src.app.shared.geo import (
    Point,
    URBAN_CIRCUITY_FACTOR,
    eta_minutes,
    greedy_multi_insertion,
    haversine_km,
    insertion_detour,
    path_km,
    point_to_route_km,
    road_km,
)

# Reference points in AMBA
OBELISCO = Point(-34.6037, -58.3816)
CABALLITO = Point(-34.6186, -58.4399)
QUILMES = Point(-34.7203, -58.2542)
LA_PLATA = Point(-34.9215, -57.9545)


def test_haversine_known_distance():
    # Obelisco -> Caballito is ~5.6 km straight line
    d = haversine_km(OBELISCO, CABALLITO)
    assert 5.0 < d < 6.5


def test_haversine_zero_for_same_point():
    assert haversine_km(OBELISCO, OBELISCO) == 0.0


def test_road_km_applies_circuity():
    assert road_km(OBELISCO, CABALLITO) == haversine_km(OBELISCO, CABALLITO) * URBAN_CIRCUITY_FACTOR


def test_path_km_sums_segments():
    direct = road_km(CABALLITO, OBELISCO)
    via = path_km([CABALLITO, QUILMES, OBELISCO])
    assert via > direct  # triangle inequality


def test_insertion_detour_zero_when_on_route():
    # pickup/dropoff exactly at the route endpoints -> no extra distance
    r = insertion_detour(CABALLITO, OBELISCO, CABALLITO, OBELISCO)
    assert r.detour_km == 0.0
    assert r.detour_ratio == 0.0


def test_insertion_detour_positive_when_off_route():
    # Caballito -> Obelisco route, shipment toward La Plata = huge detour
    r = insertion_detour(CABALLITO, OBELISCO, QUILMES, LA_PLATA)
    assert r.detour_km > 0
    assert r.detour_ratio > 1.0  # detour exceeds the whole base route


def test_point_to_route_zero_on_endpoint():
    assert point_to_route_km(CABALLITO, CABALLITO, OBELISCO) < 0.01


def test_point_to_route_positive_off_route():
    d = point_to_route_km(LA_PLATA, CABALLITO, OBELISCO)
    assert d > 30  # La Plata is ~50 km from the CABA route


def test_eta_minutes_scales_with_speed():
    assert eta_minutes(10, "bike") > eta_minutes(10, "motorcycle")
    assert eta_minutes(0.01, "car") >= 1  # never returns 0


def test_greedy_multi_insertion_respects_pickup_before_dropoff():
    stops = [(QUILMES, OBELISCO)]
    waypoints, total = greedy_multi_insertion(CABALLITO, LA_PLATA, stops)
    assert waypoints.index(QUILMES) < waypoints.index(OBELISCO)
    assert math.isclose(total, path_km(waypoints), rel_tol=1e-6)


def test_greedy_multi_insertion_total_geq_base():
    base = road_km(CABALLITO, OBELISCO)
    _, total = greedy_multi_insertion(CABALLITO, OBELISCO, [(QUILMES, LA_PLATA)])
    assert total >= base
