"""
End-to-end smoke test over the live dev DB (run scripts.seed_demo first).

Exercises the full lifecycle: login -> feed -> accept -> milestones ->
deliver -> rate -> CO2 + tracking + admin dashboard.

Run:  DATABASE_URL="sqlite:///./depaso_dev.db" python -m scripts.smoke_test
"""
from fastapi.testclient import TestClient

from src.app.main import app

client = TestClient(app)
API = "/api/v1"


def login(email: str, password: str) -> dict:
    r = client.post(f"{API}/auth/login", json={"email": email, "password": password})
    assert r.status_code == 200, f"login {email}: {r.text}"
    data = r.json()
    return {"Authorization": f"Bearer {data['access_token']}"}


def main() -> None:
    juan = login("cliente@depaso.com", "cliente1234")
    lucia = login("lucia@depaso.com", "lucia1234")
    admin = login("admin@depaso.com", "admin1234")

    # quote
    r = client.post(f"{API}/shipments/quote", json={
        "origin_lat": -34.6103, "origin_lon": -58.4209,
        "destination_lat": -34.6092, "destination_lon": -58.4017,
        "package_size": "s",
    })
    assert r.status_code == 200, r.text
    print(f"✓ quote: dedicado ${r.json()['price_dedicated']:.0f} / "
          f"colaborativo ${r.json()['price_collaborative']:.0f}")

    # carrier feed shows the seeded collaborative shipment
    r = client.get(f"{API}/carriers/me/feed", headers=lucia)
    assert r.status_code == 200, r.text
    feed = r.json()
    assert feed, "feed should not be empty"
    item = next(i for i in feed if i["modality"] == "collaborative")
    print(f"✓ feed: {len(feed)} pedidos, colaborativo #{item['shipment_id']} "
          f"desvío {item['detour_km']} km ({item['detour_ratio']:.0%})")

    # accept with the matched route -> CO2 persisted
    r = client.post(f"{API}/shipments/{item['shipment_id']}/accept",
                    json={"route_id": item["route_id"]}, headers=lucia)
    assert r.status_code == 200, r.text
    assert r.json()["status"] == "assigned"
    print(f"✓ accept: CO2 ahorrado {r.json()['co2_savings_kg']} kg")

    sid = item["shipment_id"]

    # carrier publishes GPS -> client can track
    r = client.post(f"{API}/tracking/position",
                    json={"lat": -34.615, "lon": -58.43}, headers=lucia)
    assert r.status_code == 202, r.text
    r = client.get(f"{API}/tracking/{sid}", headers=juan)
    assert r.status_code == 200 and r.json() is not None, r.text
    print(f"✓ tracking: posición {r.json()['lat']}, {r.json()['lon']}")

    # milestones
    for st in ("pickup_arrived", "in_transit", "delivered"):
        r = client.post(f"{API}/shipments/{sid}/status",
                        json={"new_status": st}, headers=lucia)
        assert r.status_code == 200, f"{st}: {r.text}"
    print("✓ estados: assigned → pickup_arrived → in_transit → delivered")

    # invalid transition rejected
    r = client.post(f"{API}/shipments/{sid}/status",
                    json={"new_status": "in_transit"}, headers=lucia)
    assert r.status_code == 400
    print("✓ transición inválida rechazada (delivered → in_transit)")

    # rating updates carrier reputation
    r = client.post(f"{API}/shipments/{sid}/rating",
                    json={"stars": 5, "comment": "Excelente"}, headers=juan)
    assert r.status_code == 201, r.text
    print("✓ rating: 5 estrellas registradas")

    # events audit trail
    r = client.get(f"{API}/shipments/{sid}/events", headers=juan)
    statuses = [e["status"] for e in r.json()]
    assert statuses == ["pending", "assigned", "pickup_arrived", "in_transit", "delivered"]
    print(f"✓ auditoría: {' → '.join(statuses)}")

    # carrier summary
    r = client.get(f"{API}/carriers/me/summary", headers=lucia)
    s = r.json()
    print(f"✓ resumen carrier: {s['deliveries_completed']} entregas, "
          f"${s['total_earnings']:.0f}, {s['total_co2_saved_kg']} kg CO2")

    # admin dashboard
    r = client.get(f"{API}/admin/dashboard", headers=admin)
    assert r.status_code == 200, r.text
    d = r.json()
    print(f"✓ admin: {d['shipments_total']} envíos, {d['total_co2_saved_kg']} kg CO2, "
          f"tasa éxito {d['matching_success_rate']:.0%}")

    print("\nSMOKE TEST OK — ciclo completo funcionando.")


if __name__ == "__main__":
    main()
