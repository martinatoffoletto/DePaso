import { create } from "zustand";
import * as SecureStore from "expo-secure-store";

const KEY = "depaso_rider_weekly_goal";

type GoalStore = {
  /** Meta semanal en ARS elegida por el rider, o null si no fijó una. */
  weeklyGoal: number | null;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setGoal: (amount: number | null) => void;
};

/** Meta de ganancias semanal del rider — vive solo en el dispositivo. */
export const useGoalStore = create<GoalStore>((set) => ({
  weeklyGoal: null,
  hydrated: false,

  hydrate: async () => {
    try {
      const raw = await SecureStore.getItemAsync(KEY);
      if (raw != null) {
        const n = Number(raw);
        if (Number.isFinite(n) && n > 0) set({ weeklyGoal: n });
      }
    } catch {
      // sin dato guardado: arranca sin meta
    }
    set({ hydrated: true });
  },

  setGoal: (amount) => {
    set({ weeklyGoal: amount });
    if (amount == null) SecureStore.deleteItemAsync(KEY).catch(() => {});
    else SecureStore.setItemAsync(KEY, String(amount)).catch(() => {});
  },
}));
