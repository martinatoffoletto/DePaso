"""
CO2 module - Carbon footprint calculation.
Deterministic CO2 savings calculation per IPCC 2019 factors (section 5.3 of spec).
"""
from src.app.shared.enums import VehicleType


class CO2Service:
    """Service for CO2 calculation.

    Emission factors (kg CO2/km) based on IPCC 2019 + Argentine factors:
    - Pedestrian: 0.00
    - Bike: 0.00
    - Motorcycle: 0.09
    - Car: 0.18
    - Van: 0.25
    - Truck: 0.60
    """

    EMISSION_FACTORS: dict[str, float] = {
        VehicleType.PEDESTRIAN: 0.00,
        VehicleType.BIKE: 0.00,
        VehicleType.MOTORCYCLE: 0.09,
        VehicleType.CAR: 0.18,
        VehicleType.VAN: 0.25,
        VehicleType.TRUCK: 0.60,
    }

    def get_emission_factor(self, vehicle_type: str) -> float:
        """Get emission factor for a vehicle type (kg CO2/km)."""
        return self.EMISSION_FACTORS.get(vehicle_type, 0.20)

    def calculate_direct_emissions(self, distance_km: float, vehicle_type: str) -> float:
        """Calculate emissions for a direct delivery (kg CO2)."""
        factor = self.get_emission_factor(vehicle_type)
        return distance_km * factor

    def calculate_savings(self, detour_km: float, dedicated_distance_km: float,
                          vehicle_type: str) -> dict[str, float]:
        """Calculate CO2 savings for a collaborative shipment.

        Args:
            detour_km: Additional distance the carrier travels for this shipment.
            dedicated_distance_km: Distance if the shipment were sent via dedicated carrier.
            vehicle_type: Type of vehicle used.

        Returns:
            dict with real_emissions, counterfactual_emissions, savings_kg, savings_percent.
        """
        factor = self.get_emission_factor(vehicle_type)

        # Real: only the additional detour contributes emissions
        real_emissions = detour_km * factor

        # Counterfactual: full dedicated trip
        counterfactual_emissions = dedicated_distance_km * factor

        savings_kg = counterfactual_emissions - real_emissions
        savings_percent = (savings_kg / counterfactual_emissions * 100) if counterfactual_emissions > 0 else 0.0

        return {
            "real_emissions_kg": round(real_emissions, 4),
            "counterfactual_emissions_kg": round(counterfactual_emissions, 4),
            "savings_kg": round(savings_kg, 4),
            "savings_percent": round(savings_percent, 2),
        }
