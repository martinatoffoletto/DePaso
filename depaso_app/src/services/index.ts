import { apiClient } from "./api";
import { ClientImpact, MatchingResponse, CarrierScoreResponse } from "../types";

export const matchingService = {
  async matchBest(shipmentId: number): Promise<MatchingResponse> {
    const response = await apiClient.post<MatchingResponse>(
      `/matching/${shipmentId}/match`,
    );
    return response.data;
  },

  async rankCarriers(
    shipmentId: number,
    topK: number = 5,
  ): Promise<CarrierScoreResponse[]> {
    const response = await apiClient.get<CarrierScoreResponse[]>(
      `/matching/${shipmentId}/ranked?top_k=${topK}`,
    );
    return response.data;
  },
};

export const co2Service = {
  /** Accumulated CO2 savings of the authenticated client + equivalences (RF-CO2-02). */
  async getMyImpact(): Promise<ClientImpact> {
    const response = await apiClient.get<ClientImpact>(`/co2/me/summary`);
    return response.data;
  },
};
