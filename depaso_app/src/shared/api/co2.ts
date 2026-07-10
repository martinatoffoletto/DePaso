import { apiClient } from "./client";
import { ClientImpact } from "../types";

export const co2Service = {
  /** Accumulated CO2 savings of the authenticated client + equivalences (RF-CO2-02). */
  async getMyImpact(): Promise<ClientImpact> {
    const response = await apiClient.get<ClientImpact>(`/co2/me/summary`);
    return response.data;
  },
};
