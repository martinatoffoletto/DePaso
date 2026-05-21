import { apiClient } from "./api";

export interface MatchingResponse {
  score: number;
  decision: string;
}

export interface CO2Response {
  dedicated_emission_kg: number;
  collaborative_emission_kg: number;
  saved_kg: number;
  saved_percent: number;
}

export const matchingService = {
  async scoreCarrier(
    carrierId: number,
    shipmentId: number,
  ): Promise<MatchingResponse> {
    const response = await apiClient.post<MatchingResponse>(`/matching/score`, {
      carrier_id: carrierId,
      shipment_id: shipmentId,
    });
    return response.data;
  },
};

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
