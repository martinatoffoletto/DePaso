import { create } from "zustand";

interface RiderState {
  /** Whether the carrier is on shift (receiving on-demand offers + broadcasting GPS). */
  online: boolean;
  /** Epoch ms when the current shift started, or null when offline. */
  shiftStartedAt: number | null;
  /** total_earnings al arrancar el turno — lo ganado EN el turno es la diferencia. */
  shiftBaselineEarnings: number | null;
  goOnline: () => void;
  goOffline: () => void;
  setShiftBaseline: (total: number) => void;
}

export const useRiderStore = create<RiderState>((set) => ({
  online: false,
  shiftStartedAt: null,
  shiftBaselineEarnings: null,
  goOnline: () => set({ online: true, shiftStartedAt: Date.now(), shiftBaselineEarnings: null }),
  goOffline: () => set({ online: false, shiftStartedAt: null, shiftBaselineEarnings: null }),
  setShiftBaseline: (total) => set({ shiftBaselineEarnings: total }),
}));
