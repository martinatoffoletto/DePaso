"""
Integration tests para el módulo B2B (organizations).

El módulo no tenía cobertura; dos bugs pasaron por eso:
  - create_shipment sin await (POST /me/shipments crasheaba en runtime)
  - update_organization con get_membership sin await (IDOR: cualquiera editaba
    cualquier organización)
"""
from fastapi.testclient import TestClient


def _register(client: TestClient, email: str) -> dict:
    res = client.post("/api/v1/auth/register", json={
        "email": email, "password": "Password123!",
        "first_name": "Org", "last_name": "Admin",
    })
    assert res.status_code == 201, res.text
    return {"Authorization": f"Bearer {res.json()['access_token']}"}


def _make_org(client, headers, cuit, kind="merchant", name="ACME"):
    return client.post("/api/v1/organizations",
                       json={"name": name, "cuit": cuit, "kind": kind}, headers=headers)


SHIP = {
    "package_size": "m", "modality": "collaborative", "assignment_mode": "on_demand",
    "origin_lat": -34.60, "origin_lon": -58.38,
    "destination_lat": -34.59, "destination_lon": -58.39,
    "weight_kg": 5.0,
}


def test_create_org_makes_caller_owner(client: TestClient, db):
    h = _register(client, "owner@example.com")
    res = _make_org(client, h, "30-71234567-8")
    assert res.status_code == 201, res.text
    me = client.get("/api/v1/organizations/me", headers=h)
    assert me.status_code == 200
    assert me.json()["my_role"] == "owner"


def test_merchant_can_create_shipment(client: TestClient, db):
    """El bug del await faltante rompía este flujo (lo usa el panel web)."""
    h = _register(client, "merchant@example.com")
    _make_org(client, h, "30-71234567-8", kind="merchant")
    res = client.post("/api/v1/organizations/me/shipments", json=SHIP, headers=h)
    assert res.status_code == 201, res.text
    listed = client.get("/api/v1/organizations/me/shipments", headers=h)
    assert listed.status_code == 200
    assert len(listed.json()) == 1


def test_fleet_org_cannot_create_shipments(client: TestClient, db):
    h = _register(client, "fleet@example.com")
    _make_org(client, h, "30-71234567-8", kind="fleet")
    res = client.post("/api/v1/organizations/me/shipments", json=SHIP, headers=h)
    assert res.status_code == 403


def test_merchant_org_cannot_manage_fleet(client: TestClient, db):
    h = _register(client, "merch2@example.com")
    _make_org(client, h, "30-71234567-8", kind="merchant")
    res = client.post("/api/v1/organizations/me/carriers",
                      json={"carrier_id": 1}, headers=h)
    assert res.status_code == 403


def test_non_member_cannot_access_org_panel(client: TestClient, db):
    """Un usuario sin organización recibe 403 en los endpoints /me."""
    h = _register(client, "loner@example.com")
    assert client.get("/api/v1/organizations/me", headers=h).status_code == 403
    assert client.get("/api/v1/organizations/me/dashboard", headers=h).status_code == 403
    assert client.patch("/api/v1/organizations/me",
                        json={"name": "Hacked"}, headers=h).status_code == 403


def test_cannot_edit_another_orgs_data(client: TestClient, db):
    """IDOR: el usuario B no puede editar la organización del usuario A."""
    ha = _register(client, "a_owner@example.com")
    _make_org(client, ha, "30-71111111-1", name="Empresa A")
    hb = _register(client, "b_owner@example.com")
    _make_org(client, hb, "30-72222222-2", name="Empresa B")

    # B edita su propia org -> ok, y NUNCA afecta a la de A
    res = client.patch("/api/v1/organizations/me", json={"name": "Empresa B v2"}, headers=hb)
    assert res.status_code == 200
    assert res.json()["name"] == "Empresa B v2"

    a_now = client.get("/api/v1/organizations/me", headers=ha)
    assert a_now.json()["name"] == "Empresa A"  # intacta


def test_duplicate_cuit_conflicts(client: TestClient, db):
    ha = _register(client, "dup_a@example.com")
    assert _make_org(client, ha, "30-73333333-3").status_code == 201
    hb = _register(client, "dup_b@example.com")
    assert _make_org(client, hb, "30-73333333-3").status_code == 409
