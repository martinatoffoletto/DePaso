import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Star, Truck, UserMinus } from "lucide-react";
import { api, apiErrorMessage } from "@/lib/api";
import { formatDateTime } from "@/lib/utils";
import { carrierLinkStatusMeta } from "@/lib/status";
import { useToast } from "@/components/ui/toast";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState, ErrorState, TableSkeleton, NotAvailableNotice } from "@/components/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { OrgGate } from "@/features/org/OrgGate";
import type { Carrier, MyOrganization, OrgCarrier } from "@/types";

function LinkCarrierDialog({ linkedIds }: { linkedIds: Set<number> }) {
  const qc = useQueryClient();
  const toast = useToast();
  const [open, setOpen] = useState(false);

  // Catálogo de transportistas para vincular (los que aún no están en la flota).
  const { data: carriers, isLoading } = useQuery({
    queryKey: ["carriers", "all"],
    queryFn: async () => (await api.get<Carrier[]>("/carriers")).data,
    enabled: open,
  });

  const linkMutation = useMutation({
    mutationFn: async (carrierId: number) =>
      (await api.post<OrgCarrier>("/organizations/me/carriers", { carrier_id: carrierId }))
        .data,
    onSuccess: () => {
      toast.success("Transportista vinculado");
      qc.invalidateQueries({ queryKey: ["org", "carriers"] });
      qc.invalidateQueries({ queryKey: ["org", "dashboard"] });
    },
    onError: (err) => toast.error(apiErrorMessage(err, "No se pudo vincular")),
  });

  const available = useMemo(
    () => (carriers ?? []).filter((c) => !linkedIds.has(c.id)),
    [carriers, linkedIds],
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" /> Vincular transportista
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Vincular transportista</DialogTitle>
          <DialogDescription>
            Elegí un transportista existente para sumarlo a tu flota.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-80 overflow-y-auto">
          {isLoading ? (
            <TableSkeleton rows={4} cols={2} />
          ) : available.length === 0 ? (
            <EmptyState
              title="No hay transportistas disponibles"
              description="Todos los transportistas registrados ya están en tu flota."
              icon={<Truck className="size-6" />}
            />
          ) : (
            <ul className="divide-y divide-line">
              {available.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">
                      {c.company_name}
                    </p>
                    <p className="text-xs text-ink-mute">
                      {c.vehicle_type} · {c.license_plate}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={linkMutation.isPending}
                    onClick={() => linkMutation.mutate(c.id)}
                  >
                    {linkMutation.isPending && linkMutation.variables === c.id ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Plus className="size-4" />
                    )}
                    Vincular
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function FleetInner({ org }: { org: MyOrganization }) {
  const qc = useQueryClient();
  const toast = useToast();
  const isFleet = org.kind === "fleet" || org.kind === "both";

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["org", "carriers"],
    queryFn: async () => (await api.get<OrgCarrier[]>("/organizations/me/carriers")).data,
  });

  const unlinkMutation = useMutation({
    mutationFn: async (carrierId: number) =>
      (await api.delete<OrgCarrier>(`/organizations/me/carriers/${carrierId}`)).data,
    onSuccess: () => {
      toast.success("Transportista dado de baja");
      qc.invalidateQueries({ queryKey: ["org", "carriers"] });
      qc.invalidateQueries({ queryKey: ["org", "dashboard"] });
    },
    onError: (err) => toast.error(apiErrorMessage(err, "No se pudo dar de baja")),
  });

  const linkedIds = useMemo(
    () => new Set((data ?? []).map((c) => c.carrier_id)),
    [data],
  );

  return (
    <div>
      <PageHeader
        title="Flota"
        subtitle="Transportistas vinculados a tu organización"
        action={isFleet ? <LinkCarrierDialog linkedIds={linkedIds} /> : undefined}
      />

      {!isFleet && (
        <div className="mb-4">
          <NotAvailableNotice>
            Tu organización es de tipo comercio. La gestión de flota está
            disponible para organizaciones de tipo flota.
          </NotAvailableNotice>
        </div>
      )}

      <Card className="overflow-hidden">
        {isLoading ? (
          <TableSkeleton rows={5} cols={5} />
        ) : isError ? (
          <ErrorState error={error} onRetry={() => refetch()} />
        ) : (data?.length ?? 0) === 0 ? (
          <EmptyState
            title="Todavía no tenés transportistas"
            description="Vinculá un transportista existente para empezar a operar tu flota."
            icon={<Truck className="size-6" />}
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Transportista</TableHead>
                <TableHead>Vehículo</TableHead>
                <TableHead>Reputación</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Vinculado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data!.map((c) => {
                const meta = carrierLinkStatusMeta(c.status);
                return (
                  <TableRow key={c.carrier_id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-ink">{c.company_name}</span>
                        {c.is_verified && <Badge tone="sky">Verificado</Badge>}
                      </div>
                    </TableCell>
                    <TableCell className="text-ink-soft">
                      {c.vehicle_type} · {c.license_plate}
                    </TableCell>
                    <TableCell>
                      <span className="tnum inline-flex items-center gap-1 text-ink-soft">
                        <Star className="size-3.5 fill-amber text-amber" />
                        {c.reputation.toFixed(1)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge tone={meta.tone}>{meta.label}</Badge>
                    </TableCell>
                    <TableCell className="tnum text-ink-mute">
                      {formatDateTime(c.linked_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      {c.status === "active" && isFleet && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red hover:bg-red-bg"
                          disabled={unlinkMutation.isPending}
                          onClick={() => unlinkMutation.mutate(c.carrier_id)}
                        >
                          {unlinkMutation.isPending &&
                          unlinkMutation.variables === c.carrier_id ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <UserMinus className="size-4" />
                          )}
                          Baja
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}

export function FleetPage() {
  return <OrgGate>{(org) => <FleetInner org={org} />}</OrgGate>;
}
