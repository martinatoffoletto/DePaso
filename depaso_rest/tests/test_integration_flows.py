from datetime import datetime, timedelta, timezone

import pytest
from fastapi.testclient import TestClient

# Mock OS environment to bypass rate limit
import os
os.environ["RATE_LIMIT_ENABLED"] = "false"


# --- helpers ----------------------------------------------------------------

def _register(client: TestClient, email: str, user_type: str = "client") -> tuple[dict, int]:
    """Register a user and return (auth headers, user id)."""
    res = client.post("/api/v1/auth/register", json={
        "email": email,
        "password": "Password123!",
        "first_name": "Test",
        "last_name": "User",
        "phone_number": "123456789",
        "user_type": user_type,
    })
    assert res.status_code == 201, res.text
    body = res.json()
    return {"Authorization": f"Bearer {body['access_token']}"}, body["user"]["id"]


def _make_admin(db) -> dict:
    """Insert an admin straight into the DB and return its auth headers."""
    from src.app.core.security import create_access_token
    from src.app.modules.users.models import User

    admin = db.query(User).filter(User.email == "admin_flows@example.com").first()
    if admin is None:
        admin = User(
            email="admin_flows@example.com", password_hash="fake",
            first_name="Admin", last_name="Admin", user_type="admin", is_active=True,
        )
        db.add(admin)
        db.commit()
        db.refresh(admin)
    token = create_access_token(data={"sub": str(admin.id)})
    return {"Authorization": f"Bearer {token}"}


def _verified_carrier(client: TestClient, db, email: str, vehicle="car",
                      capacity_kg=25.0, plate="ABC-123") -> tuple[dict, int]:
    """Register a user, create a carrier profile and have an admin verify it."""
    headers, _ = _register(client, email, user_type="client")
    res = client.post("/api/v1/carriers/me", json={
        "company_name": "ACME Logistics",
        "vehicle_type": vehicle,
        "license_plate": plate,
        "capacity_kg": capacity_kg,
        "capacity_volume_m3": 2.0,
    }, headers=headers)
    assert res.status_code == 201, res.text
    carrier_id = res.json()["id"]

    admin_headers = _make_admin(db)
    res_v = client.patch(f"/api/v1/admin/carriers/{carrier_id}",
                         json={"action": "verify"}, headers=admin_headers)
    assert res_v.status_code == 200, res_v.text
    return headers, carrier_id


def _wide_window() -> tuple[str, str]:
    """A route time window that always contains 'now' so the feed includes it."""
    now = datetime.now(timezone.utc)
    start = (now - timedelta(hours=1)).strftime("%Y-%m-%dT%H:%M:%SZ")
    end = (now + timedelta(hours=8)).strftime("%Y-%m-%dT%H:%M:%SZ")
    return start, end

def test_integration_flow_carrier_capacity_and_matching(client: TestClient, db):
    """
    Test End-to-End:
    1. Register client and carrier.
    2. Admin verifies carrier.
    3. Carrier publishes a route.
    4. Client requests 3 shipments.
    5. Carrier accepts shipments until capacity is exhausted.
    6. System rejects exceeding capacity.
    """
    # 1. Register Client
    res_client = client.post("/api/v1/auth/register", json={
        "email": "client@example.com",
        "password": "Password123!",
        "first_name": "John",
        "last_name": "Client",
        "phone_number": "123456789",
        "user_type": "client"
    })
    assert res_client.status_code == 201
    client_token = res_client.json()["access_token"]
    client_headers = {"Authorization": f"Bearer {client_token}"}
    client_id = res_client.json()["user"]["id"]

    # 2. Register Carrier as a client first, then create carrier profile
    res_carrier = client.post("/api/v1/auth/register", json={
        "email": "carrier@example.com",
        "password": "Password123!",
        "first_name": "Jane",
        "last_name": "Carrier",
        "phone_number": "987654321",
        "user_type": "client"
    })
    assert res_carrier.status_code == 201
    carrier_token = res_carrier.json()["access_token"]
    carrier_headers = {"Authorization": f"Bearer {carrier_token}"}
    carrier_user_id = res_carrier.json()["user"]["id"]

    # 3. Create Carrier Profile (Car, 25kg capacity)
    res_carrier_profile = client.post("/api/v1/carriers/me", json={
        "user_id": carrier_user_id,
        "company_name": "Jane Logistics",
        "vehicle_type": "car",
        "license_plate": "JLG-100",
        "capacity_kg": 25.0,
        "capacity_volume_m3": 2.0
    }, headers=carrier_headers)
    assert res_carrier_profile.status_code == 201
    carrier_profile_id = res_carrier_profile.json()["id"]

    # 4. Admin verifies the carrier
    # Create an admin user directly in DB for testing
    from src.app.modules.users.models import User
    admin_user = User(
        email="admin@example.com",
        password_hash="fake",
        first_name="Admin",
        last_name="Admin",
        user_type="admin",
        is_active=True
    )
    db.add(admin_user)
    db.commit()
    
    # Generate admin token
    from src.app.core.security import create_access_token
    admin_token = create_access_token(data={"sub": str(admin_user.id)})
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    res_verify = client.patch(f"/api/v1/admin/carriers/{carrier_profile_id}", json={
        "action": "verify"
    }, headers=admin_headers)
    assert res_verify.status_code == 200

    # 5. Carrier publishes a route (from point A to B)
    res_route = client.post("/api/v1/routes", json={
        "kind": "collaborative_route",
        "origin_lat": -34.6037,
        "origin_lon": -58.3816,
        "destination_lat": -34.5837,
        "destination_lon": -58.4016,
        "window_start": "2030-01-01T10:00:00Z",
        "window_end": "2030-01-01T18:00:00Z"
    }, headers=carrier_headers)
    assert res_route.status_code == 201
    route_id = res_route.json()["id"]

    # 6. Client requests 3 shipments along that route
    # Shipment 1: 10kg
    s1 = client.post("/api/v1/shipments", json={
        "package_size": "m",
        "modality": "collaborative",
        "assignment_mode": "on_demand",
        "origin_lat": -34.6000,
        "origin_lon": -58.3850,
        "destination_lat": -34.5900,
        "destination_lon": -58.3950,
        "weight_kg": 10.0
    }, headers=client_headers).json()

    # Shipment 2: 15kg
    s2 = client.post("/api/v1/shipments", json={
        "package_size": "l",
        "modality": "collaborative",
        "assignment_mode": "on_demand",
        "origin_lat": -34.6000,
        "origin_lon": -58.3850,
        "destination_lat": -34.5900,
        "destination_lon": -58.3950,
        "weight_kg": 15.0
    }, headers=client_headers).json()

    # Shipment 3: 5kg (m: el peso debe respetar el tope de la categoría)
    s3 = client.post("/api/v1/shipments", json={
        "package_size": "m",
        "modality": "collaborative",
        "assignment_mode": "on_demand",
        "origin_lat": -34.6000,
        "origin_lon": -58.3850,
        "destination_lat": -34.5900,
        "destination_lon": -58.3950,
        "weight_kg": 5.0
    }, headers=client_headers).json()

    # 7. Carrier checks their feed and should see shipments
    res_feed = client.get("/api/v1/carriers/me/feed", headers=carrier_headers)
    assert res_feed.status_code == 200
    # The feed logic might rely on time window, our route is 2030 but default window check
    # uses datetime.utcnow(). We might need to mock time or ignore feed strictly.
    # We can just accept them directly to test capacity.

    # 8. Carrier accepts Shipment 1 (10kg) -> Success (25 - 10 = 15kg left)
    res_accept1 = client.post(f"/api/v1/shipments/{s1['id']}/accept", json={"route_id": route_id}, headers=carrier_headers)
    assert res_accept1.status_code == 200

    # 9. Carrier accepts Shipment 2 (15kg) -> Success (15 - 15 = 0kg left)
    res_accept2 = client.post(f"/api/v1/shipments/{s2['id']}/accept", json={"route_id": route_id}, headers=carrier_headers)
    assert res_accept2.status_code == 200

    # 10. Carrier attempts to accept Shipment 3 (5kg) -> Reject due to capacity
    res_accept3 = client.post(f"/api/v1/shipments/{s3['id']}/accept", json={"route_id": route_id}, headers=carrier_headers)
    assert res_accept3.status_code == 400  # ValidationError de dominio -> 400
    assert "capacity" in res_accept3.json()["detail"].lower()

    # 11. Carrier delivers Shipment 1 -> Capacity is freed
    # Update status: pickup_arrived -> in_transit -> delivered
    for st in ["pickup_arrived", "in_transit", "delivered"]:
        res_status = client.post(f"/api/v1/shipments/{s1['id']}/status", json={"new_status": st}, headers=carrier_headers)
        assert res_status.status_code == 200

    # Now Carrier should have 10kg free capacity, so accepting Shipment 3 (5kg) should succeed
    res_accept3_retry = client.post(f"/api/v1/shipments/{s3['id']}/accept", json={"route_id": route_id}, headers=carrier_headers)
    assert res_accept3_retry.status_code == 200

    # 12. Client rates Carrier for Shipment 1
    res_rating = client.post(f"/api/v1/shipments/{s1['id']}/rating", json={
        "stars": 5,
        "comment": "Great service!"
    }, headers=client_headers)
    assert res_rating.status_code == 201

    # Check Carrier summary
    res_summary = client.get("/api/v1/carriers/me/summary", headers=carrier_headers)
    assert res_summary.status_code == 200
    summary = res_summary.json()
    assert summary["deliveries_completed"] == 1
    assert summary["reputation"] == 5.0


def test_client_lifecycle_quote_create_edit_cancel(client: TestClient):
    """CASOS 1.1 + 1.2: quote -> create -> edit (reprice) -> cancel."""
    headers, _ = _register(client, "lifecycle@example.com")

    # 1. Quote before creating: both modalities priced.
    quote = client.post("/api/v1/shipments/quote", json={
        "origin_lat": -34.6037, "origin_lon": -58.3816,
        "destination_lat": -34.5837, "destination_lon": -58.4016,
        "package_size": "s",
    })
    assert quote.status_code == 200, quote.text
    q = quote.json()
    assert q["price_collaborative"] < q["price_dedicated"]  # collab is cheaper
    assert q["distance_km"] > 0

    # 2. Create the shipment -> PENDING.
    created = client.post("/api/v1/shipments", json={
        "package_size": "s",
        "modality": "collaborative",
        "assignment_mode": "on_demand",
        "origin_lat": -34.6037, "origin_lon": -58.3816,
        "destination_lat": -34.5837, "destination_lon": -58.4016,
        "weight_kg": 3.0,
    }, headers=headers)
    assert created.status_code == 201, created.text
    shipment = created.json()
    sid = shipment["id"]
    assert shipment["status"] == "pending"
    original_price = shipment["estimated_price"]

    # 3. Edit it: bump the package size -> price must be recalculated.
    edited = client.patch(f"/api/v1/shipments/{sid}", json={
        "package_size": "l",
    }, headers=headers)
    assert edited.status_code == 200, edited.text
    assert edited.json()["package_size"] == "l"
    assert edited.json()["estimated_price"] != original_price

    # 4. A different user cannot edit my shipment.
    other_headers, _ = _register(client, "intruder@example.com")
    forbidden = client.patch(f"/api/v1/shipments/{sid}", json={"weight_kg": 1.0},
                             headers=other_headers)
    assert forbidden.status_code == 403

    # 5. Cancel while still PENDING.
    cancelled = client.post(f"/api/v1/shipments/{sid}/cancel", headers=headers)
    assert cancelled.status_code == 200, cancelled.text
    assert cancelled.json()["status"] == "cancelled"

    # 6. A cancelled shipment can no longer be edited.
    after = client.patch(f"/api/v1/shipments/{sid}", json={"package_size": "m"},
                         headers=headers)
    assert after.status_code == 400


def test_admin_weights_then_collaborative_happy_path(client: TestClient, db):
    """CASOS 3.1: admin tunes weights, carrier on-route, full happy path E2E."""
    # 1. Admin retunes the matching weights (must keep sum == 1.0).
    admin_headers = _make_admin(db)
    res_w = client.patch("/api/v1/matching/weights", json={
        "geo": 0.40, "detour": 0.25,
    }, headers=admin_headers)
    assert res_w.status_code == 200, res_w.text
    assert abs(sum(res_w.json().values()) - 1.0) < 1e-6

    # An invalid set (sum != 1) is rejected.
    bad = client.patch("/api/v1/matching/weights", json={"geo": 0.99},
                       headers=admin_headers)
    assert bad.status_code == 422

    # 2. Verified carrier publishes a route covering 'now'.
    carrier_headers, _ = _verified_carrier(client, db, "happy_carrier@example.com")
    start, end = _wide_window()
    route = client.post("/api/v1/routes", json={
        "kind": "collaborative_route",
        "origin_lat": -34.6037, "origin_lon": -58.3816,
        "destination_lat": -34.5837, "destination_lon": -58.4016,
        "window_start": start, "window_end": end,
    }, headers=carrier_headers)
    assert route.status_code == 201, route.text
    route_id = route.json()["id"]

    # 3. Client requests a collaborative shipment right on that corridor.
    client_headers, _ = _register(client, "happy_client@example.com")
    ship = client.post("/api/v1/shipments", json={
        "package_size": "m",
        "modality": "collaborative",
        "assignment_mode": "on_demand",
        "origin_lat": -34.6000, "origin_lon": -58.3850,
        "destination_lat": -34.5900, "destination_lon": -58.3950,
        "weight_kg": 4.0,
    }, headers=client_headers).json()
    sid = ship["id"]

    # 4. Carrier sees the shipment ranked in their feed.
    feed = client.get("/api/v1/carriers/me/feed", headers=carrier_headers)
    assert feed.status_code == 200, feed.text
    feed_ids = [item["shipment_id"] for item in feed.json()]
    assert sid in feed_ids, f"shipment {sid} not in feed {feed.json()}"

    # 5. Carrier accepts -> shipment becomes ASSIGNED for the client.
    accept = client.post(f"/api/v1/shipments/{sid}/accept",
                         json={"route_id": route_id}, headers=carrier_headers)
    assert accept.status_code == 200, accept.text
    detail = client.get(f"/api/v1/shipments/{sid}", headers=client_headers)
    assert detail.json()["status"] == "assigned"

    # 6. Carrier walks the delivery milestones.
    for st in ["pickup_arrived", "in_transit", "delivered"]:
        r = client.post(f"/api/v1/shipments/{sid}/status",
                        json={"new_status": st}, headers=carrier_headers)
        assert r.status_code == 200, r.text

    # 7. Client gives 5 stars; carrier summary reflects it + CO2 + earnings.
    rating = client.post(f"/api/v1/shipments/{sid}/rating",
                         json={"stars": 5, "comment": "Excelente"},
                         headers=client_headers)
    assert rating.status_code == 201, rating.text

    summary = client.get("/api/v1/carriers/me/summary", headers=carrier_headers).json()
    assert summary["deliveries_completed"] == 1
    assert summary["reputation"] == 5.0
    assert summary["total_co2_saved_kg"] > 0  # collaborative trip saved CO2
    assert summary["total_earnings"] > 0


def test_carrier_late_cancellation_penalty(client: TestClient, db):
    """CASOS 3.2: carrier backs out after accepting -> back to PENDING + penalty."""
    carrier_headers, carrier_id = _verified_carrier(client, db, "quitter@example.com")
    start, end = _wide_window()
    route = client.post("/api/v1/routes", json={
        "kind": "collaborative_route",
        "origin_lat": -34.6037, "origin_lon": -58.3816,
        "destination_lat": -34.5837, "destination_lon": -58.4016,
        "window_start": start, "window_end": end,
    }, headers=carrier_headers).json()

    client_headers, _ = _register(client, "jilted@example.com")
    ship = client.post("/api/v1/shipments", json={
        "package_size": "m",
        "modality": "collaborative",
        "assignment_mode": "on_demand",
        "origin_lat": -34.6000, "origin_lon": -58.3850,
        "destination_lat": -34.5900, "destination_lon": -58.3950,
        "weight_kg": 4.0,
    }, headers=client_headers).json()
    sid = ship["id"]

    # Reputation before backing out (fresh carriers start at 5.0).
    rep_before = client.get("/api/v1/carriers/me/summary",
                            headers=carrier_headers).json()["reputation"]

    accept = client.post(f"/api/v1/shipments/{sid}/accept",
                         json={"route_id": route["id"]}, headers=carrier_headers)
    assert accept.status_code == 200, accept.text

    cancel = client.post(f"/api/v1/shipments/{sid}/carrier-cancel",
                         headers=carrier_headers)
    assert cancel.status_code == 200, cancel.text
    assert cancel.json()["status"] == "pending"  # available again for others

    rep_after = client.get("/api/v1/carriers/me/summary",
                           headers=carrier_headers).json()["reputation"]
    assert rep_after < rep_before  # reputation penalty applied


# --- concurrencia / exclusividad (auditoría piloto 1000 usuarios) -------------

SHIP_BASE = {
    "package_size": "m",
    "assignment_mode": "on_demand",
    "origin_lat": -34.6000, "origin_lon": -58.3850,
    "destination_lat": -34.5900, "destination_lon": -58.3950,
    "weight_kg": 5.0,
}


def _mk_shipment(client, headers, modality):
    res = client.post("/api/v1/shipments", json={**SHIP_BASE, "modality": modality},
                      headers=headers)
    assert res.status_code == 201, res.text
    return res.json()


def test_dedicated_trip_is_exclusive(client: TestClient, db):
    """Un carrier con un viaje dedicado activo no puede aceptar otro envío,
    y un carrier con envíos activos no puede aceptar un dedicado."""
    client_headers, _ = _register(client, "excl_client@example.com")
    carrier_headers, _ = _verified_carrier(client, db, "excl_carrier@example.com",
                                           plate="EXC-001")

    dedicated = _mk_shipment(client, client_headers, "dedicated")
    other = _mk_shipment(client, client_headers, "collaborative")

    # acepta el dedicado
    res = client.post(f"/api/v1/shipments/{dedicated['id']}/accept", json={},
                      headers=carrier_headers)
    assert res.status_code == 200, res.text

    # con un dedicado activo, NO puede aceptar nada más
    res = client.post(f"/api/v1/shipments/{other['id']}/accept", json={},
                      headers=carrier_headers)
    assert res.status_code == 400
    assert res.json()["code"] == "CARRIER_ON_DEDICATED_TRIP"


def test_dedicated_rejected_if_carrier_has_active_work(client: TestClient, db):
    client_headers, _ = _register(client, "excl2_client@example.com")
    carrier_headers, _ = _verified_carrier(client, db, "excl2_carrier@example.com",
                                           plate="EXC-002")

    collab = _mk_shipment(client, client_headers, "collaborative")
    dedicated = _mk_shipment(client, client_headers, "dedicated")

    res = client.post(f"/api/v1/shipments/{collab['id']}/accept", json={},
                      headers=carrier_headers)
    assert res.status_code == 200, res.text

    # con trabajo activo, un dedicado (exclusivo) se rechaza
    res = client.post(f"/api/v1/shipments/{dedicated['id']}/accept", json={},
                      headers=carrier_headers)
    assert res.status_code == 400
    assert res.json()["code"] == "CARRIER_BUSY"


def test_second_carrier_profile_conflicts(client: TestClient, db):
    """El UNIQUE de carriers.user_id convierte el doble POST en 409, no en duplicado."""
    headers, _ = _register(client, "dupcarrier@example.com")
    payload = {
        "company_name": "Dup SA", "vehicle_type": "car",
        "license_plate": "DUP-001", "capacity_kg": 10.0,
    }
    res1 = client.post("/api/v1/carriers/me", json=payload, headers=headers)
    assert res1.status_code == 201, res1.text
    res2 = client.post("/api/v1/carriers/me",
                       json={**payload, "license_plate": "DUP-002"}, headers=headers)
    assert res2.status_code == 409


def test_shipment_cannot_be_accepted_twice(client: TestClient, db):
    """Compare-and-set: el segundo accept del mismo envío recibe error, nunca
    se reasigna (simula dos carriers compitiendo por el mismo paquete)."""
    client_headers, _ = _register(client, "race_client@example.com")
    c1_headers, c1_id = _verified_carrier(client, db, "race_c1@example.com", plate="RAC-001")
    c2_headers, _ = _verified_carrier(client, db, "race_c2@example.com", plate="RAC-002")

    shipment = _mk_shipment(client, client_headers, "collaborative")

    res1 = client.post(f"/api/v1/shipments/{shipment['id']}/accept", json={},
                       headers=c1_headers)
    assert res1.status_code == 200
    assert res1.json()["carrier_id"] == c1_id

    res2 = client.post(f"/api/v1/shipments/{shipment['id']}/accept", json={},
                       headers=c2_headers)
    assert res2.status_code == 400  # ya no está PENDING

    # el envío sigue asignado al PRIMER carrier
    res = client.get(f"/api/v1/shipments/{shipment['id']}", headers=client_headers)
    assert res.json()["carrier_id"] == c1_id


def test_soft_mobility_carrier_needs_no_plate(client: TestClient, db):
    """Un ciclista se registra sin patente; un auto sin patente se rechaza."""
    h1, _ = _register(client, "bici@example.com")
    res = client.post("/api/v1/carriers/me", json={
        "company_name": "Bici Mensajería", "vehicle_type": "bike", "capacity_kg": 8.0,
    }, headers=h1)
    assert res.status_code == 201, res.text
    assert res.json()["license_plate"] is None

    h2, _ = _register(client, "auto_sin_patente@example.com")
    res = client.post("/api/v1/carriers/me", json={
        "company_name": "Auto SA", "vehicle_type": "car", "capacity_kg": 100.0,
    }, headers=h2)
    assert res.status_code == 422  # validación de Pydantic


def test_user_endpoints_require_admin(client: TestClient, db):
    """Un usuario normal NO puede listar/leer/editar/borrar otros usuarios."""
    headers, uid = _register(client, "normal@example.com")
    other, other_id = _register(client, "other@example.com")

    assert client.get("/api/v1/users", headers=headers).status_code == 403
    assert client.get(f"/api/v1/users/{other_id}", headers=headers).status_code == 403
    assert client.patch(f"/api/v1/users/{other_id}", json={"first_name": "Hacked"},
                        headers=headers).status_code == 403
    assert client.delete(f"/api/v1/users/{other_id}", headers=headers).status_code == 403
    # sin token: 401
    assert client.get("/api/v1/users").status_code == 401


def test_admin_can_use_user_endpoints(client: TestClient, db):
    admin_headers = _make_admin(db)
    _, target_id = _register(client, "target@example.com")
    assert client.get("/api/v1/users", headers=admin_headers).status_code == 200
    assert client.get(f"/api/v1/users/{target_id}", headers=admin_headers).status_code == 200


def test_no_public_user_creation(client: TestClient):
    """POST /users ya no existe: el alta pasa por /auth/register (rate-limited)."""
    r = client.post("/api/v1/users", json={
        "email": "sneaky@example.com", "password": "Password123!",
        "first_name": "S", "last_name": "T",
    })
    assert r.status_code in (404, 405)  # ruta eliminada


def test_carrier_reputation_not_settable_by_api(client: TestClient, db):
    """No hay endpoint para escribir reputación a mano (se recalcula de ratings)."""
    headers, _ = _verified_carrier(client, db, "repcheat@example.com", plate="REP-001")
    r = client.post("/api/v1/carriers/1/reputation?rating=5.0", headers=headers)
    assert r.status_code in (404, 405)


def test_carrier_admin_endpoints_require_admin(client: TestClient, db):
    """Un carrier no puede editar/borrar el perfil de otro por id."""
    h1, _ = _verified_carrier(client, db, "c_a@example.com", plate="CA-001")
    h2, c2_id = _verified_carrier(client, db, "c_b@example.com", plate="CA-002")
    assert client.patch(f"/api/v1/carriers/{c2_id}", json={"capacity_kg": 999},
                        headers=h1).status_code == 403
    assert client.delete(f"/api/v1/carriers/{c2_id}", headers=h1).status_code == 403


def test_shipment_detail_is_private(client: TestClient, db):
    """Un tercero no puede leer el envío de otro (contiene teléfono del
    destinatario, dirección y valor declarado): IDOR en GET /{id} y /events."""
    owner, _ = _register(client, "ship_owner@example.com")
    ship = client.post("/api/v1/shipments", json={**SHIP_BASE, "modality": "collaborative",
                        "recipient_name": "Ana", "recipient_phone": "+5491100000000",
                        "declared_value": 50000}, headers=owner).json()

    stranger, _ = _register(client, "stranger@example.com")
    assert client.get(f"/api/v1/shipments/{ship['id']}", headers=stranger).status_code == 403
    assert client.get(f"/api/v1/shipments/{ship['id']}/events", headers=stranger).status_code == 403

    # el dueño sí lo ve
    assert client.get(f"/api/v1/shipments/{ship['id']}", headers=owner).status_code == 200


def test_assigned_carrier_can_view_shipment(client: TestClient, db):
    """El carrier asignado sí puede leer el envío (necesita el contacto)."""
    owner, _ = _register(client, "so2@example.com")
    carrier_headers, _ = _verified_carrier(client, db, "sc2@example.com", plate="SV-001")
    ship = _mk_shipment(client, owner, "collaborative")
    client.post(f"/api/v1/shipments/{ship['id']}/accept", json={}, headers=carrier_headers)
    assert client.get(f"/api/v1/shipments/{ship['id']}", headers=carrier_headers).status_code == 200


def test_matching_inspection_endpoints_require_admin(client: TestClient, db):
    """/ranked y /match exponen datos de todos los carriers -> admin-only.
    Antes estaban sin autenticación."""
    owner, _ = _register(client, "match_owner@example.com")
    ship = _mk_shipment(client, owner, "collaborative")
    sid = ship["id"]

    # sin token
    assert client.get(f"/api/v1/matching/{sid}/ranked").status_code == 401
    assert client.post(f"/api/v1/matching/{sid}/match").status_code == 401
    # user normal (incluso el dueño del envío) -> 403
    assert client.get(f"/api/v1/matching/{sid}/ranked", headers=owner).status_code == 403
    assert client.post(f"/api/v1/matching/{sid}/match", headers=owner).status_code == 403
    # admin -> 200
    admin = _make_admin(db)
    assert client.get(f"/api/v1/matching/{sid}/ranked", headers=admin).status_code == 200


def test_co2_summary_endpoint(client: TestClient, db):
    """GET /co2/me/summary — estaba roto por un await faltante (client_impact
    es async). Un cliente sin envíos entregados ve total 0 y equivalencias."""
    headers, _ = _register(client, "co2user@example.com")
    res = client.get("/api/v1/co2/me/summary", headers=headers)
    assert res.status_code == 200, res.text
    body = res.json()
    assert body["total_co2_saved_kg"] == 0.0
    assert body["shipments_delivered"] == 0
    assert "equivalences" in body
    assert set(body["equivalences"]) == {"car_km", "tree_months", "smartphone_charges"}


def test_co2_summary_requires_auth(client: TestClient):
    assert client.get("/api/v1/co2/me/summary").status_code == 401


def test_carrier_ratings_endpoint(client: TestClient, db):
    """GET /carriers/me/ratings estaba roto por un await faltante
    (list_ratings_by_carrier es async). Un carrier sin reseñas ve []."""
    headers, _ = _verified_carrier(client, db, "ratings_carrier@example.com", plate="CR-001")
    res = client.get("/api/v1/carriers/me/ratings", headers=headers)
    assert res.status_code == 200, res.text
    assert res.json() == []


def test_availability_alias_removed(client: TestClient, db):
    """POST /carriers/me/availability se eliminó (duplicaba POST /routes)."""
    headers, _ = _verified_carrier(client, db, "avail_gone@example.com", plate="AV-001")
    res = client.post("/api/v1/carriers/me/availability", json={}, headers=headers)
    assert res.status_code in (404, 405)


def _pending_shipment(client: TestClient, email: str) -> int:
    """A client creates a small pending collaborative shipment; returns its id."""
    headers, _ = _register(client, email)
    ship = client.post("/api/v1/shipments", json={
        "package_size": "s",
        "modality": "collaborative",
        "assignment_mode": "on_demand",
        "origin_lat": -34.6000, "origin_lon": -58.3850,
        "destination_lat": -34.5900, "destination_lon": -58.3950,
        "weight_kg": 2.0,
    }, headers=headers)
    assert ship.status_code == 201, ship.text
    return ship.json()["id"]


def test_suspended_carrier_cannot_accept(client: TestClient, db):
    """El matching filtra carriers suspendidos del ranking, pero el accept es
    la transición autoritativa: un carrier suspendido no puede aceptar por API."""
    carrier_headers, carrier_id = _verified_carrier(
        client, db, "suspended_acc@example.com", plate="SU-001")
    sid = _pending_shipment(client, "victim_client@example.com")

    admin = _make_admin(db)
    res = client.patch(f"/api/v1/admin/carriers/{carrier_id}",
                       json={"action": "suspend"}, headers=admin)
    assert res.status_code == 200, res.text

    res = client.post(f"/api/v1/shipments/{sid}/accept", json={},
                      headers=carrier_headers)
    assert res.status_code == 403, res.text
    assert res.json()["code"] == "CARRIER_SUSPENDED"


def test_unverified_carrier_cannot_accept(client: TestClient, db):
    headers, _ = _register(client, "unver_acc@example.com")
    res = client.post("/api/v1/carriers/me", json={
        "company_name": "Sin Verificar SRL",
        "vehicle_type": "car",
        "license_plate": "UV-001",
        "capacity_kg": 25.0,
        "capacity_volume_m3": 2.0,
    }, headers=headers)
    assert res.status_code == 201, res.text

    sid = _pending_shipment(client, "unver_client@example.com")
    res = client.post(f"/api/v1/shipments/{sid}/accept", json={}, headers=headers)
    assert res.status_code == 403, res.text
    assert res.json()["code"] == "CARRIER_NOT_VERIFIED"


def test_suspended_carrier_cannot_publish_route(client: TestClient, db):
    carrier_headers, carrier_id = _verified_carrier(
        client, db, "suspended_pub@example.com", plate="SU-002")
    admin = _make_admin(db)
    client.patch(f"/api/v1/admin/carriers/{carrier_id}",
                 json={"action": "suspend"}, headers=admin)

    start, end = _wide_window()
    res = client.post("/api/v1/routes", json={
        "kind": "collaborative_route",
        "origin_lat": -34.6037, "origin_lon": -58.3816,
        "destination_lat": -34.5837, "destination_lon": -58.4016,
        "window_start": start, "window_end": end,
    }, headers=carrier_headers)
    assert res.status_code == 403, res.text
    assert res.json()["code"] == "CARRIER_SUSPENDED"


def test_moderate_missing_carrier_uses_error_envelope(client: TestClient, db):
    """El 404 de moderación sale por el handler global con el envelope estándar
    (antes era un HTTPException crudo con {'detail': ...} sin 'code')."""
    admin = _make_admin(db)
    res = client.patch("/api/v1/admin/carriers/999999",
                       json={"action": "verify"}, headers=admin)
    assert res.status_code == 404, res.text
    body = res.json()
    assert body["success"] is False
    assert body["code"] == "NOT_FOUND"


# --- validación de dominio en creación (auditoría shipments) ------------------

def test_create_shipment_invalid_enums_rejected(client: TestClient, db):
    """Valores inventados de size/modality/assignment_mode -> 400 con código
    (antes: size inválido explotaba con KeyError 500 y el resto se persistía)."""
    headers, _ = _register(client, "invalid_enums@example.com")
    base = {
        "origin_lat": -34.6000, "origin_lon": -58.3850,
        "destination_lat": -34.5900, "destination_lon": -58.3950,
        "weight_kg": 2.0,
    }
    cases = [
        ({"package_size": "xs", "modality": "collaborative",
          "assignment_mode": "on_demand"}, "INVALID_PACKAGE_SIZE"),
        ({"package_size": "m", "modality": "banana",
          "assignment_mode": "on_demand"}, "INVALID_MODALITY"),
        ({"package_size": "m", "modality": "collaborative",
          "assignment_mode": "manual"}, "INVALID_ASSIGNMENT_MODE"),
    ]
    for payload, code in cases:
        res = client.post("/api/v1/shipments", json={**base, **payload}, headers=headers)
        assert res.status_code == 400, res.text
        assert res.json()["code"] == code


def test_xl_must_be_dedicated(client: TestClient, db):
    """Mudanzas/fletes (xl) nunca colaborativos (spec 3.3) — en create y update."""
    headers, _ = _register(client, "xl_collab@example.com")
    base = {
        "origin_lat": -34.6000, "origin_lon": -58.3850,
        "destination_lat": -34.5900, "destination_lon": -58.3950,
        "weight_kg": 80.0,
    }
    res = client.post("/api/v1/shipments", json={
        **base, "package_size": "xl", "modality": "collaborative",
        "assignment_mode": "on_demand",
    }, headers=headers)
    assert res.status_code == 400, res.text
    assert res.json()["code"] == "XL_MUST_BE_DEDICATED"

    # Crear dedicado y tratar de flipear la modalidad por PATCH.
    created = client.post("/api/v1/shipments", json={
        **base, "package_size": "xl", "modality": "dedicated",
        "assignment_mode": "on_demand",
    }, headers=headers)
    assert created.status_code == 201, created.text
    res = client.patch(f"/api/v1/shipments/{created.json()['id']}",
                       json={"modality": "collaborative"}, headers=headers)
    assert res.status_code == 400, res.text
    assert res.json()["code"] == "XL_MUST_BE_DEDICATED"


def test_weight_must_match_category(client: TestClient, db):
    """El peso respeta la categoría: s<=3kg, xl>=30kg."""
    headers, _ = _register(client, "weights_cat@example.com")
    base = {
        "modality": "dedicated", "assignment_mode": "on_demand",
        "origin_lat": -34.6000, "origin_lon": -58.3850,
        "destination_lat": -34.5900, "destination_lon": -58.3950,
    }
    res = client.post("/api/v1/shipments", json={
        **base, "package_size": "s", "weight_kg": 20.0,
    }, headers=headers)
    assert res.status_code == 400, res.text
    assert res.json()["code"] == "WEIGHT_EXCEEDS_CATEGORY"

    res = client.post("/api/v1/shipments", json={
        **base, "package_size": "xl", "weight_kg": 1.4,
    }, headers=headers)
    assert res.status_code == 400, res.text
    assert res.json()["code"] == "XL_MIN_WEIGHT"


def test_accept_rejects_incompatible_vehicle(client: TestClient, db):
    """El accept es autoritativo: una moto no puede llevar un flete XL aunque
    lo pida por API directa (el feed ya lo filtraba, el accept no)."""
    carrier_headers, _ = _verified_carrier(client, db, "moto_xl@example.com",
                                           vehicle="motorcycle", plate="MT-XL1",
                                           capacity_kg=200.0)
    client_headers, _ = _register(client, "xl_owner@example.com")
    ship = client.post("/api/v1/shipments", json={
        "package_size": "xl", "modality": "dedicated",
        "assignment_mode": "on_demand",
        "origin_lat": -34.6000, "origin_lon": -58.3850,
        "destination_lat": -34.5900, "destination_lon": -58.3950,
        "weight_kg": 80.0,
    }, headers=client_headers)
    assert ship.status_code == 201, ship.text
    res = client.post(f"/api/v1/shipments/{ship.json()['id']}/accept",
                      json={}, headers=carrier_headers)
    assert res.status_code == 400, res.text
    assert res.json()["code"] == "VEHICLE_INCOMPATIBLE"


def test_carrier_cannot_cancel_via_status_endpoint(client: TestClient, db):
    """POST /status solo avanza hitos de entrega: cancelar por ahí esquivaba
    la penalidad de reputación y dejaba el envío muerto (sin reapertura)."""
    carrier_headers, _ = _verified_carrier(client, db, "sneaky@example.com",
                                           plate="SN-001")
    sid = _pending_shipment(client, "sneaky_client@example.com")
    accept = client.post(f"/api/v1/shipments/{sid}/accept", json={},
                         headers=carrier_headers)
    assert accept.status_code == 200, accept.text

    res = client.post(f"/api/v1/shipments/{sid}/status",
                      json={"new_status": "cancelled"}, headers=carrier_headers)
    assert res.status_code == 403, res.text
    assert res.json()["code"] == "CARRIER_STATUS_NOT_ALLOWED"


def test_carrier_cancel_keeps_payment_held(client: TestClient, db):
    """Si el carrier se baja, el envío se reabre y el pago sigue retenido
    (antes se marcaba refunded y el próximo carrier entregaba sin cobrar)."""
    carrier_headers, _ = _verified_carrier(client, db, "bailer@example.com",
                                           plate="BL-001")
    client_headers, _ = _register(client, "paid_client@example.com")
    ship = client.post("/api/v1/shipments", json={
        "package_size": "s", "modality": "collaborative",
        "assignment_mode": "on_demand",
        "origin_lat": -34.6000, "origin_lon": -58.3850,
        "destination_lat": -34.5900, "destination_lon": -58.3950,
        "weight_kg": 2.0,
    }, headers=client_headers).json()
    sid = ship["id"]

    pay = client.post(f"/api/v1/shipments/{sid}/pay", headers=client_headers)
    assert pay.status_code == 200, pay.text

    accept = client.post(f"/api/v1/shipments/{sid}/accept", json={},
                         headers=carrier_headers)
    assert accept.status_code == 200, accept.text

    cancel = client.post(f"/api/v1/shipments/{sid}/carrier-cancel",
                         headers=carrier_headers)
    assert cancel.status_code == 200, cancel.text
    body = cancel.json()
    assert body["status"] == "pending"        # reabierto para matching
    assert body["carrier_id"] is None
    assert body["payment_status"] == "paid"   # el pago sigue retenido, NO refunded

    # El cliente cancela de verdad -> ahí sí se reintegra.
    res = client.post(f"/api/v1/shipments/{sid}/cancel", headers=client_headers)
    assert res.status_code == 200, res.text
    assert res.json()["payment_status"] == "refunded"
