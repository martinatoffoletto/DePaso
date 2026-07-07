import { apiClient } from "./api";
import {
  AuthResponse,
  LoginPayload,
  RegisterPayload,
  ForgotPasswordPayload,
  ResetPasswordPayload,
  ChangePasswordPayload,
  User,
} from "../types";

export const authService = {
  async login(payload: LoginPayload): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>("/auth/login", payload);
    return response.data;
  },

  async register(payload: RegisterPayload): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>(
      "/auth/register",
      payload,
    );
    return response.data;
  },

  async getCurrentUser(): Promise<User> {
    const response = await apiClient.get<User>("/auth/me");
    return response.data;
  },

  async forgotPassword(
    payload: ForgotPasswordPayload,
  ): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>(
      "/auth/forgot-password",
      payload,
    );
    return response.data;
  },

  async resetPassword(
    payload: ResetPasswordPayload,
  ): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>(
      "/auth/reset-password",
      payload,
    );
    return response.data;
  },

  async changePassword(
    payload: ChangePasswordPayload,
  ): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>(
      "/auth/change-password",
      payload,
    );
    return response.data;
  },

  /** Update the current user's profile (name / phone). */
  async updateProfile(
    payload: { first_name?: string; last_name?: string; phone_number?: string },
  ): Promise<User> {
    const response = await apiClient.patch<User>("/users/me", payload);
    return response.data;
  },

  async logout(): Promise<void> {
    // JWT is stateless — just clear the token client-side
    // No server-side endpoint needed
  },
};
