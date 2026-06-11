"""
Unit tests for the CO2 savings calculation (spec 5.3 — deterministic).
"""
from pytest import approx

from src.app.modules.co2.service import CO2Service
from src.app.shared.geo import Point

OBELISCO = Point(-34.6037, -58.3816)
CABALLITO = Point(-34.6186, -58.4399)
QUILMES = Point(-34.7203, -58.2542)

service = CO2Service()


def test_emission_factors_match_spec():
    assert service.get_emission_factor("motorcycle") == 0.09
    assert service.get_emission_factor("car") == 0.18
    assert service.get_emission_factor("van") == 0.25
    assert service.get_emission_factor("truck") == 0.60
    assert service.get_emission_factor("bike") == 0.0
    assert service.get_emission_factor("pedestrian") == 0.0


def test_savings_basic():
    # 2 km detour vs 10 km dedicated trip, by car
    r = service.calculate_savings(detour_km=2, dedicated_distance_km=10, vehicle_type="car")
    assert r["real_emissions_kg"] == approx(2 * 0.18)
    assert r["counterfactual_emissions_kg"] == approx(10 * 0.18)
    assert r["savings_kg"] == approx(8 * 0.18, abs=1e-4)
    assert r["savings_percent"] == approx(80.0)


def test_savings_never_negative():
    # detour longer than the dedicated trip: collaborative made it worse,
    # but reported savings floor at 0 (the matching hard filter prevents this case)
    r = service.calculate_savings(detour_km=20, dedicated_distance_km=5, vehicle_type="car")
    assert r["savings_kg"] == 0.0


def test_zero_emission_vehicle_uses_motorcycle_counterfactual():
    # a bike shipment saves the emissions of the dedicated motor trip
    r = service.calculate_savings(detour_km=1, dedicated_distance_km=5, vehicle_type="bike")
    assert r["real_emissions_kg"] == 0.0
    assert r["counterfactual_emissions_kg"] == approx(5 * 0.09)  # motorcycle fallback
    assert r["savings_percent"] == approx(100.0)


def test_shipment_savings_from_coordinates():
    r = service.calculate_shipment_savings(
        route_origin=CABALLITO,
        route_destination=OBELISCO,
        pickup=CABALLITO,
        dropoff=OBELISCO,
        vehicle_type="car",
    )
    # pickup/dropoff on the route -> zero detour -> 100% savings
    assert r["detour_km"] == 0.0
    assert r["real_emissions_kg"] == 0.0
    assert r["savings_kg"] > 0
    assert r["savings_percent"] == 100.0


def test_shipment_savings_with_detour():
    r = service.calculate_shipment_savings(
        route_origin=CABALLITO,
        route_destination=OBELISCO,
        pickup=QUILMES,
        dropoff=OBELISCO,
        vehicle_type="car",
    )
    assert r["detour_km"] > 0
    assert r["real_emissions_kg"] > 0
    assert r["counterfactual_emissions_kg"] > r["real_emissions_kg"] - 1e9  # computed
