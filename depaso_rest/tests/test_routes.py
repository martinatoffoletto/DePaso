"""
Integration tests para el módulo routes (publicación de trayectos y ventanas).
El módulo no tenía cobertura propia.
"""
from datetime import datetime, timedelta, timezone

from fastapi.testclient import TestClient


def _win(hours_from=0, hours_to=8):
    now = datetime.now(timezone.utc)
    return (
        (now + timedelta(hours=hours_from)).strftime("%Y-%m-%dT%H:%M:%SZ"),
        (now + timedelta(hours=hours_to)).strftime("%Y-%m-%dT%H:%M:%SZ"),
    )


def _verified_carrier(client, db, email, plate="RT-001", vehicle="car"):
    from src.app.core.security import create_access_token
    from src.app.modules.users.models import User

    reg = client.post("/api/v1/auth/register", json={
        "email": email, "password": "Password123!",
        "first_name": "R", "last_name": "T",
    })
    headers = {"Authorization": f"Bearer {reg.json()['access_token']}"}
    client.post("/api/v1/carriers/me", json={
        "company_name": "Route Co", "vehicle_type": vehicle,
        "license_plate": plate, "capacity_kg": 50.0,
    }, headers=headers)
    admin = db.query(User).filter(User.email == "route_admin@example.com").first()
    if admin is None:
        admin = User(email="route_admin@example.com", password_hash="x",
                     first_name="A", last_name="A", user_type="admin", is_active=True)
        db.add(admin); db.commit(); db.refresh(admin)
    atok = create_access_token(data={"sub": str(admin.id)})
    cid = client.get("/api/v1/carriers/me", headers=headers).json()["id"]
    client.patch(f"/api/v1/admin/carriers/{cid}", json={"action": "verify"},
                 headers={"Authorization": f"Bearer {atok}"})
    return headers


def test_publish_collaborative_route(client: TestClient, db):
    h = _verified_carrier(client, db, "pub@example.com")
    ws, we = _win()
    res = client.post("/api/v1/routes", json={
        "kind": "collaborative_route",
        "origin_lat": -34.60, "origin_lon": -58.38,
        "destination_lat": -34.55, "destination_lon": -58.45,
        "window_start": ws, "window_end": we,
    }, headers=h)
    assert res.status_code == 201, res.text


def test_unverified_carrier_cannot_publish(client: TestClient, db):
    reg = client.post("/api/v1/auth/register", json={
        "email": "unverified@example.com", "password": "Password123!",
        "first_name": "U", "last_name": "V",
    })
    h = {"Authorization": f"Bearer {reg.json()['access_token']}"}
    client.post("/api/v1/carriers/me", json={
        "company_name": "X", "vehicle_type": "car",
        "license_plate": "UV-001", "capacity_kg": 20.0,
    }, headers=h)
    ws, we = _win()
    res = client.post("/api/v1/routes", json={
        "kind": "collaborative_route",
        "origin_lat": -34.6, "origin_lon": -58.38,
        "destination_lat": -34.55, "destination_lon": -58.45,
        "window_start": ws, "window_end": we,
    }, headers=h)
    assert res.status_code == 403  # carrier no verificado


def test_invalid_kind_rejected(client: TestClient, db):
    h = _verified_carrier(client, db, "badkind@example.com", plate="RT-002")
    ws, we = _win()
    res = client.post("/api/v1/routes", json={
        "kind": "banana",
        "origin_lat": -34.6, "origin_lon": -58.38,
        "destination_lat": -34.55, "destination_lon": -58.45,
        "window_start": ws, "window_end": we,
    }, headers=h)
    assert res.status_code == 422


def test_collaborative_requires_destination(client: TestClient, db):
    h = _verified_carrier(client, db, "nodest@example.com", plate="RT-003")
    ws, we = _win()
    res = client.post("/api/v1/routes", json={
        "kind": "collaborative_route",
        "origin_lat": -34.6, "origin_lon": -58.38,
        "window_start": ws, "window_end": we,
    }, headers=h)
    assert res.status_code == 422


def test_cannot_update_another_carriers_route(client: TestClient, db):
    ha = _verified_carrier(client, db, "route_a@example.com", plate="RT-A01")
    hb = _verified_carrier(client, db, "route_b@example.com", plate="RT-B01")
    ws, we = _win()
    rid = client.post("/api/v1/routes", json={
        "kind": "collaborative_route",
        "origin_lat": -34.6, "origin_lon": -58.38,
        "destination_lat": -34.55, "destination_lon": -58.45,
        "window_start": ws, "window_end": we,
    }, headers=ha).json()["id"]
    # B intenta editar la ruta de A -> 404 (no revela existencia)
    res = client.patch(f"/api/v1/routes/{rid}", json={"origin_lat": 0.0}, headers=hb)
    assert res.status_code == 404


def test_update_cannot_invert_window(client: TestClient, db):
    h = _verified_carrier(client, db, "invwin@example.com", plate="RT-004")
    ws, we = _win(hours_from=0, hours_to=8)
    rid = client.post("/api/v1/routes", json={
        "kind": "collaborative_route",
        "origin_lat": -34.6, "origin_lon": -58.38,
        "destination_lat": -34.55, "destination_lon": -58.45,
        "window_start": ws, "window_end": we,
    }, headers=h).json()["id"]
    # mover window_start después de window_end -> rechazado
    later = (datetime.now(timezone.utc) + timedelta(hours=20)).strftime("%Y-%m-%dT%H:%M:%SZ")
    res = client.patch(f"/api/v1/routes/{rid}", json={"window_start": later}, headers=h)
    assert res.status_code == 400
