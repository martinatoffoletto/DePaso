import { create } from "zustand";

interface RiderState {
  /** Whether the carrier is on shift (receiving on-demand offers + broadcasting GPS). */
  online: boolean;
  /** Epoch ms when the current shift started, or null when offline. */
  shiftStartedAt: number | null;
  goOnline: () => void;
  goOffline: () => void;
}

export const useRiderStore = create<RiderState>((set) => ({
  online: false,
  shiftStartedAt: null,
  goOnline: () => set({ online: true, shiftStartedAt: Date.now() }),
  goOffline: () => set({ online: false, shiftStartedAt: null }),
}));
