"""
OSRM client — real street-network distances for matching and CO2.

Falls back to haversine x circuity estimation when OSRM is unreachable, so
matching keeps working in dev/demo without the routing container running.

Run OSRM locally with the Argentina extract:
  docker run -p 5000:5000 osrm/osrm-backend osrm-routed /data/argentina-latest.osrm
"""
import httpx
import structlog

from src.app.shared.geo import Point, path_km

logger = structlog.get_logger(__name__)

DEFAULT_OSRM_URL = "http://localhost:5000"
REQUEST_TIMEOUT_S = 2.0


class OSRMClient:
    """Thin wrapper over the OSRM /route service with graceful degradation."""

    def __init__(self, base_url: str = DEFAULT_OSRM_URL) -> None:
        self.base_url = base_url.rstrip("/")
        self._available: bool | None = None  # cached after first failure

    def route_km(self, points: list[Point]) -> float:
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
            resp = httpx.get(url, params={"overview": "false"}, timeout=REQUEST_TIMEOUT_S)
            resp.raise_for_status()
            data = resp.json()
            self._available = True
            return data["routes"][0]["distance"] / 1000.0
        except (httpx.HTTPError, KeyError, IndexError) as exc:
            if self._available is None:
                logger.warning("osrm_unavailable_using_fallback", error=str(exc))
            self._available = False
            return path_km(points)
