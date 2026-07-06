/*
  Tipos espejo del backend FastAPI (depaso_rest). No inventar shapes:
  cada tipo corresponde a un schema Pydantic real en los modules/<nombre>/schemas.py.
*/

export type UserType = "client" | "carrier" | "admin";

// auth/schemas.py :: UserSummary
export interface UserSummary {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  user_type: UserType;
}

// auth/schemas.py :: TokenResponse
export interface TokenResponse {
  access_token: string;
  refresh_token: string | null;
  token_type: string;
  expires_in: number;
  user: UserSummary;
}

// auth/schemas.py :: CurrentUserResponse
export interface CurrentUser {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string | null;
  user_type: UserType;
  rating: number;
  is_active: boolean;
}

// admin/schemas.py :: DashboardResponse
export interface AdminDashboard {
  total_users: number;
  total_carriers: number;
  carriers_pending_verification: number;
  shipments_total: number;
  shipments_active: number;
  shipments_delivered: number;
  shipments_pending: number;
  total_co2_saved_kg: number;
  matching_success_rate: number;
}

// carriers/schemas.py :: CarrierResponse
export interface Carrier {
  id: number;
  user_id: number;
  company_name: string;
  vehicle_type: string;
  license_plate: string;
  capacity_kg: number;
  capacity_volume_m3: number | null;
  reputation: number;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export type ModerationAction = "verify" | "suspend" | "reactivate";

// matching/schemas.py :: WeightsResponse (suman 1)
export interface MatchingWeights {
  geo: number;
  detour: number;
  cargo: number;
  reputation: number;
  time_window: number;
}

export type WeightKey = keyof MatchingWeights;

// shipments/enums.py :: ShipmentStatus
export type ShipmentStatus =
  | "pending"
  | "assigned"
  | "pickup_arrived"
  | "in_transit"
  | "delivered"
  | "cancelled";

// shipments/schemas.py :: ShipmentResponse
export interface Shipment {
  id: number;
  client_id: number;
  carrier_id: number | null;
  package_size: "s" | "m" | "l" | "xl";
  modality: "dedicated" | "collaborative";
  assignment_mode: "on_demand" | "by_availability";
  origin_lat: number;
  origin_lon: number;
  destination_lat: number;
  destination_lon: number;
  weight_kg: number;
  photo_url: string | null;
  description: string | null;
  status: ShipmentStatus;
  estimated_price: number | null;
  co2_savings_kg: number | null;
  created_at: string;
  updated_at: string;
}

// main.py :: /health  (+ campos opcionales que rm puede agregar)
export interface HealthResponse {
  status: string;
  service: string;
  version: string;
  vision_model_loaded?: boolean;
  database?: string;
}

/* ---------------------------------------------------------------------------
   Organizations (pymes B2B) — espejo de organizations/schemas.py
--------------------------------------------------------------------------- */

export type OrgKind = "fleet" | "merchant" | "both";
export type OrgRole = "owner" | "manager";

// organizations/schemas.py :: OrganizationResponse / MyOrganizationResponse
export interface Organization {
  id: number;
  name: string;
  cuit: string;
  kind: OrgKind;
  owner_user_id: number;
  created_at: string;
  updated_at: string;
}

export interface MyOrganization extends Organization {
  my_role: OrgRole;
}

// organizations/schemas.py :: OrganizationCreate
export interface OrganizationCreate {
  name: string;
  cuit: string;
  kind: OrgKind;
}

export type OrgCarrierStatus = "active" | "inactive";

// organizations/schemas.py :: OrgCarrierResponse
export interface OrgCarrier {
  carrier_id: number;
  company_name: string;
  vehicle_type: string;
  license_plate: string;
  capacity_kg: number;
  reputation: number;
  is_active: boolean;
  is_verified: boolean;
  status: OrgCarrierStatus;
  linked_at: string | null;
  unlinked_at: string | null;
}

// organizations/schemas.py :: OrgShipmentResponse
export interface OrgShipment {
  id: number;
  organization_id: number | null;
  client_id: number;
  carrier_id: number | null;
  package_size: "s" | "m" | "l" | "xl";
  status: ShipmentStatus;
  modality: "dedicated" | "collaborative";
  assignment_mode: "on_demand" | "by_availability";
  origin_lat: number;
  origin_lon: number;
  destination_lat: number;
  destination_lon: number;
  weight_kg: number;
  estimated_price: number | null;
  co2_savings_kg: number | null;
  created_at: string;
  updated_at: string;
}

// organizations/schemas.py :: OrgShipmentCreate
export interface OrgShipmentCreate {
  package_size: "s" | "m" | "l" | "xl";
  modality: "dedicated" | "collaborative";
  assignment_mode: "on_demand" | "by_availability";
  origin_lat: number;
  origin_lon: number;
  destination_lat: number;
  destination_lon: number;
  weight_kg: number;
  photo_url?: string | null;
  description?: string | null;
}

// organizations/schemas.py :: OrgDashboardResponse
export interface OrgDashboard {
  organization_id: number;
  kind: OrgKind;
  fleet_size: number;
  shipments_total: number;
  shipments_active: number;
  shipments_pending: number;
  shipments_delivered: number;
  total_spent: number;
  total_earned: number;
  total_co2_saved_kg: number;
}

// organizations/schemas.py :: MonthlyAmount / FinanceSeries / OrgFinanceResponse
export interface MonthlyAmount {
  month: string; // "YYYY-MM"
  amount: number;
}

export interface FinanceSeries {
  total: number;
  by_month: MonthlyAmount[];
}

export interface OrgFinance {
  organization_id: number;
  currency: string;
  spent: FinanceSeries;
  earned: FinanceSeries;
}
