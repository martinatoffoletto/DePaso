"""
Shipment pricing — deterministic quote per modality.

Survey finding (n=145): price is the #1 selection criterion (82%) and must be
visible before confirming, with no hidden charges. Rates are module constants
so admins can tune them; the collaborative discount reflects the WTP/WTA gap
measured in the survey (sender WTP $3.000-6.000 vs carrier WTA $2.500-5.000).
"""
from src.app.shared.enums import PackageSize
from src.app.shared.geo import Point, eta_minutes, road_km

# Base fare + per-km rate (ARS) by package category.
BASE_FARE: dict[str, float] = {
    PackageSize.S: 2000.0,
    PackageSize.M: 2800.0,
    PackageSize.L: 4000.0,
    PackageSize.XL: 9000.0,
}
PER_KM: dict[str, float] = {
    PackageSize.S: 300.0,
    PackageSize.M: 380.0,
    PackageSize.L: 520.0,
    PackageSize.XL: 900.0,
}

# Collaborative rides piggyback on an existing trip: the carrier is paid for
# the detour, not the full journey -> ~43% cheaper (consistent with survey ranges).
COLLABORATIVE_DISCOUNT = 0.43

# Tier "Hoy" (dedicated por espacio / by_availability): the pickup is scheduled
# inside a carrier's declared window, so the cost of approaching the pickup is
# shared across the orders of that window instead of charged to a single trip.
# Intermediate discount between the full dedicated fare (100%) and the
# collaborative -43%; sits inside the WTP/WTA gap measured in the survey
# (sender WTP $3.000-6.000 vs carrier WTA $2.500-5.000). To calibrate.
SCHEDULED_DISCOUNT = 0.18

# Collaborative takes longer: the carrier follows their own route first.
COLLABORATIVE_TIME_FACTOR = 1.9

# Reference vehicle for ETA quoting before a carrier is assigned.
QUOTE_VEHICLE = "motorcycle"

# Platform commission (take rate). The client pays the full quoted price; the
# platform keeps this share and the carrier receives the rest. Kept deliberately
# low: the survey (n=145) shows a narrow margin between sender WTP ($3.000-6.000)
# and carrier WTA ($2.500-5.000), and warns the model "no tolera comisiones altas
# en etapas tempranas" (hallazgo 5). ~15% sits inside that WTP/WTA gap.
PLATFORM_COMMISSION_RATE = 0.15


def platform_fee(price: float) -> float:
    """Platform's cut of a shipment price (ARS, rounded)."""
    return round((price or 0.0) * PLATFORM_COMMISSION_RATE, 2)


def carrier_payout(price: float) -> float:
    """What the carrier actually earns: price minus the platform commission."""
    return round((price or 0.0) - platform_fee(price), 2)


def quote(origin: Point, destination: Point, package_size: str) -> dict:
    """Price and ETA for both modalities over a route (shown pre-confirmation)."""
    distance = road_km(origin, destination)
    dedicated = BASE_FARE[package_size] + PER_KM[package_size] * distance
    collaborative = dedicated * (1 - COLLABORATIVE_DISCOUNT)
    scheduled = dedicated * (1 - SCHEDULED_DISCOUNT)
    eta_dedicated = eta_minutes(distance, QUOTE_VEHICLE)

    return {
        "distance_km": round(distance, 2),
        "price_dedicated": round(dedicated, 0),
        "price_scheduled": round(scheduled, 0),
        "price_collaborative": round(collaborative, 0),
        "eta_dedicated_min": eta_dedicated,
        "eta_collaborative_min": round(eta_dedicated * COLLABORATIVE_TIME_FACTOR),
    }


def price_for(origin: Point, destination: Point, package_size: str,
              modality: str, assignment_mode: str | None = None) -> float:
    """Final estimated price for the chosen modality + assignment.

    Three price tiers (spec MODALIDADES.md §5):
    - collaborative ("De paso"): -43%, same in both assignment modes (the price
      reflects the shared trip, not who declared it).
    - dedicated + by_availability ("Hoy"): intermediate scheduled discount.
    - dedicated + on_demand / anything else ("Ya"): full dedicated fare.
    """
    q = quote(origin, destination, package_size)
    if modality == "collaborative":
        return q["price_collaborative"]
    if assignment_mode == "by_availability":
        return q["price_scheduled"]
    return q["price_dedicated"]
