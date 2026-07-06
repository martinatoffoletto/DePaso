import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { api } from "@/lib/api";
import { formatMoney } from "@/lib/utils";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { EmptyState, ErrorState } from "@/components/states";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { OrgGate } from "@/features/org/OrgGate";
import type { MyOrganization, OrgFinance } from "@/types";

// Tokens (index.css) — no se pueden leer variables CSS en el canvas de Recharts.
const COLOR_SPENT = "#d75a4e"; // red
const COLOR_EARNED = "#0e8f66"; // emerald-deep
const COLOR_GRID = "#e6dfc9"; // line
const COLOR_AXIS = "#7a8780"; // ink-mute

interface ChartRow {
  month: string;
  spent: number;
  earned: number;
}

function mergeSeries(finance: OrgFinance): ChartRow[] {
  const byMonth = new Map<string, ChartRow>();
  for (const p of finance.spent.by_month) {
    byMonth.set(p.month, { month: p.month, spent: p.amount, earned: 0 });
  }
  for (const p of finance.earned.by_month) {
    const row = byMonth.get(p.month) ?? { month: p.month, spent: 0, earned: 0 };
    row.earned = p.amount;
    byMonth.set(p.month, row);
  }
  return [...byMonth.values()].sort((a, b) => a.month.localeCompare(b.month));
}

function formatMonthLabel(ym: string): string {
  const [y, m] = ym.split("-");
  const date = new Date(Number(y), Number(m) - 1, 1);
  return date.toLocaleDateString("es-AR", { month: "short", year: "2-digit" });
}

function FinanceInner({ org }: { org: MyOrganization }) {
  const isFleet = org.kind === "fleet" || org.kind === "both";
  const isMerchant = org.kind === "merchant" || org.kind === "both";

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["org", "finance"],
    queryFn: async () => (await api.get<OrgFinance>("/organizations/me/finance")).data,
  });

  const rows = useMemo(() => (data ? mergeSeries(data) : []), [data]);
  const balance =
    data != null ? data.earned.total - data.spent.total : null;

  return (
    <div>
      <PageHeader
        title="Finanzas"
        subtitle="Dinero puesto en envíos vs. ganado por la flota"
      />

      {isError ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            {isMerchant && (
              <StatCard
                label="Dinero puesto"
                value={formatMoney(data?.spent.total)}
                hint="acumulado en envíos"
                icon={TrendingDown}
                tone="amber"
                loading={isLoading}
              />
            )}
            {isFleet && (
              <StatCard
                label="Dinero ganado"
                value={formatMoney(data?.earned.total)}
                hint="acumulado por la flota"
                icon={TrendingUp}
                tone="emerald"
                loading={isLoading}
              />
            )}
            {org.kind === "both" && (
              <StatCard
                label="Balance"
                value={formatMoney(balance)}
                hint={balance != null && balance >= 0 ? "a favor" : "en contra"}
                icon={Wallet}
                tone={balance != null && balance >= 0 ? "emerald" : "amber"}
                loading={isLoading}
              />
            )}
          </div>

          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Evolución mensual</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-72 w-full" />
              ) : rows.length === 0 ? (
                <EmptyState
                  title="Sin movimientos todavía"
                  description="Cuando tengas envíos entregados vas a ver la evolución mes a mes."
                  icon={<Wallet className="size-6" />}
                />
              ) : (
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={COLOR_GRID} vertical={false} />
                      <XAxis
                        dataKey="month"
                        tickFormatter={formatMonthLabel}
                        tick={{ fill: COLOR_AXIS, fontSize: 12 }}
                        tickLine={false}
                        axisLine={{ stroke: COLOR_GRID }}
                      />
                      <YAxis
                        tick={{ fill: COLOR_AXIS, fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                        width={72}
                        tickFormatter={(v) => formatMoney(v)}
                      />
                      <Tooltip
                        formatter={(v: number, name) => [
                          formatMoney(v),
                          name === "spent" ? "Puesto" : "Ganado",
                        ]}
                        labelFormatter={formatMonthLabel}
                        contentStyle={{
                          borderRadius: 12,
                          border: `1px solid ${COLOR_GRID}`,
                          fontSize: 13,
                        }}
                      />
                      <Legend
                        formatter={(value) => (value === "spent" ? "Puesto" : "Ganado")}
                        wrapperStyle={{ fontSize: 13 }}
                      />
                      {isMerchant && (
                        <Bar dataKey="spent" fill={COLOR_SPENT} radius={[4, 4, 0, 0]} />
                      )}
                      {isFleet && (
                        <Bar dataKey="earned" fill={COLOR_EARNED} radius={[4, 4, 0, 0]} />
                      )}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

export function FinancePage() {
  return <OrgGate>{(org) => <FinanceInner org={org} />}</OrgGate>;
}
