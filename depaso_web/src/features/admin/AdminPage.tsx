import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  CheckCircle2,
  Cpu,
  Database,
  Leaf,
  Server,
  Truck,
  Users,
} from "lucide-react";
import { api } from "@/lib/api";
import { formatDateTime, formatInt, formatKg, formatPercent } from "@/lib/utils";
import { packageSizeLabel, shipmentStatusMeta } from "@/lib/status";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/states";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MatchingWeightsCard } from "@/features/admin/MatchingWeightsCard";
import type { AdminActivity, AdminDashboard, AdminSystemStatus } from "@/types";

function KpiGrid() {
  // Auto-refresh: el panel de monitoreo se mantiene fresco en producción.
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn: async () => (await api.get<AdminDashboard>("/admin/dashboard")).data,
    refetchInterval: 15_000,
  });

  if (isError) return <ErrorState error={error} onRetry={() => refetch()} />;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        label="Usuarios"
        value={formatInt(data?.total_users)}
        icon={Users}
        tone="violet"
        loading={isLoading}
      />
      <StatCard
        label="Transportistas"
        value={formatInt(data?.total_carriers)}
        hint={`${formatInt(data?.carriers_pending_verification)} sin verificar`}
        icon={Truck}
        tone="forest"
        loading={isLoading}
      />
      <StatCard
        label="Envíos activos"
        value={formatInt(data?.shipments_active)}
        hint={`${formatInt(data?.shipments_pending)} pendientes`}
        icon={Activity}
        tone="sky"
        loading={isLoading}
      />
      <StatCard
        label="Entregados"
        value={formatInt(data?.shipments_delivered)}
        hint={`${formatPercent(data?.matching_success_rate)} de éxito`}
        icon={CheckCircle2}
        tone="emerald"
        loading={isLoading}
      />
      <StatCard
        label="CO₂ ahorrado"
        value={formatKg(data?.total_co2_saved_kg)}
        icon={Leaf}
        tone="emerald"
        loading={isLoading}
      />
      <StatCard
        label="Envíos totales"
        value={formatInt(data?.shipments_total)}
        icon={Server}
        tone="neutral"
        loading={isLoading}
      />
    </div>
  );
}

function SystemStatusCard() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin", "status"],
    queryFn: async () => (await api.get<AdminSystemStatus>("/admin/status")).data,
    refetchInterval: 20_000,
  });

  const apiOk = !isError && data?.api === "ok";
  const dbOk = data?.database === "ok";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Server className="size-4.5 text-forest" />
          Estado del sistema
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-sm text-ink">
            <Server className="size-4 text-ink-mute" /> API
          </span>
          {isLoading ? (
            <Badge tone="neutral">…</Badge>
          ) : apiOk ? (
            <Badge tone="emerald">Operativa</Badge>
          ) : (
            <Badge tone="red">Sin respuesta</Badge>
          )}
        </div>

        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-sm text-ink">
            <Database className="size-4 text-ink-mute" /> Base de datos
          </span>
          {isLoading || isError ? (
            <Badge tone="neutral">…</Badge>
          ) : dbOk ? (
            <Badge tone="emerald">Conectada</Badge>
          ) : (
            <Badge tone="red">Error</Badge>
          )}
        </div>

        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-sm text-ink">
            <Cpu className="size-4 text-ink-mute" /> Modelo de visión
          </span>
          {isLoading || isError ? (
            <Badge tone="neutral">…</Badge>
          ) : data?.vision_model_loaded ? (
            <Badge tone="emerald">Cargado</Badge>
          ) : (
            <Badge tone="amber">Fallback (stub)</Badge>
          )}
        </div>

        {data && (
          <p className="text-xs text-ink-mute">
            Entorno: {data.environment}
            {data.debug && " · debug"}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function ActivityCard() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["admin", "activity"],
    queryFn: async () => (await api.get<AdminActivity>("/admin/activity?limit=8")).data,
    refetchInterval: 30_000,
  });

  const events = data?.recent_events ?? [];
  const classifications = data?.recent_classifications ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="size-4.5 text-forest" />
          Actividad reciente
        </CardTitle>
        <p className="text-sm text-ink-mute">
          Últimos cambios de estado de envíos y clasificaciones del modelo de visión.
        </p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <TableSkeleton rows={4} cols={2} />
        ) : isError ? (
          <ErrorState error={error} onRetry={() => refetch()} />
        ) : events.length === 0 && classifications.length === 0 ? (
          <EmptyState
            title="Sin actividad todavía"
            description="Los eventos de envíos y clasificaciones van a aparecer acá."
            icon={<Activity className="size-6" />}
          />
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h3 className="mb-2 text-sm font-medium text-ink">Envíos</h3>
              {events.length === 0 ? (
                <p className="text-sm text-ink-mute">Sin eventos recientes.</p>
              ) : (
                <ul className="space-y-2">
                  {events.map((e) => {
                    const meta = shipmentStatusMeta(e.status);
                    return (
                      <li key={e.id} className="flex items-center justify-between gap-2 text-sm">
                        <span className="text-ink">
                          Envío #{e.shipment_id}{" "}
                          <Badge tone={meta.tone}>{meta.label}</Badge>
                        </span>
                        <span className="shrink-0 text-xs text-ink-mute">
                          {formatDateTime(e.created_at)}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
            <div>
              <h3 className="mb-2 text-sm font-medium text-ink">Clasificaciones</h3>
              {classifications.length === 0 ? (
                <p className="text-sm text-ink-mute">Sin clasificaciones recientes.</p>
              ) : (
                <ul className="space-y-2">
                  {classifications.map((c) => (
                    <li key={c.id} className="flex items-center justify-between gap-2 text-sm">
                      <span className="flex items-center gap-2 text-ink">
                        <Badge tone={c.model_loaded ? "forest" : "amber"}>
                          {packageSizeLabel(c.predicted_category)}
                        </Badge>
                        {formatPercent(c.confidence)} de confianza
                        {!c.model_loaded && (
                          <span className="text-xs text-ink-mute">(stub)</span>
                        )}
                      </span>
                      <span className="shrink-0 text-xs text-ink-mute">
                        {formatDateTime(c.created_at)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function AdminPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Panel de administración"
        subtitle="Monitoreo operativo en vivo · se actualiza automáticamente"
      />

      <KpiGrid />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ActivityCard />
        </div>
        <SystemStatusCard />
      </div>

      <MatchingWeightsCard />
    </div>
  );
}
