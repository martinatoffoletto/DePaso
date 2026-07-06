import { useQuery } from "@tanstack/react-query";
import {
  Leaf,
  Package,
  PackageCheck,
  Timer,
  TrendingDown,
  TrendingUp,
  Truck,
} from "lucide-react";
import { api } from "@/lib/api";
import { formatInt, formatKg, formatMoney } from "@/lib/utils";
import { orgKindLabel } from "@/lib/status";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { ErrorState } from "@/components/states";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OrgGate } from "@/features/org/OrgGate";
import type { MyOrganization, OrgDashboard } from "@/types";

function DashboardInner({ org }: { org: MyOrganization }) {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["org", "dashboard"],
    queryFn: async () => (await api.get<OrgDashboard>("/organizations/me/dashboard")).data,
  });

  const isFleet = org.kind === "fleet" || org.kind === "both";
  const isMerchant = org.kind === "merchant" || org.kind === "both";

  return (
    <div>
      <PageHeader
        title={`Hola, ${org.name}`}
        subtitle="Resumen operativo de tu organización"
        action={<Badge tone="forest">{orgKindLabel(org.kind)}</Badge>}
      />

      {isError ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Envíos activos"
              value={formatInt(data?.shipments_active)}
              hint={`${formatInt(data?.shipments_pending)} pendientes`}
              icon={Timer}
              tone="sky"
              loading={isLoading}
            />
            <StatCard
              label="Envíos entregados"
              value={formatInt(data?.shipments_delivered)}
              hint={`${formatInt(data?.shipments_total)} en total`}
              icon={PackageCheck}
              tone="emerald"
              loading={isLoading}
            />
            {isFleet && (
              <StatCard
                label="Flota activa"
                value={formatInt(data?.fleet_size)}
                hint="transportistas vinculados"
                icon={Truck}
                tone="forest"
                loading={isLoading}
              />
            )}
            <StatCard
              label="CO₂ ahorrado"
              value={formatKg(data?.total_co2_saved_kg)}
              hint="por entregas colaborativas"
              icon={Leaf}
              tone="emerald"
              loading={isLoading}
            />
            {!isFleet && (
              <StatCard
                label="Envíos totales"
                value={formatInt(data?.shipments_total)}
                icon={Package}
                tone="violet"
                loading={isLoading}
              />
            )}
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {isMerchant && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingDown className="size-4.5 text-red" /> Dinero puesto
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="tnum text-3xl font-semibold text-ink">
                    {formatMoney(data?.total_spent)}
                  </p>
                  <p className="mt-1 text-sm text-ink-mute">
                    Invertido en tus envíos este período.
                  </p>
                </CardContent>
              </Card>
            )}
            {isFleet && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="size-4.5 text-emerald-deep" /> Dinero ganado
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="tnum text-3xl font-semibold text-ink">
                    {formatMoney(data?.total_earned)}
                  </p>
                  <p className="mt-1 text-sm text-ink-mute">
                    Generado por las entregas de tu flota.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export function DashboardPage() {
  return <OrgGate>{(org) => <DashboardInner org={org} />}</OrgGate>;
}
