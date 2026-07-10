import { apiClient } from "./client";
import {
  Carrier,
  CarrierCreatePayload,
  CarrierRating,
  CarrierRoute,
  CarrierSummary,
  FeedItem,
  RouteCreatePayload,
  TrackedPosition,
} from "../types";

export const carriersService = {
  async createProfile(payload: CarrierCreatePayload): Promise<Carrier> {
    // /carriers/me: el user_id sale del JWT, no del body (self-service).
    const response = await apiClient.post<Carrier>("/carriers/me", payload);
    return response.data;
  },

  async getMyProfile(): Promise<Carrier> {
    const response = await apiClient.get<Carrier>("/carriers/me");
    return response.data;
  },

  /** Pending shipments compatible with this carrier (RF-MAT-03). */
  async getFeed(): Promise<FeedItem[]> {
    const response = await apiClient.get<FeedItem[]>("/carriers/me/feed");
    return response.data;
  },

  /** Deliveries, earnings, reputation, CO2 (RF-CAR-06). */
  async getSummary(): Promise<CarrierSummary> {
    const response = await apiClient.get<CarrierSummary>("/carriers/me/summary");
    return response.data;
  },

  /** Reviews received by the current carrier (RF-SHP-08), newest first. */
  async getMyRatings(): Promise<CarrierRating[]> {
    const response = await apiClient.get<CarrierRating[]>("/carriers/me/ratings");
    return response.data;
  },
};

export const routesService = {
  async publish(payload: RouteCreatePayload): Promise<CarrierRoute> {
    const response = await apiClient.post<CarrierRoute>("/routes", payload);
    return response.data;
  },

  async mine(): Promise<CarrierRoute[]> {
    const response = await apiClient.get<CarrierRoute[]>("/routes/mine");
    return response.data;
  },

  async deactivate(routeId: number): Promise<void> {
    await apiClient.delete(`/routes/${routeId}`);
  },
};

export const trackingService = {
  /** Carrier publishes its GPS position every 15-30 s (RF-TRK-01). */
  async publishPosition(lat: number, lon: number): Promise<void> {
    await apiClient.post("/tracking/position", { lat, lon });
  },

  /** Latest carrier position for a shipment — client polls this (RF-TRK-02). */
  async getShipmentLocation(shipmentId: number): Promise<TrackedPosition | null> {
    const response = await apiClient.get<TrackedPosition | null>(`/tracking/${shipmentId}`);
    return response.data;
  },
};
