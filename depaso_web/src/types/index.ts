/*
  Tipos espejo del backend FastAPI (depaso_rest). No inventar shapes:
  cada tipo corresponde a un schema Pydantic real en depaso_rest/src/app/modules/*/schemas.py.
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
