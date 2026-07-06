import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { api } from "@/lib/api";
import type { MyOrganization } from "@/types";

/**
 * Resuelve la organización activa del usuario (`GET /organizations/me`).
 * El backend devuelve 403 cuando el usuario no es miembro de ninguna org:
 * eso NO es un error a reintentar, es el estado "todavía no tenés organización".
 */
export function useMyOrg() {
  return useQuery<MyOrganization | null>({
    queryKey: ["org", "me"],
    queryFn: async () => {
      try {
        const { data } = await api.get<MyOrganization>("/organizations/me");
        return data;
      } catch (err) {
        if (axios.isAxiosError(err) && err.response?.status === 403) {
          return null; // sin organización
        }
        throw err;
      }
    },
    staleTime: 60_000,
    retry: false,
  });
}
