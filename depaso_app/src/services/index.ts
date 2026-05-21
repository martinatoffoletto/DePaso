import { apiClient } from "./api";
import { MatchingResponse, CarrierScoreResponse } from "../types";

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

export interface CO2Response {
  dedicated_emission_kg: number;
  collaborative_emission_kg: number;
  saved_kg: number;
  saved_percent: number;
}

export const co2Service = {
  async calculateEmissions(
    dedicatedKm: number,
    collaborativeIncrementalKm: number,
  ): Promise<CO2Response> {
    const response = await apiClient.post<CO2Response>(`/co2/calculate`, {
      dedicated_km: dedicatedKm,
      collaborative_incremental_km: collaborativeIncrementalKm,
      emission_factor_kg_per_km: 0.2,
    });
    return response.data;
  },
};
