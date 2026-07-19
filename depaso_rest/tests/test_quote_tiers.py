"""
Integration tests (via the real API, TestClient) for the 3-tier price ladder
(Ya / Hoy / De paso) and the live collaborative-availability signal in the
quote endpoint. Spec: MODALIDADES.md §3.2, §4.1, §5.

Unit-level pricing math lives in tests/test_pricing.py — this file only covers
the API/integration behaviour (quote endpoint response + create/update repricing).
"""
from datetime import datetime, timedelta, timezone

from fastapi.testclient import TestClient

from tests.test_integration_flows import _register, _verified_carrier, _wide_window

# Same corridor the feed/matching integration tests use: the shipment pickup and
# dropoff sit almost on top of the published route, so the haversine detour
# fallback (OSRM is down in tests) stays well under the 15% collaborative cap.
ROUTE_ORIGIN = {"origin_lat": -34.6037, "origin_lon": -58.3816}
ROUTE_DEST = {"destination_lat": -34.5837, "destination_lon": -58.4016}
SHIP_ORIGIN = {"origin_lat": -34.6000, "origin_lon": -58.3850}
SHIP_DEST = {"destination_lat": -34.5900, "destination_lon": -58.3950}

QUOTE_BODY = {**SHIP_ORIGIN, **SHIP_DEST, "package_size": "m"}


def _quote(client: TestClient, **overrides) -> dict:
    res = client.post("/api/v1/shipments/quote", json={**QUOTE_BODY, **overrides})
    assert res.status_code == 200, res.text
    return res.json()


def _publish_route(client: TestClient, carrier_headers: dict, window: tuple[str, str]):
    start, end = window
    res = client.post("/api/v1/routes", json={
        "kind": "collaborative_route",
        **ROUTE_ORIGIN, **ROUTE_DEST,
        "window_start": start, "window_end": end,
    }, headers=carrier_headers)
    assert res.status_code == 201, res.text
    return res.json()


# --- price ladder ------------------------------------------------------------

def test_quote_returns_three_tier_ladder(client: TestClient):
    """API quote exposes the 3 prices in the right order and the "Hoy" tier is
    exactly the -18% scheduled discount off the full dedicated fare."""
    q = _quote(client)
    assert q["price_collaborative"] < q["price_scheduled"] < q["price_dedicated"]
    assert q["price_scheduled"] == round(q["price_dedicated"] * 0.82, 0)


# --- collaborative availability signal ---------------------------------------

def test_quote_no_routes_published_signal_zero(client: TestClient):
    """With no collaborative trajectory published, the honest signal is 0
    (never promise "De paso" availability that doesn't exist)."""
    q = _quote(client)
    assert q["collaborative_routes_now"] == 0


def test_quote_active_route_in_window_counts(client: TestClient, db):
    """A verified carrier's collaborative route, active right now and on the
    requested corridor, makes the signal >= 1."""
    carrier_headers, _ = _verified_carrier(client, db, "quote_live@example.com",
                                           plate="QT-001")
    _publish_route(client, carrier_headers, _wide_window())

    q = _quote(client)
    assert q["collaborative_routes_now"] >= 1


def test_quote_route_out_of_window_not_counted(client: TestClient, db):
    """A route whose window is already over (and not recurring) is not a live
    trajectory -> it must not inflate the signal."""
    carrier_headers, _ = _verified_carrier(client, db, "quote_past@example.com",
                                           plate="QT-002")
    now = datetime.now(timezone.utc)
    past = (
        (now - timedelta(hours=5)).strftime("%Y-%m-%dT%H:%M:%SZ"),
        (now - timedelta(hours=2)).strftime("%Y-%m-%dT%H:%M:%SZ"),
    )
    _publish_route(client, carrier_headers, past)

    q = _quote(client)
    assert q["collaborative_routes_now"] == 0


# --- create / update repricing per assignment mode ---------------------------

def test_create_dedicated_prices_by_assignment_mode(client: TestClient):
    """Dedicated + by_availability ("Hoy") is priced at the scheduled tier;
    dedicated + on_demand ("Ya") at the full dedicated fare."""
    headers, _ = _register(client, "quote_create@example.com")
    q = _quote(client)

    base = {**SHIP_ORIGIN, **SHIP_DEST, "package_size": "m",
            "modality": "dedicated", "weight_kg": 5.0}

    scheduled = client.post("/api/v1/shipments",
                            json={**base, "assignment_mode": "by_availability"},
                            headers=headers)
    assert scheduled.status_code == 201, scheduled.text
    assert scheduled.json()["estimated_price"] == q["price_scheduled"]

    on_demand = client.post("/api/v1/shipments",
                            json={**base, "assignment_mode": "on_demand"},
                            headers=headers)
    assert on_demand.status_code == 201, on_demand.text
    assert on_demand.json()["estimated_price"] == q["price_dedicated"]


def test_update_assignment_mode_reprices_to_scheduled(client: TestClient):
    """Switching a pending dedicated shipment from on_demand ("Ya") to
    by_availability ("Hoy") must recompute the price down to the scheduled tier."""
    headers, _ = _register(client, "quote_update@example.com")
    q = _quote(client)

    created = client.post("/api/v1/shipments", json={
        **SHIP_ORIGIN, **SHIP_DEST, "package_size": "m",
        "modality": "dedicated", "assignment_mode": "on_demand", "weight_kg": 5.0,
    }, headers=headers)
    assert created.status_code == 201, created.text
    sid = created.json()["id"]
    assert created.json()["estimated_price"] == q["price_dedicated"]

    updated = client.patch(f"/api/v1/shipments/{sid}",
                           json={"assignment_mode": "by_availability"},
                           headers=headers)
    assert updated.status_code == 200, updated.text
    assert updated.json()["estimated_price"] == q["price_scheduled"]
