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


def test_org_kind_both_removed(client: TestClient, db):
    """El tipo 'both' se eliminó: una organización es flota O comercio."""
    h = _register(client, "bothkind@example.com")
    res = _make_org(client, h, "30-71234567-8", kind="both")
    assert res.status_code == 422, res.text


def test_cancelled_shipments_not_counted_as_spent(client: TestClient, db):
    """Un envío cancelado se reintegra: no es 'dinero puesto' (dashboard y finanzas)."""
    h = _register(client, "spender@example.com")
    _make_org(client, h, "30-71234567-8", kind="merchant")

    kept = client.post("/api/v1/organizations/me/shipments", json=SHIP, headers=h)
    assert kept.status_code == 201, kept.text
    cancelled = client.post("/api/v1/organizations/me/shipments", json=SHIP, headers=h)
    assert cancelled.status_code == 201, cancelled.text
    res = client.post(f"/api/v1/shipments/{cancelled.json()['id']}/cancel", headers=h)
    assert res.status_code == 200, res.text

    dash = client.get("/api/v1/organizations/me/dashboard", headers=h).json()
    assert dash["shipments_total"] == 2
    assert dash["total_spent"] == kept.json()["estimated_price"]

    fin = client.get("/api/v1/organizations/me/finance", headers=h).json()
    assert fin["spent"]["total"] == kept.json()["estimated_price"]


def test_org_shipment_carries_recipient_contact(client: TestClient, db):
    """El carrier necesita a quién llamar en destino: la pyme puede cargarlo."""
    h = _register(client, "recipient_org@example.com")
    _make_org(client, h, "30-71234567-8", kind="merchant")
    res = client.post("/api/v1/organizations/me/shipments", json={
        **SHIP, "recipient_name": "Depósito Central", "recipient_phone": "11-4444-5555",
    }, headers=h)
    assert res.status_code == 201, res.text
    sid = res.json()["id"]
    detail = client.get(f"/api/v1/shipments/{sid}", headers=h).json()
    assert detail["recipient_name"] == "Depósito Central"
    assert detail["recipient_phone"] == "11-4444-5555"


def test_no_org_membership_uses_error_envelope(client: TestClient, db):
    """El 403 'sin organización' sale por el handler global con code (el
    front lo usa para mostrar el onboarding de crear organización)."""
    h = _register(client, "orgless@example.com")
    res = client.get("/api/v1/organizations/me", headers=h)
    assert res.status_code == 403, res.text
    body = res.json()
    assert body["code"] == "NOT_ORG_MEMBER"
