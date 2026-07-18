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

/** Qué mostrar en "viajes publicados": activos, vigentes y no efímeros. */
export function visibleRoutes(routes: CarrierRoute[], now = Date.now()): CarrierRoute[] {
  return routes.filter((r) => r.is_active && !isSpaceWindow(r) && isRouteCurrent(r, now));
}
