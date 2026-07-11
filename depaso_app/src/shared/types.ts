/**
 * Shared TypeScript types for DePaso frontend — mirrors backend Pydantic schemas.
 */

export enum UserType {
  CLIENT = "client",
  CARRIER = "carrier",
  ADMIN = "admin",
}

export enum TransportType {
  PEDESTRIAN = "pedestrian",
  BIKE = "bike",
  MOTORCYCLE = "motorcycle",
  CAR = "car",
  VAN = "van",
  TRUCK = "truck",
}

export enum PackageCategory {
  S = "s",
  M = "m",
  L = "l",
  XL = "xl",
}

export enum DeliveryMode {
  DEDICATED = "dedicated",
  COLLABORATIVE = "collaborative",
}

export enum AssignmentMode {
  ON_DEMAND = "on_demand",
  BY_AVAILABILITY = "by_availability",
}

export enum ShipmentStatus {
  PENDING = "pending",
  ASSIGNED = "assigned",
  PICKUP_ARRIVED = "pickup_arrived",
  IN_TRANSIT = "in_transit",
  DELIVERED = "delivered",
  CANCELLED = "cancelled",
}

export enum PaymentStatus {
  PENDING = "pending",
  PAID = "paid",
  RELEASED = "released",
  REFUNDED = "refunded",
}

export interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string | null;
  user_type: UserType;
  rating: number;
  is_active: boolean;
  created_at?: string;
}

export interface UserSummary {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  user_type: UserType;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string | null;
  token_type: string;
  expires_in: number;
  user: UserSummary;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  phone_number?: string;
  user_type: UserType;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  token: string;
  new_password: string;
}

export interface ChangePasswordPayload {
  current_password: string;
  new_password: string;
}

export interface Carrier {
  id: number;
  user_id: number;
  company_name: string;
  vehicle_type: TransportType;
  license_plate: string | null;
  capacity_kg: number;
  capacity_volume_m3: number | null;
  reputation: number;
  is_active: boolean;
  is_verified: boolean;
  /** Toggle "en línea" (pool on-demand del matching dedicado). */
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

export interface CarrierUpdatePayload {
  company_name?: string;
  vehicle_type?: TransportType;
  license_plate?: string;
  capacity_kg?: number;
  capacity_volume_m3?: number;
  is_available?: boolean;
}

export interface CarrierCreatePayload {
  // user_id NO se manda: /carriers/me lo toma del JWT.
  company_name: string;
  vehicle_type: TransportType;
  license_plate: string | null;
  capacity_kg: number;
  capacity_volume_m3?: number;
}

export interface CarrierSummary {
  carrier_id: number;
  reputation: number;
  deliveries_completed: number;
  active_shipments: number;
  total_earnings: number;
  total_co2_saved_kg: number;
}

export interface Shipment {
  id: number;
  client_id: number;
  carrier_id?: number;
  package_size: PackageCategory;
  status: ShipmentStatus;
  modality: DeliveryMode;
  assignment_mode: AssignmentMode;
  origin_lat: number;
  origin_lon: number;
  destination_lat: number;
  destination_lon: number;
  weight_kg: number;
  photo_url?: string;
  description?: string;
  declared_value?: number | null;
  estimated_price?: number;
  payment_status: PaymentStatus;
  co2_savings_kg?: number;
  recipient_name?: string | null;
  recipient_phone?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AssignedCarrier {
  carrier_id: number;
  name: string;
  phone: string | null;
  rating: number;
  trips: number;
}

export interface PaymentBreakdown {
  shipment_id: number;
  payment_status: PaymentStatus;
  amount: number;
  platform_fee: number;
  carrier_payout: number;
  platform_commission_rate: number;
}

export interface ShipmentCreatePayload {
  package_size: PackageCategory;
  modality: DeliveryMode;
  assignment_mode: AssignmentMode;
  origin_lat: number;
  origin_lon: number;
  destination_lat: number;
  destination_lon: number;
  weight_kg: number;
  photo_url?: string;
  description?: string;
  declared_value?: number;
  recipient_name?: string;
  recipient_phone?: string;
}

export interface Quote {
  distance_km: number;
  price_dedicated: number;
  price_collaborative: number;
  eta_dedicated_min: number;
  eta_collaborative_min: number;
  co2_savings_estimate_kg: number;
}

export interface ShipmentEvent {
  id: number;
  shipment_id: number;
  status: ShipmentStatus;
  lat: number | null;
  lon: number | null;
  notes: string | null;
  created_at: string;
}

export interface Rating {
  id: number;
  shipment_id: number;
  carrier_id: number;
  stars: number;
  comment: string | null;
  created_at: string;
}

export interface FeedItem {
  shipment_id: number;
  modality: DeliveryMode;
  package_size: PackageCategory;
  weight_kg: number;
  origin_lat: number;
  origin_lon: number;
  destination_lat: number;
  destination_lon: number;
  estimated_price: number | null;
  photo_url: string | null;
  description: string | null;
  declared_value: number | null;
  score: number;
  detour_km: number | null;
  detour_ratio: number | null;
  distance_to_pickup_km: number | null;
  route_id: number | null;
  explanation: string[];
}

export interface CarrierRoute {
  id: number;
  carrier_id: number;
  kind: "collaborative_route" | "dedicated_window";
  origin_lat: number;
  origin_lon: number;
  destination_lat: number | null;
  destination_lon: number | null;
  window_start: string;
  window_end: string;
  recurrence_days: string | null;
  is_active: boolean;
}

export interface RouteCreatePayload {
  kind: "collaborative_route" | "dedicated_window";
  origin_lat: number;
  origin_lon: number;
  destination_lat?: number;
  destination_lon?: number;
  window_start: string;
  window_end: string;
  recurrence_days?: string;
}

export interface TrackedPosition {
  shipment_id: number | null;
  lat: number;
  lon: number;
  created_at: string;
}

export interface ClassificationResult {
  classification_id: number;
  category: PackageCategory;
  confidence: number;
  needs_manual: boolean;
  model_loaded: boolean;
  /** URL pública de la foto guardada — se adjunta al envío como photo_url. */
  photo_url?: string | null;
}

/** Comisión de la plataforma (espejo de PLATFORM_COMMISSION_RATE del backend). */
export const PLATFORM_COMMISSION_RATE = 0.15;

export interface Location {
  latitude: number;
  longitude: number;
  address?: string;
}

export interface ImpactEquivalences {
  car_km: number;
  tree_months: number;
  smartphone_charges: number;
}

export interface ClientImpact {
  total_co2_saved_kg: number;
  shipments_delivered: number;
  shipments_collaborative: number;
  equivalences: ImpactEquivalences;
}

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

export type ModerationAction = "verify" | "suspend" | "reactivate";

export interface SystemStatus {
  api: string;
  environment: string;
  debug: boolean;
  database: string;
  vision_model_loaded: boolean;
  vision_model_path: string;
}

export interface ClassificationActivityItem {
  id: number;
  shipment_id?: number | null;
  predicted_category: string;
  confidence: number;
  model_loaded: boolean;
  accepted?: boolean | null;
  manual_category?: string | null;
  created_at: string;
}

export interface ShipmentEventActivityItem {
  id: number;
  shipment_id: number;
  status: string;
  created_at: string;
}

export interface AdminActivity {
  recent_classifications: ClassificationActivityItem[];
  recent_events: ShipmentEventActivityItem[];
}

export interface CarrierRating {
  stars: number;
  comment: string | null;
  created_at: string;
}

export interface MatchingWeights {
  geo: number;
  detour: number;
  cargo: number;
  reputation: number;
  time_window: number;
}

export interface ScoreBreakdown {
  geo: number;
  detour: number;
  cargo: number;
  reputation: number;
  time_window: number;
}

export interface CarrierScoreResponse {
  carrier_id: number;
  company_name: string;
  vehicle_type: TransportType;
  license_plate: string | null;
  total_score: number;
  breakdown: ScoreBreakdown;
  detour_km: number | null;
  detour_ratio: number | null;
  eta_to_pickup_min: number | null;
  route_id: number | null;
  explanation: string[];
}

export interface MatchingResponse {
  shipment_id: number;
  modality: DeliveryMode;
  matched_carrier_id: number;
  total_score: number;
  ranked_carriers: CarrierScoreResponse[];
}
