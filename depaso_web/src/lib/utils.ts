import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Compact number formatting for KPI values: 1.284 -> "1,3 mil" style kept simple. */
export function formatInt(n: number | null | undefined): string {
  if (n == null) return "—";
  return new Intl.NumberFormat("es-AR").format(n);
}

export function formatKg(n: number | null | undefined, digits = 1): string {
  if (n == null) return "—";
  return `${new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(n)} kg`;
}

export function formatMoney(n: number | null | undefined): string {
  if (n == null) return "—";
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatPercent(ratio: number | null | undefined, digits = 0): string {
  if (ratio == null) return "—";
  return `${(ratio * 100).toFixed(digits)}%`;
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
