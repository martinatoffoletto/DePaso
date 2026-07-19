"""
Unit tests for the shipment pricing module (pure functions, no DB required).

Covers: src/app/modules/shipments/pricing.py
"""
import pytest

from src.app.modules.shipments import pricing
from src.app.shared.enums import PackageSize
from src.app.shared.geo import Point

# AMBA reference coordinates
MICROCENTRO = Point(-34.6037, -58.3816)
CABALLITO = Point(-34.6186, -58.4399)
QUILMES = Point(-34.7203, -58.2542)


# --- quote() -----------------------------------------------------------------

def test_quote_returns_all_required_keys():
    q = pricing.quote(MICROCENTRO, CABALLITO, PackageSize.S)
    for key in ("distance_km", "price_dedicated", "price_collaborative",
                "eta_dedicated_min", "eta_collaborative_min"):
        assert key in q, f"Missing key: {key}"


def test_quote_distance_positive():
    q = pricing.quote(MICROCENTRO, CABALLITO, PackageSize.M)
    assert q["distance_km"] > 0


def test_quote_zero_distance_for_same_point():
    q = pricing.quote(MICROCENTRO, MICROCENTRO, PackageSize.S)
    assert q["distance_km"] == pytest.approx(0.0, abs=0.01)


def test_collaborative_always_cheaper_than_dedicated():
    for size in (PackageSize.S, PackageSize.M, PackageSize.L, PackageSize.XL):
        q = pricing.quote(MICROCENTRO, CABALLITO, size)
        assert q["price_collaborative"] < q["price_dedicated"], (
            f"Collaborative not cheaper for size {size}"
        )


def test_collaborative_discount_matches_constant():
    q = pricing.quote(MICROCENTRO, CABALLITO, PackageSize.M)
    expected_collab = round(q["price_dedicated"] * (1 - pricing.COLLABORATIVE_DISCOUNT), 0)
    assert q["price_collaborative"] == pytest.approx(expected_collab, abs=1.0)


def test_all_four_package_sizes_produce_prices():
    for size in (PackageSize.S, PackageSize.M, PackageSize.L, PackageSize.XL):
        q = pricing.quote(MICROCENTRO, CABALLITO, size)
        assert q["price_dedicated"] > 0
        assert q["price_collaborative"] > 0


def test_larger_package_costs_more_dedicated():
    q_s = pricing.quote(MICROCENTRO, CABALLITO, PackageSize.S)
    q_m = pricing.quote(MICROCENTRO, CABALLITO, PackageSize.M)
    q_l = pricing.quote(MICROCENTRO, CABALLITO, PackageSize.L)
    q_xl = pricing.quote(MICROCENTRO, CABALLITO, PackageSize.XL)
    assert q_s["price_dedicated"] < q_m["price_dedicated"]
    assert q_m["price_dedicated"] < q_l["price_dedicated"]
    assert q_l["price_dedicated"] < q_xl["price_dedicated"]


def test_eta_collaborative_longer_than_dedicated():
    q = pricing.quote(MICROCENTRO, CABALLITO, PackageSize.M)
    assert q["eta_collaborative_min"] > q["eta_dedicated_min"]


def test_eta_collaborative_factor_applied():
    q = pricing.quote(MICROCENTRO, CABALLITO, PackageSize.M)
    assert q["eta_collaborative_min"] == round(
        q["eta_dedicated_min"] * pricing.COLLABORATIVE_TIME_FACTOR
    )


def test_longer_distance_yields_higher_price():
    q_near = pricing.quote(MICROCENTRO, CABALLITO, PackageSize.M)
    q_far = pricing.quote(MICROCENTRO, QUILMES, PackageSize.M)
    assert q_far["price_dedicated"] > q_near["price_dedicated"]
    assert q_far["distance_km"] > q_near["distance_km"]


# --- price_for() -------------------------------------------------------------

def test_price_for_dedicated_matches_quote():
    q = pricing.quote(MICROCENTRO, CABALLITO, PackageSize.M)
    p = pricing.price_for(MICROCENTRO, CABALLITO, PackageSize.M, "dedicated")
    assert p == q["price_dedicated"]


def test_price_for_collaborative_matches_quote():
    q = pricing.quote(MICROCENTRO, CABALLITO, PackageSize.M)
    p = pricing.price_for(MICROCENTRO, CABALLITO, PackageSize.M, "collaborative")
    assert p == q["price_collaborative"]


def test_price_for_dedicated_greater_than_collaborative():
    p_ded = pricing.price_for(MICROCENTRO, CABALLITO, PackageSize.L, "dedicated")
    p_col = pricing.price_for(MICROCENTRO, CABALLITO, PackageSize.L, "collaborative")
    assert p_ded > p_col


# --- scheduled tier ("Hoy" / dedicated by_availability) ----------------------

def test_quote_includes_scheduled_price():
    q = pricing.quote(MICROCENTRO, CABALLITO, PackageSize.M)
    assert "price_scheduled" in q
    assert q["price_scheduled"] > 0


def test_scheduled_between_collaborative_and_dedicated():
    """The "Hoy" tier is the middle rung of the price ladder (MODALIDADES §5)."""
    q = pricing.quote(MICROCENTRO, CABALLITO, PackageSize.L)
    assert q["price_collaborative"] < q["price_scheduled"] < q["price_dedicated"]


def test_scheduled_discount_matches_constant():
    q = pricing.quote(MICROCENTRO, CABALLITO, PackageSize.M)
    expected = round(q["price_dedicated"] * (1 - pricing.SCHEDULED_DISCOUNT), 0)
    assert q["price_scheduled"] == pytest.approx(expected, abs=1.0)


def test_price_for_dedicated_by_availability_is_scheduled():
    q = pricing.quote(MICROCENTRO, CABALLITO, PackageSize.M)
    p = pricing.price_for(MICROCENTRO, CABALLITO, PackageSize.M,
                          "dedicated", "by_availability")
    assert p == q["price_scheduled"]


def test_price_for_dedicated_on_demand_is_full_fare():
    q = pricing.quote(MICROCENTRO, CABALLITO, PackageSize.M)
    p = pricing.price_for(MICROCENTRO, CABALLITO, PackageSize.M,
                          "dedicated", "on_demand")
    assert p == q["price_dedicated"]


def test_price_for_collaborative_same_in_both_assignment_modes():
    """Collaborative costs the same whether the signal came from demand or space."""
    p_demand = pricing.price_for(MICROCENTRO, CABALLITO, PackageSize.M,
                                 "collaborative", "on_demand")
    p_space = pricing.price_for(MICROCENTRO, CABALLITO, PackageSize.M,
                                "collaborative", "by_availability")
    assert p_demand == p_space


def test_base_fare_present_for_all_sizes():
    """BASE_FARE must have entries for all four size categories."""
    for size in (PackageSize.S, PackageSize.M, PackageSize.L, PackageSize.XL):
        assert size in pricing.BASE_FARE
        assert pricing.BASE_FARE[size] > 0


def test_per_km_rate_present_for_all_sizes():
    for size in (PackageSize.S, PackageSize.M, PackageSize.L, PackageSize.XL):
        assert size in pricing.PER_KM
        assert pricing.PER_KM[size] > 0
