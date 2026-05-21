import { apiClient } from "./api";
import { Shipment, ShipmentCreatePayload, ShipmentStatus } from "../types";

export const shipmentsService = {
  async createShipment(payload: ShipmentCreatePayload): Promise<Shipment> {
    const response = await apiClient.post<Shipment>("/shipments", payload);
    return response.data;
  },

  async getMyShipments(skip: number = 0, limit: number = 20): Promise<Shipment[]> {
    const response = await apiClient.get<Shipment[]>(`/shipments?skip=${skip}&limit=${limit}`);
    return response.data;
  },

  async getAvailableShipments(): Promise<Shipment[]> {
    const response = await apiClient.get<Shipment[]>("/shipments/available");
    return response.data;
  },

  async getShipment(id: number): Promise<Shipment> {
    const response = await apiClient.get<Shipment>(`/shipments/${id}`);
    return response.data;
  },

  async updateStatus(id: number, status: ShipmentStatus): Promise<Shipment> {
    const response = await apiClient.patch<Shipment>(`/shipments/${id}/status?new_status=${status}`);
    return response.data;
  },

  async assignCarrier(shipmentId: number, carrierId: number): Promise<Shipment> {
    const response = await apiClient.patch<Shipment>(`/shipments/${shipmentId}/assign?carrier_id=${carrierId}`);
    return response.data;
  }
};
