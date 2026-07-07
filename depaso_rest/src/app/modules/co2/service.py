"""
CO2 module - Carbon savings calculation (spec 5.3). Deterministic, no ML.

Methodology (RF-CO2-01):
- Real scenario: the shipment rides along an existing carrier trip; the only
  attributable emission is the additional detour x vehicle emission factor.
- Counterfactual scenario: the same shipment done as a dedicated trip
  (carrier position -> pickup -> dropoff) x dedicated vehicle factor.
- Savings = counterfactual - real.

This per-shipment quantification, fed back to the user on completion, is one
of the five differentiators identified in the state-of-the-art review: no
local platform nor reviewed academic work reports it.
"""
from sqlalchemy import func
from sqlalchemy.orm import Session

from src.app.modules.shipments.models import Shipment
from src.app.shared.enums import ShipmentModality, ShipmentStatus, VehicleType
from src.app.shared.geo import Point, insertion_detour, road_km

# Everyday equivalences of saved CO2 (for the impact screen).
# - average car: 0.18 kg CO2/km · one urban tree: ~21 kg/year (FAO/EPA)
# - one full smartphone charge: ~8 g CO2 (EPA greenhouse-gas equivalencies)
CAR_KG_PER_KM = 0.18
TREE_KG_PER_YEAR = 21.0
SMARTPHONE_KG_PER_CHARGE = 0.008

# Emission factors (kg CO2/km), IPCC 2019 Refinement + Argentine factors (spec 5.3).
EMISSION_FACTORS: dict[str, float] = {
    VehicleType.PEDESTRIAN: 0.00,
    VehicleType.BIKE: 0.00,
    VehicleType.MOTORCYCLE: 0.09,
    VehicleType.CAR: 0.18,
    VehicleType.VAN: 0.25,
    VehicleType.TRUCK: 0.60,
}

# When the collaborative carrier is zero-emission (bike/pedestrian), the
# counterfactual dedicated trip would still need a motor vehicle. The most
# common dedicated courier vehicle in AMBA is the motorcycle.
COUNTERFACTUAL_FALLBACK_VEHICLE = VehicleType.MOTORCYCLE


class CO2Service:
    """Deterministic CO2 savings calculation."""

    def get_emission_factor(self, vehicle_type: str) -> float:
        """Emission factor for a vehicle type (kg CO2/km)."""
        return EMISSION_FACTORS.get(vehicle_type, 0.20)

    def calculate_direct_emissions(self, distance_km: float, vehicle_type: str) -> float:
        """Emissions of a direct trip (kg CO2)."""
        return distance_km * self.get_emission_factor(vehicle_type)

    def calculate_savings(
        self,
        detour_km: float,
        dedicated_distance_km: float,
        vehicle_type: str,
        dedicated_vehicle_type: str | None = None,
    ) -> dict[str, float]:
        """CO2 savings of a collaborative shipment given precomputed distances.

        Args:
            detour_km: additional km the collaborative carrier travels.
            dedicated_distance_km: km of the counterfactual dedicated trip.
            vehicle_type: collaborative carrier's vehicle.
            dedicated_vehicle_type: vehicle assumed for the counterfactual;
                defaults to the same vehicle, or a motorcycle when the
                collaborative vehicle is zero-emission (bike/pedestrian).
        """
        real_factor = self.get_emission_factor(vehicle_type)
        if dedicated_vehicle_type is None:
            dedicated_vehicle_type = (
                COUNTERFACTUAL_FALLBACK_VEHICLE if real_factor == 0.0 else vehicle_type
            )
        counterfactual_factor = self.get_emission_factor(dedicated_vehicle_type)

        real_emissions = detour_km * real_factor
        counterfactual_emissions = dedicated_distance_km * counterfactual_factor

        savings_kg = max(0.0, counterfactual_emissions - real_emissions)
        savings_percent = (
            savings_kg / counterfactual_emissions * 100
            if counterfactual_emissions > 0 else 0.0
        )
        return {
            "real_emissions_kg": round(real_emissions, 4),
            "counterfactual_emissions_kg": round(counterfactual_emissions, 4),
            "savings_kg": round(savings_kg, 4),
            "savings_percent": round(savings_percent, 2),
        }

    def calculate_shipment_savings(
        self,
        route_origin: Point,
        route_destination: Point,
        pickup: Point,
        dropoff: Point,
        vehicle_type: str,
        dedicated_vehicle_type: str | None = None,
    ) -> dict[str, float]:
        """Full spec-5.3 calculation from coordinates (RF-CO2-01).

        Real: detour from inserting pickup+dropoff into the carrier's route.
        Counterfactual: dedicated round trip route_origin -> pickup -> dropoff.
        """
        detour = insertion_detour(route_origin, route_destination, pickup, dropoff)
        dedicated_km = road_km(route_origin, pickup) + road_km(pickup, dropoff)
        result = self.calculate_savings(
            detour_km=detour.detour_km,
            dedicated_distance_km=dedicated_km,
            vehicle_type=vehicle_type,
            dedicated_vehicle_type=dedicated_vehicle_type,
        )
        result["detour_km"] = detour.detour_km
        result["dedicated_distance_km"] = round(dedicated_km, 3)
        return result

    # -- accumulated client impact (RF-CO2-02) ----------------------------------

    def equivalences(self, total_kg: float) -> dict:
        """Everyday equivalences of a CO2 saving (car km, tree months, charges)."""
        return {
            "car_km": round(total_kg / CAR_KG_PER_KM, 1),
            "tree_months": round(total_kg / TREE_KG_PER_YEAR * 12, 1),
            "smartphone_charges": int(total_kg / SMARTPHONE_KG_PER_CHARGE),
        }

    def client_impact(self, db: Session, client_id: int) -> dict:
        """Accumulated CO2 savings of a client over their delivered shipments."""
        delivered = Shipment.status == ShipmentStatus.DELIVERED
        mine = Shipment.client_id == client_id
        total_kg = float(
            db.query(func.coalesce(func.sum(Shipment.co2_savings_kg), 0.0))
            .filter(mine, delivered).scalar()
        )
        delivered_count = db.query(func.count(Shipment.id)).filter(mine, delivered).scalar() or 0
        collaborative_count = (
            db.query(func.count(Shipment.id))
            .filter(mine, delivered, Shipment.modality == ShipmentModality.COLLABORATIVE)
            .scalar() or 0
        )
        return {
            "total_co2_saved_kg": round(total_kg, 3),
            "shipments_delivered": delivered_count,
            "shipments_collaborative": collaborative_count,
            "equivalences": self.equivalences(total_kg),
        }
