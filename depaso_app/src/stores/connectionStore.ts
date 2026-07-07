import { create } from "zustand";

interface ConnectionState {
  online: boolean;
  setOnline: (online: boolean) => void;
}

/** Coarse connectivity flag, flipped by the API interceptor: a request that
 * fails with no HTTP response means we're offline; any successful response
 * means we're back. Drives the offline banner. */
export const useConnectionStore = create<ConnectionState>((set) => ({
  online: true,
  setOnline: (online) => set((s) => (s.online === online ? s : { online })),
}));
