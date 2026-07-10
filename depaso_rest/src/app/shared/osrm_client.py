"""
OSRM client — real street-network distances for matching and CO2.

Async (httpx.AsyncClient with keep-alive: one shared connection pool instead
of a new TCP handshake per call). Falls back to haversine x circuity when
OSRM is unreachable, so matching keeps working in dev/demo without the
routing container running.

Run OSRM locally with the Argentina extract:
  docker run -p 5000:5000 osrm/osrm-backend osrm-routed /data/argentina-latest.osrm
"""
import asyncio

import httpx
import structlog

from src.app.shared.geo import DetourResult, Point, insertion_detour, path_km

logger = structlog.get_logger(__name__)

DEFAULT_OSRM_URL = "http://localhost:5000"
REQUEST_TIMEOUT_S = 2.0


class OSRMClient:
    """Thin wrapper over the OSRM /route service with graceful degradation."""

    def __init__(self, base_url: str = DEFAULT_OSRM_URL) -> None:
        self.base_url = base_url.rstrip("/")
        self._available: bool | None = None  # cached after first failure
        self._client = httpx.AsyncClient(timeout=REQUEST_TIMEOUT_S)

    async def route_km(self, points: list[Point]) -> float:
        """
        Road distance in km visiting points in order.
        Uses OSRM when reachable, otherwise haversine x circuity factor.
        """
        if len(points) < 2:
            return 0.0
        if self._available is False:
            return path_km(points)

        coords = ";".join(f"{p.lon},{p.lat}" for p in points)
        url = f"{self.base_url}/route/v1/driving/{coords}"
        try:
            resp = await self._client.get(url, params={"overview": "false"})
            resp.raise_for_status()
            data = resp.json()
            self._available = True
            return data["routes"][0]["distance"] / 1000.0
        except (httpx.HTTPError, KeyError, IndexError) as exc:
            if self._available is None:
                logger.warning("osrm_unavailable_using_fallback", error=str(exc))
            self._available = False
            return path_km(points)

    async def detour(
        self,
        route_origin: Point,
        route_destination: Point,
        pickup: Point,
        dropoff: Point,
    ) -> DetourResult:
        """Detour of inserting pickup+dropoff into a route, with real street
        distances when OSRM is up (base and total requested concurrently)."""
        if self._available is False:
            return insertion_detour(route_origin, route_destination, pickup, dropoff)
        base, total = await asyncio.gather(
            self.route_km([route_origin, route_destination]),
            self.route_km([route_origin, pickup, dropoff, route_destination]),
        )
        detour_km = max(0.0, total - base)
        # inf cuando base=0: igual que geo.insertion_detour, hace fallar el cap.
        ratio = detour_km / base if base > 0 else float("inf")
        return DetourResult(
            base_km=round(base, 3),
            total_km=round(total, 3),
            detour_km=round(detour_km, 3),
            detour_ratio=round(ratio, 4),
        )
