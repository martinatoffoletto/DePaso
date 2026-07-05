import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { api, setOnUnauthorized, tokenStorage } from "@/lib/api";
import type { CurrentUser, TokenResponse } from "@/types";

interface AuthState {
  user: CurrentUser | null;
  status: "loading" | "authenticated" | "unauthenticated";
  login: (email: string, password: string) => Promise<CurrentUser>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [status, setStatus] = useState<AuthState["status"]>("loading");

  const logout = useCallback(() => {
    tokenStorage.clear();
    setUser(null);
    setStatus("unauthenticated");
  }, []);

  const loadMe = useCallback(async () => {
    if (!tokenStorage.getAccess()) {
      setStatus("unauthenticated");
      return;
    }
    try {
      const { data } = await api.get<CurrentUser>("/auth/me");
      setUser(data);
      setStatus("authenticated");
    } catch {
      logout();
    }
  }, [logout]);

  const login = useCallback(
    async (email: string, password: string) => {
      const { data } = await api.post<TokenResponse>("/auth/login", {
        email,
        password,
      });
      tokenStorage.save(data.access_token, data.refresh_token);
      const { data: me } = await api.get<CurrentUser>("/auth/me");
      setUser(me);
      setStatus("authenticated");
      return me;
    },
    [],
  );

  useEffect(() => {
    setOnUnauthorized(() => logout());
    void loadMe();
    return () => setOnUnauthorized(null);
  }, [loadMe, logout]);

  const value = useMemo<AuthState>(
    () => ({ user, status, login, logout }),
    [user, status, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
