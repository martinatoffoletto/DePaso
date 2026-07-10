import { create } from "zustand";
import * as SecureStore from "expo-secure-store";

const KEY = "depaso_settings";

interface Settings {
  notificationsEnabled: boolean;
  preferCollaborative: boolean;
  onboardingSeen: boolean;
}

const DEFAULTS: Settings = {
  notificationsEnabled: true,
  preferCollaborative: true,
  onboardingSeen: false,
};

interface SettingsState extends Settings {
  hydrated: boolean;
  hydrate: () => Promise<void>;
  update: (patch: Partial<Settings>) => void;
}

/** User preferences, persisted to SecureStore so they survive restarts. */
export const useSettingsStore = create<SettingsState>((set, get) => ({
  ...DEFAULTS,
  hydrated: false,

  hydrate: async () => {
    try {
      const raw = await SecureStore.getItemAsync(KEY);
      if (raw) set({ ...(JSON.parse(raw) as Partial<Settings>) });
    } catch {
      // ignore corrupt/missing settings — fall back to defaults
    }
    set({ hydrated: true });
  },

  update: (patch) => {
    set(patch);
    const s = get();
    const toPersist: Settings = {
      notificationsEnabled: s.notificationsEnabled,
      preferCollaborative: s.preferCollaborative,
      onboardingSeen: s.onboardingSeen,
    };
    SecureStore.setItemAsync(KEY, JSON.stringify(toPersist)).catch(() => {});
  },
}));
