/**
 * Momento de retiro elegido por el cliente en el paso de direcciones.
 * El backend no persiste horarios de retiro (MVP): la elección vive en el
 * flow y se traduce a assignment_mode al confirmar — "asap" y "exact" matchean
 * on_demand; "window" matchea by_availability (cadete que pasa en esa franja).
 */
export type PickupSchedule =
  | { kind: "asap" }
  | { kind: "window"; date: string; startHour: number | null; endHour: number | null }
  | { kind: "exact"; date: string; hour: number | null };

export const PICKUP_ASAP: PickupSchedule = { kind: "asap" };

const hh = (h: number) => `${String(h).padStart(2, "0")}:00`;

function toISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function todayISO(): string {
  return toISO(new Date());
}

export function tomorrowISO(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return toISO(d);
}

export function dateToISO(d: Date): string {
  return toISO(d);
}

/** "Hoy", "Mañana" o "vie 24/07" para cualquier fecha ISO. */
export function dayLabel(iso: string): string {
  if (iso === todayISO()) return "Hoy";
  if (iso === tomorrowISO()) return "Mañana";
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const weekday = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"][date.getDay()];
  return `${weekday} ${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}`;
}

/** True si la elección está completa (horas elegidas y franja coherente). */
export function pickupScheduleValid(s: PickupSchedule): boolean {
  switch (s.kind) {
    case "asap":
      return true;
    case "window":
      return s.startHour != null && s.endHour != null && s.endHour > s.startHour;
    case "exact":
      return s.hour != null;
  }
}

/** Texto para mostrar la elección (chip del paso 2 y fila del resumen). */
export function pickupScheduleLabel(s: PickupSchedule): string {
  switch (s.kind) {
    case "asap":
      return "Hoy · Lo antes posible";
    case "window":
      return s.startHour != null && s.endHour != null
        ? `${dayLabel(s.date)} · Entre ${hh(s.startHour)} y ${hh(s.endHour)}`
        : "Elegí la franja horaria";
    case "exact":
      return s.hour != null ? `${dayLabel(s.date)} · A las ${hh(s.hour)}` : "Elegí la hora";
  }
}
