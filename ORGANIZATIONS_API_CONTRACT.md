# Organizations API Contract (B2B / pymes)

Contract for the `depaso_web` panel. All paths are prefixed with `/api/v1`.
All endpoints require a **Bearer JWT** (`Authorization: Bearer <access_token>`),
obtained from `POST /api/v1/auth/login`.

The **"org" role is derived from membership**, never carried in the JWT. Any
authenticated user can create an organization and thereby become its owner.
Endpoints under `/organizations/me/...` resolve the caller's active organization
from `organization_members` (most recent membership) and return **403** if the
caller belongs to no organization.

Error envelope for domain errors: `{"detail": "<message>"}` with the HTTP status
below. Validation errors (bad body) return FastAPI's standard **422**.

Organization **kinds**: `fleet` (owns carriers), `merchant` (creates shipments),
`both`. Fleet-only endpoints require `fleet`/`both`; shipment creation requires
`merchant`/`both` — otherwise **403** (`ORG_KIND_FORBIDDEN`).

---

## Organizations

### `POST /organizations`
Create an organization; the caller becomes owner + first member.

Request:
```json
{ "name": "Pyme Demo", "cuit": "30-71234567-8", "kind": "both" }
```
- `cuit`: pattern `^\d{2}-?\d{8}-?\d$` (unique).
- `kind`: `fleet | merchant | both`.

Response `201`:
```json
{
  "id": 1, "name": "Pyme Demo", "cuit": "30-71234567-8", "kind": "both",
  "owner_user_id": 1,
  "created_at": "2026-07-06T18:00:00", "updated_at": "2026-07-06T18:00:00"
}
```
Errors: `400 ORG_ALREADY_EXISTS` (duplicate CUIT).

### `GET /organizations`
Organizations the caller administers, each with the caller's role.

Response `200`:
```json
[
  {
    "id": 1, "name": "Pyme Demo", "cuit": "30-71234567-8", "kind": "both",
    "owner_user_id": 1, "created_at": "...", "updated_at": "...",
    "my_role": "owner"
  }
]
```
`my_role`: `owner | manager`.

### `GET /organizations/me`
The caller's active organization (resolved from membership).
Response `200`: same shape as one item above (`MyOrganizationResponse`).
Errors: `403 NOT_ORG_MEMBER`.

### `PATCH /organizations/{org_id}`
Update name/kind. Caller must be a member of `org_id`.

Request (any subset):
```json
{ "name": "Pyme Demo SA", "kind": "merchant" }
```
Response `200`: `OrganizationResponse`.
Errors: `403` (not a member), `404 ORG_NOT_FOUND`.

---

## Fleet — carriers (kind `fleet`/`both`)

### `GET /organizations/me/carriers`
List the fleet (active **and** inactive links).

Response `200`:
```json
[
  {
    "carrier_id": 5, "company_name": "Fleteros SA", "vehicle_type": "van",
    "license_plate": "AA123BB", "capacity_kg": 500.0, "reputation": 5.0,
    "is_active": true, "is_verified": false,
    "status": "active", "linked_at": "2026-07-06T18:05:00", "unlinked_at": null
  }
]
```
`status`: `active | inactive`.

### `POST /organizations/me/carriers`
Link an existing carrier to the fleet. Re-linking a previously unlinked carrier
reactivates the link (status→active, `unlinked_at`→null).

Request:
```json
{ "carrier_id": 5 }
```
Response `201`: one `OrgCarrierResponse` (as above).
Errors: `400 CARRIER_NOT_LINKABLE` (carrier not found), `403 ORG_KIND_FORBIDDEN`.

### `DELETE /organizations/me/carriers/{carrier_id}`
Unlink a carrier. **Never deletes the user/carrier** — sets `status=inactive`
and stamps `unlinked_at`.

Response `200`: the updated `OrgCarrierResponse` (`status: "inactive"`).
Errors: `400 CARRIER_NOT_LINKABLE` (not linked), `403 ORG_KIND_FORBIDDEN`.

---

## Merchant — shipments (kind `merchant`/`both`)

### `POST /organizations/me/shipments`
Create a shipment on behalf of the org. Reuses shipment pricing/state; the
shipment is stamped with `organization_id`. The client_id is the caller.

Request:
```json
{
  "package_size": "m", "modality": "dedicated", "assignment_mode": "on_demand",
  "origin_lat": -34.60, "origin_lon": -58.38,
  "destination_lat": -34.62, "destination_lon": -58.40,
  "weight_kg": 10, "photo_url": null, "description": null
}
```
- `package_size`: `s | m | l | xl`.
- `modality`: `dedicated | collaborative`.
- `assignment_mode`: `on_demand | by_availability`.

Response `201`:
```json
{
  "id": 12, "organization_id": 1, "client_id": 1, "carrier_id": null,
  "package_size": "m", "status": "pending",
  "modality": "dedicated", "assignment_mode": "on_demand",
  "origin_lat": -34.60, "origin_lon": -58.38,
  "destination_lat": -34.62, "destination_lon": -58.40,
  "weight_kg": 10.0, "estimated_price": 2500.0, "co2_savings_kg": null,
  "created_at": "...", "updated_at": "..."
}
```
Errors: `403 ORG_KIND_FORBIDDEN`.

### `GET /organizations/me/shipments`
List shipments created by the org.

Query: `status` (optional, e.g. `pending`), `skip` (default 0), `limit` (default 50).
Response `200`: list of `OrgShipmentResponse` (as above), newest first.

---

## Monitoring & finance

### `GET /organizations/me/dashboard`
KPIs for the pyme panel.

Response `200`:
```json
{
  "organization_id": 1, "kind": "both",
  "fleet_size": 1,
  "shipments_total": 2, "shipments_active": 0,
  "shipments_pending": 1, "shipments_delivered": 1,
  "total_spent": 4000.0, "total_earned": 1500.0,
  "total_co2_saved_kg": 0.8
}
```
- `total_spent`: sum of `estimated_price` over the org's shipments.
- `total_earned`: sum of `estimated_price` over **delivered** shipments handled
  by carriers currently active in the fleet.
- `fleet_size`: active linked carriers.

### `GET /organizations/me/finance`
Money put in (spent on shipments) vs earned (by the fleet), per calendar month
plus accumulated total. Spent is keyed by shipment creation month; earned by
delivery month.

Response `200`:
```json
{
  "organization_id": 1, "currency": "ARS",
  "spent":  { "total": 4000.0, "by_month": [ { "month": "2026-07", "amount": 4000.0 } ] },
  "earned": { "total": 1500.0, "by_month": [ { "month": "2026-07", "amount": 1500.0 } ] }
}
```

---

# Admin / System (existing endpoints for the ops panel)

Admin endpoints require a user with `user_type == "admin"`; otherwise **403**
(`Admin access required`). Prefix `/api/v1`.

### `GET /admin/dashboard`
Global operational aggregates.
```json
{
  "total_users": 42, "total_carriers": 10, "carriers_pending_verification": 3,
  "shipments_total": 120, "shipments_active": 8, "shipments_delivered": 95,
  "shipments_pending": 12, "total_co2_saved_kg": 87.42,
  "matching_success_rate": 0.9048
}
```

### `GET /admin/carriers/pending`
Carriers awaiting verification. Response `200`: list of `CarrierResponse`.

### `PATCH /admin/carriers/{carrier_id}`
Moderate a carrier. Request: `{ "action": "verify" }` where `action` is
`verify | suspend | reactivate`. Response `200`: `CarrierResponse`.
Errors: `404` (carrier not found), `422` (invalid action).

### `GET /admin/status`
Platform health for the monitoring panel.
```json
{
  "api": "ok", "environment": "production", "debug": false, "database": "ok",
  "vision_model_loaded": false,
  "vision_model_path": "./ml/models/cargo_classifier_v1.keras"
}
```
`vision_model_loaded: false` means the classifier is running the **stub
fallback** (no trained model / TensorFlow available).

### `GET /admin/activity`
Latest classifications and shipment status changes. Query `limit` (1–100, default 20).
```json
{
  "recent_classifications": [
    { "id": 9, "shipment_id": 12, "user_id": 1, "predicted_category": "m",
      "confidence": 0.83, "model_loaded": true, "accepted": true,
      "manual_category": null, "created_at": "..." }
  ],
  "recent_events": [
    { "id": 55, "shipment_id": 12, "status": "delivered",
      "actor_user_id": 5, "created_at": "..." }
  ]
}
```

### `GET /matching/weights` · `PATCH /matching/weights` (admin)
Scoring weights (DB-backed, code defaults as fallback).
`GET` → `{ "geo": 0.35, "detour": 0.30, "cargo": 0.15, "reputation": 0.10, "time_window": 0.10 }`.
`PATCH` accepts any subset of the same keys (each `0.0–1.0`); the **merged set must
sum to 1.0** or it returns `422`. Response: full `WeightsResponse`.

### `GET /api/v1/health` (public)
`{ "status": "healthy", "service": "depaso-rest-api", "version": "0.1.0" }`.
