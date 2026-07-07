import axios, { AxiosError, AxiosInstance } from "axios";
import * as SecureStore from "expo-secure-store";
import Constants from "expo-constants";
import { useConnectionStore } from "../stores/connectionStore";

const debuggerHost = Constants.expoConfig?.hostUri;
const localIp = debuggerHost ? debuggerHost.split(":")[0] : "localhost";

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || `http://${localIp}:8000/api/v1`;

const TOKEN_KEY = "auth_token";
const REFRESH_KEY = "refresh_token";

export const tokenStorage = {
  getAccess: () => SecureStore.getItemAsync(TOKEN_KEY),
  getRefresh: () => SecureStore.getItemAsync(REFRESH_KEY),
  async save(access: string, refresh: string | null) {
    await SecureStore.setItemAsync(TOKEN_KEY, access);
    if (refresh) await SecureStore.setItemAsync(REFRESH_KEY, refresh);
  },
  async clear() {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_KEY);
  },
};

// Single in-flight refresh shared by concurrent 401s
let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refresh = await tokenStorage.getRefresh();
  if (!refresh) return null;
  try {
    // plain axios: must not go through the interceptors
    const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, {
      refresh_token: refresh,
    });
    await tokenStorage.save(data.access_token, data.refresh_token);
    return data.access_token as string;
  } catch {
    await tokenStorage.clear();
    return null;
  }
}

class ApiClient {
  private instance: AxiosInstance;

  constructor() {
    this.instance = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
    });

    this.instance.interceptors.request.use(async (config) => {
      const token = await tokenStorage.getAccess();
      if (token) config.headers.Authorization = `Bearer ${token}`;
      return config;
    });

    this.instance.interceptors.response.use(
      (response) => {
        useConnectionStore.getState().setOnline(true);
        return response;
      },
      async (error: AxiosError) => {
        // No HTTP response = network/connectivity failure -> mark offline.
        if (!error.response) useConnectionStore.getState().setOnline(false);
        const original = error.config as any;
        if (error.response?.status === 401 && original && !original._retried) {
          original._retried = true;
          refreshPromise = refreshPromise ?? refreshAccessToken();
          const newToken = await refreshPromise;
          refreshPromise = null;

          if (newToken) {
            original.headers.Authorization = `Bearer ${newToken}`;
            return this.instance.request(original);
          }
          // refresh failed -> log out
          const { useAuthStore } = await import("../stores/authStore");
          useAuthStore.getState().logout();
        }
        return Promise.reject(error);
      },
    );
  }

  get<T>(url: string, config?: any) {
    return this.instance.get<T>(url, config);
  }

  post<T>(url: string, data?: any, config?: any) {
    return this.instance.post<T>(url, data, config);
  }

  patch<T>(url: string, data?: any, config?: any) {
    return this.instance.patch<T>(url, data, config);
  }

  put<T>(url: string, data?: any, config?: any) {
    return this.instance.put<T>(url, data, config);
  }

  delete<T>(url: string, config?: any) {
    return this.instance.delete<T>(url, config);
  }

  postFormData<T>(url: string, formData: FormData, config?: any) {
    return this.instance.post<T>(url, formData, {
      ...config,
      headers: {
        "Content-Type": "multipart/form-data",
        ...config?.headers,
      },
    });
  }
}

export const apiClient = new ApiClient();
