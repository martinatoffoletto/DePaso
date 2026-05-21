/**
 * Shared TypeScript types for DePaso frontend
 */

export enum UserType {
  CLIENT = "client",
  CARRIER = "carrier",
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
  XS = "xs",
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
  IN_TRANSIT = "in_transit",
  DELIVERED = "delivered",
  CANCELLED = "cancelled",
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
  license_plate: string;
  capacity_kg: number;
  capacity_volume_m3: number | null;
  reputation: number;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
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
  estimated_price?: number;
  co2_savings_kg?: number;
  created_at: string;
  updated_at: string;
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
}

export interface DeliveryOffer {
  id: DeliveryMode;
  title: string;
  subtitle: string;
  price_ars: number;
  eta_minutes: number;
  co2_saved_kg: number;
}

export interface Location {
  latitude: number;
  longitude: number;
  address?: string;
}

export interface CarrierScoreResponse {
  carrier_id: number;
  company_name: string;
  vehicle_type: TransportType;
  license_plate: string;
  total_score: number;
  distance_score: number;
  detour_score: number;
  capacity_score: number;
  reputation_score: number;
  time_window_score: number;
}

export interface MatchingResponse {
  shipment_id: number;
  matched_carrier_id: number;
  total_score: number;
  ranked_carriers: CarrierScoreResponse[];
}
