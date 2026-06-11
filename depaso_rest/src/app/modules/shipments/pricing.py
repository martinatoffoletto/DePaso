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
    PackageSize.XS: 1500.0,
    PackageSize.S: 2000.0,
    PackageSize.M: 2800.0,
    PackageSize.L: 4000.0,
    PackageSize.XL: 9000.0,
}
PER_KM: dict[str, float] = {
    PackageSize.XS: 250.0,
    PackageSize.S: 300.0,
    PackageSize.M: 380.0,
    PackageSize.L: 520.0,
    PackageSize.XL: 900.0,
}

# Collaborative rides piggyback on an existing trip: the carrier is paid for
# the detour, not the full journey -> ~43% cheaper (consistent with survey ranges).
COLLABORATIVE_DISCOUNT = 0.43

# Collaborative takes longer: the carrier follows their own route first.
COLLABORATIVE_TIME_FACTOR = 1.9

# Reference vehicle for ETA quoting before a carrier is assigned.
QUOTE_VEHICLE = "motorcycle"


def quote(origin: Point, destination: Point, package_size: str) -> dict:
    """Price and ETA for both modalities over a route (shown pre-confirmation)."""
    distance = road_km(origin, destination)
    dedicated = BASE_FARE[package_size] + PER_KM[package_size] * distance
    collaborative = dedicated * (1 - COLLABORATIVE_DISCOUNT)
    eta_dedicated = eta_minutes(distance, QUOTE_VEHICLE)

    return {
        "distance_km": round(distance, 2),
        "price_dedicated": round(dedicated, 0),
        "price_collaborative": round(collaborative, 0),
        "eta_dedicated_min": eta_dedicated,
        "eta_collaborative_min": round(eta_dedicated * COLLABORATIVE_TIME_FACTOR),
    }


def price_for(origin: Point, destination: Point, package_size: str, modality: str) -> float:
    """Final estimated price for the chosen modality."""
    q = quote(origin, destination, package_size)
    return q["price_collaborative"] if modality == "collaborative" else q["price_dedicated"]
