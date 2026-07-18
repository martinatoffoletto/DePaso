import { Shipment } from "@/src/shared/types";
import { parseApiDate } from "@/src/shared/utils/dates";
import { mondayOf } from "./weekEarnings";

export type HistoryGroup = { title: string; items: Shipment[] };

/** Historial agrupado por recencia: Hoy / Ayer / Esta semana / Anteriores. */
export function groupByRecency(shipments: Shipment[]): HistoryGroup[] {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterdayStart = todayStart - 86_400_000;
  const weekStart = mondayOf(now).getTime();

  const groups: HistoryGroup[] = [
    { title: "Hoy", items: [] },
    { title: "Ayer", items: [] },
    { title: "Esta semana", items: [] },
    { title: "Anteriores", items: [] },
  ];

  const sorted = [...shipments].sort(
    (a, b) => parseApiDate(b.updated_at).getTime() - parseApiDate(a.updated_at).getTime(),
  );
  for (const s of sorted) {
    const t = parseApiDate(s.updated_at).getTime();
    if (t >= todayStart) groups[0].items.push(s);
    else if (t >= yesterdayStart) groups[1].items.push(s);
    else if (t >= weekStart) groups[2].items.push(s);
    else groups[3].items.push(s);
  }
  return groups.filter((g) => g.items.length > 0);
}
