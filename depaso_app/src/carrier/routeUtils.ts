import { CarrierRoute } from "@/src/shared/types";
import { parseApiDate } from "@/src/shared/utils/dates";

/**
 * Ventana efímera creada por el toggle "Dedicado por espacio". Se marca
 * publicándola con destino == origen (para una ventana dedicada el matching
 * usa solo el origen como centro de zona, así que el destino es inocuo).
 * No es un viaje publicado por el rider: no debe aparecer en las listas.
 */
export function isSpaceWindow(r: CarrierRoute): boolean {
  return (
    r.kind === "dedicated_window" &&
    r.destination_lat != null && r.destination_lon != null &&
    r.destination_lat === r.origin_lat && r.destination_lon === r.origin_lon
  );
}

/** Sigue vigente: es recurrente o su ventana todavía no terminó. */
export function isRouteCurrent(r: CarrierRoute, now = Date.now()): boolean {
  return !!r.recurrence_days || parseApiDate(r.window_end).getTime() > now;
}

// JS Date.getDay(): 0 = domingo … 6 = sábado.
const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

/**
 * Ventana efectiva de una ruta en este momento, o null si no está corriendo.
 * Espejo de routes/windows.py del backend: para una ruta recurrente la ventana
 * de referencia queda en el pasado — lo que vale es la ocurrencia de HOY (o la
 * de ayer, si la franja cruza medianoche) en un día habilitado.
 */
export function effectiveWindow(r: CarrierRoute, now = Date.now()): { start: Date; end: Date } | null {
  const start = parseApiDate(r.window_start);
  const end = parseApiDate(r.window_end);
  if (!r.recurrence_days) {
    return start.getTime() <= now && now <= end.getTime() ? { start, end } : null;
  }
  const days = new Set(r.recurrence_days.split(",").map((d) => d.trim().toLowerCase()));
  const durationMs = end.getTime() - start.getTime();
  const today = new Date(now);
  for (const offset of [0, -1]) {
    const occStart = new Date(
      today.getFullYear(), today.getMonth(), today.getDate() + offset,
      start.getHours(), start.getMinutes(), 0, 0,
    );
    if (!days.has(DAY_KEYS[occStart.getDay()])) continue;
    const occEnd = new Date(occStart.getTime() + durationMs);
    if (occStart.getTime() <= now && now <= occEnd.getTime()) return { start: occStart, end: occEnd };
  }
  return null;
}

/** Cuánto antes de la ventana se ofrece "iniciar el trayecto" (ms). */
export const TRIP_LEAD_MS = 30 * 60 * 1000;

/** Próxima ocurrencia de la ruta que arranca dentro de `leadMs`, o null. */
function upcomingWindow(r: CarrierRoute, now: number, leadMs: number): { start: Date; end: Date } | null {
  // La ventana efectiva "corrida" al futuro: evaluar en (now + lead) captura
  // una ocurrencia que todavía no empezó pero empieza dentro del lead.
  const w = effectiveWindow(r, now + leadMs);
  if (!w || w.start.getTime() <= now) return null;
  return w;
}

/**
 * Ocurrencia de HOY de la ruta aunque no esté corriendo — para "iniciar el
 * trayecto antes": la apertura se adelanta a ahora pero el cierre se conserva.
 * Para una ruta one-off es su ventana tal cual.
 */
export function todayOccurrence(r: CarrierRoute, now = Date.now()): { start: Date; end: Date } {
  const start = parseApiDate(r.window_start);
  const end = parseApiDate(r.window_end);
  if (!r.recurrence_days) return { start, end };
  const today = new Date(now);
  const occStart = new Date(
    today.getFullYear(), today.getMonth(), today.getDate(),
    start.getHours(), start.getMinutes(), 0, 0,
  );
  return { start: occStart, end: new Date(occStart.getTime() + (end.getTime() - start.getTime())) };
}

export interface TripSession {
  route: CarrierRoute;
  window: { start: Date; end: Date };
  /** true: la ventana todavía no abrió (arranca dentro de TRIP_LEAD_MS). */
  upcoming: boolean;
}

/**
 * Trayecto colaborativo (habitual o especial) en ventana AHORA, o por
 * arrancar dentro de TRIP_LEAD_MS — la "trayectoria viva" de la sesión del
 * rider. Las activas tienen prioridad sobre las próximas.
 */
export function tripSession(routes: CarrierRoute[], now = Date.now()): TripSession | null {
  let next: TripSession | null = null;
  for (const r of routes) {
    if (!r.is_active || r.kind !== "collaborative_route") continue;
    const active = effectiveWindow(r, now);
    if (active) return { route: r, window: active, upcoming: false };
    const soon = upcomingWindow(r, now, TRIP_LEAD_MS);
    if (soon && (!next || soon.start < next.window.start)) {
      next = { route: r, window: soon, upcoming: true };
    }
  }
  return next;
}

/** Qué mostrar en "viajes publicados": activos, vigentes y no efímeros. */
export function visibleRoutes(routes: CarrierRoute[], now = Date.now()): CarrierRoute[] {
  return routes.filter((r) => r.is_active && !isSpaceWindow(r) && isRouteCurrent(r, now));
}
