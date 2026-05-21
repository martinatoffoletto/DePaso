import axios, { AxiosInstance } from "axios";
import * as SecureStore from "expo-secure-store";
import Constants from "expo-constants";

const debuggerHost = Constants.expoConfig?.hostUri;
const localIp = debuggerHost ? debuggerHost.split(":")[0] : "localhost";

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || `http://${localIp}:8000/api/v1`;

class ApiClient {
  private instance: AxiosInstance;

  constructor() {
    this.instance = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
    });

    // Request interceptor: agregar JWT al header
    this.instance.interceptors.request.use(
      async (config) => {
        try {
          const token = await SecureStore.getItemAsync("auth_token");
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        } catch (error) {
          console.error("Error retrieving auth token:", error);
        }
        return config;
      },
      (error) => Promise.reject(error),
    );

    // Response interceptor: manejar errores globales
    this.instance.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Token expirado o inválido
          await SecureStore.deleteItemAsync("auth_token");
          // TODO: dispatch logout action or navigate to login
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
