import { apiClient } from "./api";
import {
  AdminDashboard,
  Carrier,
  MatchingWeights,
  ModerationAction,
} from "../types";

export const adminService = {
  /** Operational aggregates for the monitoring panel (RF-ADM-01/02). */
  async getDashboard(): Promise<AdminDashboard> {
    const response = await apiClient.get<AdminDashboard>("/admin/dashboard");
    return response.data;
  },

  /** Carriers awaiting verification (RF-USR-07). */
  async getPendingCarriers(): Promise<Carrier[]> {
    const response = await apiClient.get<Carrier[]>("/admin/carriers/pending");
    return response.data;
  },

  /** Verify, suspend or reactivate a carrier (RF-ADM-03). */
  async moderateCarrier(
    carrierId: number,
    action: ModerationAction,
  ): Promise<Carrier> {
    const response = await apiClient.patch<Carrier>(
      `/admin/carriers/${carrierId}`,
      { action },
    );
    return response.data;
  },

  /** Current matching scoring weights (admin-tunable, spec 5.2). */
  async getMatchingWeights(): Promise<MatchingWeights> {
    const response = await apiClient.get<MatchingWeights>("/matching/weights");
    return response.data;
  },

  /** Update scoring weights without redeploy; the set must sum to 1. */
  async updateMatchingWeights(
    weights: Partial<MatchingWeights>,
  ): Promise<MatchingWeights> {
    const response = await apiClient.patch<MatchingWeights>(
      "/matching/weights",
      weights,
    );
    return response.data;
  },
};
