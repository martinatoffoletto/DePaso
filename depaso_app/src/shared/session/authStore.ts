import { create } from "zustand";
import { User, UserType } from "../types";
import { authService } from "./auth";
import { tokenStorage } from "../api/client";

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    first_name: string;
    last_name: string;
    email: string;
    password: string;
    phone_number?: string;
    user_type: UserType;
  }) => Promise<void>;
  logout: () => Promise<void>;
  restoreToken: () => Promise<void>;
  setUser: (user: User) => void;
  forgotPassword: (email: string) => Promise<string>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: false,
  isAuthenticated: false,

  login: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      const response = await authService.login({ email, password });
      await tokenStorage.save(response.access_token, response.refresh_token);

      // Fetch full user profile after login
      const fullUser = await authService.getCurrentUser();

      set({
        user: fullUser,
        token: response.access_token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  register: async (data) => {
    set({ isLoading: true });
    try {
      const response = await authService.register(data);
      await tokenStorage.save(response.access_token, response.refresh_token);

      // Fetch full user profile after register
      const fullUser = await authService.getCurrentUser();

      set({
        user: fullUser,
        token: response.access_token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    await tokenStorage.clear();
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },

  restoreToken: async () => {
    set({ isLoading: true });
    try {
      const token = await tokenStorage.getAccess();
      if (token) {
        const user = await authService.getCurrentUser();
        set({
          user,
          token,
          isAuthenticated: true,
        });
      }
    } catch {
      // Token inválido o expirado — limpiar y redirigir al login
      await tokenStorage.clear();
      set({ isAuthenticated: false, user: null, token: null });
    } finally {
      set({ isLoading: false });
    }
  },

  setUser: (user: User) => {
    set({ user });
  },

  forgotPassword: async (email: string) => {
    const response = await authService.forgotPassword({ email });
    return response.message;
  },
}));
