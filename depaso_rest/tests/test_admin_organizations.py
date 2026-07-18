"""Admin manual B2B account creation (POST /admin/organizations)."""
from fastapi.testclient import TestClient


def _make_admin(db) -> dict:
    from src.app.core.security import create_access_token
    from src.app.modules.users.models import User

    admin = db.query(User).filter(User.email == "admin_altas@example.com").first()
    if admin is None:
        admin = User(
            email="admin_altas@example.com", password_hash="fake",
            first_name="Admin", last_name="Admin", user_type="admin", is_active=True,
        )
        db.add(admin)
        db.commit()
        db.refresh(admin)
    token = create_access_token(data={"sub": str(admin.id)})
    return {"Authorization": f"Bearer {token}"}


def test_admin_creates_merchant_account_and_owner_can_login(client: TestClient, db):
    admin_headers = _make_admin(db)

    res = client.post(
        "/api/v1/admin/organizations",
        json={
            "name": "Almacen Test SRL",
            "cuit": "30-71234567-8",
            "email": "altas_merchant@example.com",
            "password": "Password123!",
            "kind": "merchant",
        },
        headers=admin_headers,
    )
    assert res.status_code == 201, res.text
    body = res.json()
    assert body["kind"] == "merchant"
    assert body["owner_email"] == "altas_merchant@example.com"

    login = client.post("/api/v1/auth/login", json={
        "email": "altas_merchant@example.com", "password": "Password123!",
    })
    assert login.status_code == 200, login.text
    headers = {"Authorization": f"Bearer {login.json()['access_token']}"}

    me = client.get("/api/v1/organizations/me", headers=headers)
    assert me.status_code == 200, me.text
    assert me.json()["kind"] == "merchant"
    assert me.json()["my_role"] == "owner"


def test_admin_organizations_requires_admin(client: TestClient):
    res = client.post("/api/v1/auth/register", json={
        "email": "not_admin@example.com", "password": "Password123!",
        "first_name": "Test", "last_name": "User", "user_type": "client",
    })
    headers = {"Authorization": f"Bearer {res.json()['access_token']}"}

    res2 = client.post(
        "/api/v1/admin/organizations",
        json={
            "name": "X", "cuit": "30-71234567-8",
            "email": "x@example.com", "password": "Password123!", "kind": "merchant",
        },
        headers=headers,
    )
    assert res2.status_code == 403


def test_admin_organizations_duplicate_cuit_conflicts(client: TestClient, db):
    admin_headers = _make_admin(db)
    payload = {
        "name": "Dup SRL", "cuit": "30-99999999-1",
        "email": "dup1@example.com", "password": "Password123!", "kind": "fleet",
    }
    res1 = client.post("/api/v1/admin/organizations", json=payload, headers=admin_headers)
    assert res1.status_code == 201, res1.text

    payload["email"] = "dup2@example.com"
    res2 = client.post("/api/v1/admin/organizations", json=payload, headers=admin_headers)
    assert res2.status_code == 409, res2.text
