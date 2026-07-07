import { apiClient } from "./api";
import {
  PaymentBreakdown,
  Quote,
  Rating,
  Shipment,
  ShipmentCreatePayload,
  ShipmentEvent,
  ShipmentStatus,
} from "../types";

export const shipmentsService = {
  async getQuote(params: {
    origin_lat: number;
    origin_lon: number;
    destination_lat: number;
    destination_lon: number;
    package_size: string;
  }): Promise<Quote> {
    const response = await apiClient.post<Quote>("/shipments/quote", params);
    return response.data;
  },

  async createShipment(payload: ShipmentCreatePayload): Promise<Shipment> {
    const response = await apiClient.post<Shipment>("/shipments", payload);
    return response.data;
  },

  async getMyShipments(skip = 0, limit = 50): Promise<Shipment[]> {
    const response = await apiClient.get<Shipment[]>(`/shipments?skip=${skip}&limit=${limit}`);
    return response.data;
  },

  async getAssignedShipments(skip = 0, limit = 50): Promise<Shipment[]> {
    const response = await apiClient.get<Shipment[]>(`/shipments/assigned?skip=${skip}&limit=${limit}`);
    return response.data;
  },

  async getShipment(id: number): Promise<Shipment> {
    const response = await apiClient.get<Shipment>(`/shipments/${id}`);
    return response.data;
  },

  async getEvents(id: number): Promise<ShipmentEvent[]> {
    const response = await apiClient.get<ShipmentEvent[]>(`/shipments/${id}/events`);
    return response.data;
  },

  async updateStatus(
    id: number,
    status: ShipmentStatus,
    coords?: { lat: number; lon: number },
  ): Promise<Shipment> {
    const response = await apiClient.post<Shipment>(`/shipments/${id}/status`, {
      new_status: status,
      ...coords,
    });
    return response.data;
  },

  /** Pay for a shipment (simulated pasarela). Returns the commission breakdown. */
  async paySimulated(id: number): Promise<PaymentBreakdown> {
    const response = await apiClient.post<PaymentBreakdown>(`/shipments/${id}/pay`);
    return response.data;
  },

  async cancelShipment(id: number): Promise<Shipment> {
    const response = await apiClient.post<Shipment>(`/shipments/${id}/cancel`);
    return response.data;
  },

  async acceptShipment(id: number, routeId?: number | null): Promise<Shipment> {
    const response = await apiClient.post<Shipment>(`/shipments/${id}/accept`, {
      route_id: routeId ?? null,
    });
    return response.data;
  },

  async carrierCancel(id: number): Promise<Shipment> {
    const response = await apiClient.post<Shipment>(`/shipments/${id}/carrier-cancel`);
    return response.data;
  },

  async rateShipment(id: number, stars: number, comment?: string): Promise<Rating> {
    const response = await apiClient.post<Rating>(`/shipments/${id}/rating`, {
      stars,
      comment,
    });
    return response.data;
  },
};
