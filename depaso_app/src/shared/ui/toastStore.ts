import { create } from "zustand";

export type ToastType = "error" | "success" | "info";

interface ToastState {
  message: string | null;
  type: ToastType;
  show: (message: string, type?: ToastType) => void;
  hide: () => void;
}

/** Lightweight global toast, used for non-blocking feedback and global API
 * errors. Screens can call `useToastStore.getState().show(...)`. */
export const useToastStore = create<ToastState>((set) => ({
  message: null,
  type: "info",
  show: (message, type = "info") => set({ message, type }),
  hide: () => set({ message: null }),
}));

export const toast = {
  error: (m: string) => useToastStore.getState().show(m, "error"),
  success: (m: string) => useToastStore.getState().show(m, "success"),
  info: (m: string) => useToastStore.getState().show(m, "info"),
};
