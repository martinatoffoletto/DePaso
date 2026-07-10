"""
Tests for the tracking module.

Unit tests: TrackingService with fake repos (no DB).
Integration tests: /api/v1/tracking/* endpoints via TestClient.

Covers: src/app/modules/tracking/service.py
        src/app/modules/tracking/router.py
"""
from types import SimpleNamespace

import pytest
from fastapi.testclient import TestClient

from src.app.modules.tracking.service import TrackingService, TRACKABLE_STATUSES
from src.app.shared.enums import ShipmentStatus
from src.app.shared.exceptions import ForbiddenError, NotFoundError


# --- Fake repositories -------------------------------------------------------

class FakeTrackingRepo:
    def __init__(self):
        self._traces: list = []
        self._next_id = 1

    async def create(self, carrier_id, shipment_id, lat, lon):
        t = SimpleNamespace(
            id=self._next_id,
            carrier_id=carrier_id,
            shipment_id=shipment_id,
            lat=lat,
            lon=lon,
        )
        self._traces.append(t)
        self._next_id += 1
        return t

    async def latest_for_shipment(self, shipment_id):
        for t in reversed(self._traces):
            if t.shipment_id == shipment_id:
                return t
        return None

    async def history_for_shipment(self, shipment_id, limit=500):
        return [t for t in self._traces if t.shipment_id == shipment_id][:limit]


class FakeCarrierRepo:
    def __init__(self, carriers=()):
        self._store = {c.id: c for c in carriers}

    async def update(self, carrier_id, **kwargs):
        c = self._store.get(carrier_id)
        if c:
            for k, v in kwargs.items():
                setattr(c, k, v)
        return c

    async def get_by_id(self, carrier_id):
        return self._store.get(carrier_id)


class FakeShipmentRepo:
    def __init__(self, shipments=()):
        self._store = {s.id: s for s in shipments}

    async def get_by_id(self, shipment_id):
        return self._store.get(shipment_id)

    async def list_active_by_carrier(self, carrier_id):
        return [
            s for s in self._store.values()
            if s.carrier_id == carrier_id and s.status in TRACKABLE_STATUSES
        ]


def make_carrier(id=1, user_id=10):
    return SimpleNamespace(id=id, user_id=user_id, current_lat=None, current_lon=None)


def make_shipment(id=1, carrier_id=1, client_id=5,
                  status=ShipmentStatus.ASSIGNED):
    return SimpleNamespace(
        id=id, carrier_id=carrier_id, client_id=client_id, status=status
    )


def make_service(carriers=(), shipments=(), traces=()):
    tracking_repo = FakeTrackingRepo()
    for t in traces:
        tracking_repo._traces.append(t)
    return (
        TrackingService(
            repository=tracking_repo,
            carrier_repo=FakeCarrierRepo(carriers),
            shipment_repo=FakeShipmentRepo(shipments),
        ),
        tracking_repo,
    )


# --- Unit tests: publish_position --------------------------------------------

async def test_publish_position_no_active_shipments_returns_zero():
    carrier = make_carrier(id=1)
    svc, repo = make_service(carriers=[carrier], shipments=[])
    count = await svc.publish_position(carrier_id=1, lat=-34.6037, lon=-58.3816)
    assert count == 0


async def test_publish_position_no_active_shipments_still_records_trace():
    """Even with no active shipments a positional trace is recorded."""
    carrier = make_carrier(id=1)
    svc, repo = make_service(carriers=[carrier], shipments=[])
    await svc.publish_position(carrier_id=1, lat=-34.6037, lon=-58.3816)
    assert len(repo._traces) == 1
    assert repo._traces[0].shipment_id is None


async def test_publish_position_with_active_shipments_returns_count():
    carrier = make_carrier(id=1)
    s1 = make_shipment(id=1, carrier_id=1, status=ShipmentStatus.ASSIGNED)
    s2 = make_shipment(id=2, carrier_id=1, status=ShipmentStatus.IN_TRANSIT)
    svc, repo = make_service(carriers=[carrier], shipments=[s1, s2])
    count = await svc.publish_position(carrier_id=1, lat=-34.6, lon=-58.4)
    assert count == 2
    assert len(repo._traces) == 2


async def test_publish_position_updates_carrier_location():
    carrier = make_carrier(id=1)
    svc, _ = make_service(carriers=[carrier])
    await svc.publish_position(carrier_id=1, lat=-34.9, lon=-57.9)
    assert carrier.current_lat == -34.9
    assert carrier.current_lon == -57.9


async def test_publish_position_pending_shipment_not_traced():
    """PENDING shipments are not active and must not receive a trace."""
    carrier = make_carrier(id=1)
    pending = make_shipment(id=1, carrier_id=1, status=ShipmentStatus.PENDING)
    svc, repo = make_service(carriers=[carrier], shipments=[pending])
    count = await svc.publish_position(carrier_id=1, lat=-34.6, lon=-58.4)
    assert count == 0
    # One trace exists but with shipment_id=None (idle trace)
    assert repo._traces[0].shipment_id is None


# --- Unit tests: shipment_location -------------------------------------------

async def test_shipment_location_not_found_raises_value_error():
    svc, _ = make_service()
    with pytest.raises(NotFoundError, match="Shipment not found"):
        await svc.shipment_location(shipment_id=999, requester_user_id=1)


async def test_shipment_location_pending_status_returns_none():
    """Tracking is private: PENDING shipments (no carrier yet) return None."""
    pending = make_shipment(id=1, carrier_id=None, client_id=5,
                            status=ShipmentStatus.PENDING)
    svc, _ = make_service(shipments=[pending])
    result = await svc.shipment_location(shipment_id=1, requester_user_id=5)
    assert result is None


async def test_shipment_location_delivered_status_returns_none():
    delivered = make_shipment(id=1, carrier_id=1, client_id=5,
                              status=ShipmentStatus.DELIVERED)
    svc, _ = make_service(carriers=[make_carrier(id=1)], shipments=[delivered])
    result = await svc.shipment_location(shipment_id=1, requester_user_id=5)
    assert result is None


async def test_shipment_location_unauthorized_raises_permission_error():
    carrier = make_carrier(id=1, user_id=10)
    shipment = make_shipment(id=1, carrier_id=1, client_id=5,
                             status=ShipmentStatus.ASSIGNED)
    svc, _ = make_service(carriers=[carrier], shipments=[shipment])
    with pytest.raises(ForbiddenError):
        await svc.shipment_location(shipment_id=1, requester_user_id=99)


async def test_shipment_location_authorized_as_client_returns_trace():
    carrier = make_carrier(id=1, user_id=10)
    shipment = make_shipment(id=1, carrier_id=1, client_id=5,
                             status=ShipmentStatus.ASSIGNED)
    trace = SimpleNamespace(id=1, shipment_id=1, lat=-34.6, lon=-58.4)
    svc, repo = make_service(carriers=[carrier], shipments=[shipment])
    repo._traces.append(trace)
    result = await svc.shipment_location(shipment_id=1, requester_user_id=5)
    assert result is not None
    assert result.lat == -34.6


async def test_shipment_location_authorized_as_carrier_user():
    carrier = make_carrier(id=1, user_id=10)
    shipment = make_shipment(id=1, carrier_id=1, client_id=5,
                             status=ShipmentStatus.IN_TRANSIT)
    trace = SimpleNamespace(id=1, shipment_id=1, lat=-34.7, lon=-58.3)
    svc, repo = make_service(carriers=[carrier], shipments=[shipment])
    repo._traces.append(trace)
    result = await svc.shipment_location(shipment_id=1, requester_user_id=10)
    assert result is not None
    assert result.lat == -34.7


async def test_shipment_location_no_traces_returns_none():
    carrier = make_carrier(id=1, user_id=10)
    shipment = make_shipment(id=1, carrier_id=1, client_id=5,
                             status=ShipmentStatus.ASSIGNED)
    svc, _ = make_service(carriers=[carrier], shipments=[shipment])
    result = await svc.shipment_location(shipment_id=1, requester_user_id=5)
    assert result is None


# --- Unit tests: shipment_history --------------------------------------------

async def test_shipment_history_returns_empty_list_when_no_traces():
    svc, _ = make_service()
    history = await svc.shipment_history(shipment_id=42)
    assert history == []


async def test_shipment_history_returns_traces_in_order():
    t1 = SimpleNamespace(id=1, shipment_id=7, lat=-34.6, lon=-58.3)
    t2 = SimpleNamespace(id=2, shipment_id=7, lat=-34.61, lon=-58.31)
    t3 = SimpleNamespace(id=3, shipment_id=9, lat=-34.7, lon=-58.2)
    svc, repo = make_service()
    repo._traces.extend([t1, t2, t3])
    history = await svc.shipment_history(shipment_id=7)
    assert len(history) == 2
    assert history[0].id == 1
    assert history[1].id == 2


# --- Integration tests via TestClient ----------------------------------------

def _register(client: TestClient, email: str) -> dict:
    res = client.post("/api/v1/auth/register", json={
        "email": email,
        "password": "Password123!",
        "first_name": "Track",
        "last_name": "User",
        "phone_number": "123456789",
        "user_type": "client",
    })
    assert res.status_code == 201, res.text
    return {"Authorization": f"Bearer {res.json()['access_token']}"}


def test_publish_position_unauthenticated(client: TestClient):
    res = client.post("/api/v1/tracking/position", json={"lat": -34.6, "lon": -58.3})
    assert res.status_code == 401


def test_publish_position_no_carrier_profile_returns_403(client: TestClient):
    """A plain user (no carrier profile) cannot publish positions."""
    headers = _register(client, "track_nocart@example.com")
    res = client.post(
        "/api/v1/tracking/position",
        json={"lat": -34.6037, "lon": -58.3816},
        headers=headers,
    )
    assert res.status_code == 403


def test_publish_position_with_carrier_profile(client: TestClient):
    """A user with a carrier profile can publish a position."""
    headers = _register(client, "track_carrier@example.com")
    # Create carrier profile
    cp_res = client.post("/api/v1/carriers/me", json={
        "company_name": "Track Co",
        "vehicle_type": "car",
        "license_plate": "TRK-001",
        "capacity_kg": 50.0,
    }, headers=headers)
    assert cp_res.status_code == 201, cp_res.text

    res = client.post(
        "/api/v1/tracking/position",
        json={"lat": -34.6037, "lon": -58.3816},
        headers=headers,
    )
    assert res.status_code == 202
    assert "traced_shipments" in res.json()
    assert res.json()["traced_shipments"] == 0


def test_get_location_unauthenticated(client: TestClient):
    res = client.get("/api/v1/tracking/999")
    assert res.status_code == 401


def test_get_location_shipment_not_found(client: TestClient):
    headers = _register(client, "track_notfound@example.com")
    res = client.get("/api/v1/tracking/99999", headers=headers)
    assert res.status_code == 404


def test_get_history_unauthenticated(client: TestClient):
    res = client.get("/api/v1/tracking/1/history")
    assert res.status_code == 401


def test_get_history_returns_empty_list(client: TestClient):
    """History for a shipment with no traces returns an empty list."""
    headers = _register(client, "track_hist@example.com")
    res = client.get("/api/v1/tracking/99999/history", headers=headers)
    # The history endpoint doesn't check shipment existence; returns empty
    assert res.status_code == 200
    assert res.json() == []
