import axios, { AxiosError, type AxiosInstance } from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

const TOKEN_KEY = "depaso_access";
const REFRESH_KEY = "depaso_refresh";

export const tokenStorage = {
  getAccess: () => localStorage.getItem(TOKEN_KEY),
  getRefresh: () => localStorage.getItem(REFRESH_KEY),
  save(access: string, refresh: string | null) {
    localStorage.setItem(TOKEN_KEY, access);
    if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
  },
  clear() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};

// El AuthProvider registra acá su logout para reaccionar cuando el refresh falla.
let onUnauthorized: (() => void) | null = null;
export function setOnUnauthorized(cb: (() => void) | null) {
  onUnauthorized = cb;
}

// Un único refresh en vuelo compartido por los 401 concurrentes (espeja depaso_app/src/services/api.ts).
let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refresh = tokenStorage.getRefresh();
  if (!refresh) return null;
  try {
    // axios plano: no debe pasar por los interceptores.
    const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, {
      refresh_token: refresh,
    });
    tokenStorage.save(data.access_token, data.refresh_token);
    return data.access_token as string;
  } catch {
    tokenStorage.clear();
    return null;
  }
}

function createClient(): AxiosInstance {
  const instance = axios.create({ baseURL: API_BASE_URL, timeout: 15000 });

  instance.interceptors.request.use((config) => {
    const token = tokenStorage.getAccess();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  instance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const original = error.config as
        | (typeof error.config & { _retried?: boolean })
        | undefined;
      const status = error.response?.status;

      if (status === 401 && original && !original._retried) {
        original._retried = true;
        refreshPromise = refreshPromise ?? refreshAccessToken();
        const newToken = await refreshPromise;
        refreshPromise = null;

        if (newToken) {
          original.headers = original.headers ?? {};
          original.headers.Authorization = `Bearer ${newToken}`;
          return instance.request(original);
        }
        tokenStorage.clear();
        onUnauthorized?.();
      }
      return Promise.reject(error);
    },
  );

  return instance;
}

export const api = createClient();

/** Extrae el `detail` de un error FastAPI para mostrarlo al usuario. */
export function apiErrorMessage(err: unknown, fallback = "Ocurrió un error"): string {
  if (axios.isAxiosError(err)) {
    const detail = err.response?.data?.detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail) && detail[0]?.msg) return String(detail[0].msg);
    if (err.code === "ERR_NETWORK") return "No se pudo conectar con la API";
  }
  return fallback;
}
