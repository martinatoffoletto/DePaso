"""
Routes module - Carrier trajectory publication and querying.
"""
from src.app.modules.carriers.repository import CarrierRepository
from src.app.modules.routes.repository import RouteRepository
from src.app.modules.routes.schemas import RouteCreateRequest, RouteResponse
from src.app.shared.enums import VehicleType
from src.app.shared.geo import Point, road_km

# Pedestrian/bike collaborative routes are only valid for short trips (spec 3.3).
MAX_SOFT_MOBILITY_ROUTE_KM = 5.0
SOFT_MOBILITY = {VehicleType.PEDESTRIAN, VehicleType.BIKE}


class RouteService:
    """Service for publishing and managing carrier routes."""

    def __init__(self, route_repo: RouteRepository, carrier_repo: CarrierRepository) -> None:
        self.route_repo = route_repo
        self.carrier_repo = carrier_repo

    def publish(self, carrier_id: int, data: RouteCreateRequest) -> RouteResponse:
        """Publish a collaborative route or dedicated availability window."""
        carrier = self.carrier_repo.get_by_id(carrier_id)
        if not carrier:
            raise ValueError("Carrier not found.")
        if not carrier.is_verified:
            raise ValueError("Carrier must be verified before publishing routes.")

        if data.kind == "collaborative_route" and carrier.vehicle_type in SOFT_MOBILITY:
            trip_km = road_km(
                Point(data.origin_lat, data.origin_lon),
                Point(data.destination_lat, data.destination_lon),
            )
            if trip_km > MAX_SOFT_MOBILITY_ROUTE_KM:
                raise ValueError(
                    f"Pedestrian/bike routes are limited to {MAX_SOFT_MOBILITY_ROUTE_KM} km "
                    f"(this route is ~{trip_km:.1f} km)."
                )

        route = self.route_repo.create(carrier_id=carrier_id, **data.model_dump())
        return RouteResponse.model_validate(route)

    def list_for_carrier(self, carrier_id: int) -> list[RouteResponse]:
        """All routes published by a carrier."""
        routes = self.route_repo.list_by_carrier(carrier_id)
        return [RouteResponse.model_validate(r) for r in routes]

    def deactivate(self, carrier_id: int, route_id: int) -> None:
        """Deactivate a route owned by the carrier."""
        route = self.route_repo.get_by_id(route_id)
        if not route or route.carrier_id != carrier_id:
            raise ValueError("Route not found.")
        self.route_repo.deactivate(route_id)
