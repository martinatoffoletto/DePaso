import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import { User, UserType } from "../types";
import { authService } from "../services/auth";

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
      await SecureStore.setItemAsync("auth_token", response.access_token);

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
      await SecureStore.setItemAsync("auth_token", response.access_token);

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
    await SecureStore.deleteItemAsync("auth_token");
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
      const token = await SecureStore.getItemAsync("auth_token");
      if (token) {
        const user = await authService.getCurrentUser();
        set({
          user,
          token,
          isAuthenticated: true,
        });
      }
    } catch (error) {
      console.error("Restore token error:", error);
      await SecureStore.deleteItemAsync("auth_token");
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
