import { Shipment, ShipmentStatus } from "@/src/shared/types";
import { carrierPayout } from "@/src/shared/utils/payout";
import { parseApiDate } from "@/src/shared/utils/dates";

export type WeekDay = { label: string; amount: number; isToday: boolean; isFuture: boolean };
export type WeekEarnings = { days: WeekDay[]; total: number; count: number };

const DAY_LABELS = ["L", "M", "X", "J", "V", "S", "D"]; // semana lunes → domingo
const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const DAY_MS = 86_400_000;

/** Lunes (00:00 local) de la semana a la que pertenece `d`. */
export function mondayOf(d: Date): Date {
  const m = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  m.setDate(m.getDate() - ((m.getDay() + 6) % 7));
  return m;
}

/** "14 jul – 20 jul" para la semana de `refDate`. */
export function weekRangeLabel(refDate: Date): string {
  const monday = mondayOf(refDate);
  const sunday = new Date(monday.getTime() + 6 * DAY_MS);
  const fmt = (d: Date) => `${d.getDate()} ${MONTHS[d.getMonth()]}`;
  return `${fmt(monday)} – ${fmt(sunday)}`;
}

/**
 * Ganancias (payout neto) por día de la semana calendario de `refDate`.
 * isToday/isFuture se marcan contra el HOY real, así una semana pasada
 * no tiene días "futuros" ni un falso "hoy".
 */
export function weekEarnings(shipments: Shipment[], refDate = new Date()): WeekEarnings {
  const monday = mondayOf(refDate);
  const todayStart = startOfToday();

  const days: WeekDay[] = DAY_LABELS.map((label, i) => {
    const dayStart = monday.getTime() + i * DAY_MS;
    return {
      label,
      amount: 0,
      isToday: dayStart === todayStart,
      isFuture: dayStart > todayStart,
    };
  });

  let total = 0;
  let count = 0;
  for (const s of shipments) {
    if (s.status !== ShipmentStatus.DELIVERED || s.estimated_price == null) continue;
    // updated_at ≈ momento de la entrega (última transición de estado).
    const idx = Math.floor((parseApiDate(s.updated_at).getTime() - monday.getTime()) / DAY_MS);
    if (idx < 0 || idx > 6) continue;
    const pay = carrierPayout(s.estimated_price);
    days[idx].amount += pay;
    total += pay;
    count += 1;
  }
  return { days, total, count };
}

/** Entregas de la semana de `refDate`, más recientes primero. */
export function shipmentsOfWeek(shipments: Shipment[], refDate: Date): Shipment[] {
  const start = mondayOf(refDate).getTime();
  const end = start + 7 * DAY_MS;
  return shipments
    .filter((s) => {
      const t = parseApiDate(s.updated_at).getTime();
      return t >= start && t < end;
    })
    .sort((a, b) => parseApiDate(b.updated_at).getTime() - parseApiDate(a.updated_at).getTime());
}

/** Índice de día de semana (0 = lunes) de un envío dentro de la semana de `refDate`. */
export function dayIndexInWeek(s: Shipment, refDate: Date): number {
  return Math.floor((parseApiDate(s.updated_at).getTime() - mondayOf(refDate).getTime()) / DAY_MS);
}

function startOfToday(): number {
  const t = new Date();
  return new Date(t.getFullYear(), t.getMonth(), t.getDate()).getTime();
}
