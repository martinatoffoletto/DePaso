import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { OrgGate } from "@/features/org/OrgGate";
import type { MyOrganization, OrgCarrier } from "@/types";

function LinkCarrierDialog() {
  const qc = useQueryClient();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");

  // La flota no navega/lista transportistas ajenos: vincula por el email
  // con el que el transportista ya está registrado en DePaso.
  const linkMutation = useMutation({
    mutationFn: async () =>
      (await api.post<OrgCarrier>("/organizations/me/carriers", { email: email.trim() })).data,
    onSuccess: (data) => {
      toast.success(`${data.company_name} vinculado a tu flota`);
      qc.invalidateQueries({ queryKey: ["org", "carriers"] });
      qc.invalidateQueries({ queryKey: ["org", "dashboard"] });
      setEmail("");
      setOpen(false);
    },
    onError: (err) => toast.error(apiErrorMessage(err, "No se pudo vincular")),
  });

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
            Ingresá el email con el que el transportista está registrado en DePaso.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            linkMutation.mutate();
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="link-carrier-email">Email del transportista</Label>
            <Input
              id="link-carrier-email"
              type="email"
              placeholder="chofer@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={linkMutation.isPending}>
            {linkMutation.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Plus className="size-4" />
            )}
            Vincular
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function FleetInner({ org }: { org: MyOrganization }) {
  const qc = useQueryClient();
  const toast = useToast();
  const isFleet = org.kind === "fleet";
  // Confirmación antes de la baja: es una acción con efecto en el negocio.
  const [pendingUnlink, setPendingUnlink] = useState<OrgCarrier | null>(null);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["org", "carriers"],
    queryFn: async () => (await api.get<OrgCarrier[]>("/organizations/me/carriers")).data,
  });

  const unlinkMutation = useMutation({
    mutationFn: async (carrierId: number) =>
      (await api.delete<OrgCarrier>(`/organizations/me/carriers/${carrierId}`)).data,
    onSuccess: () => {
      toast.success("Transportista dado de baja");
      setPendingUnlink(null);
      qc.invalidateQueries({ queryKey: ["org", "carriers"] });
      qc.invalidateQueries({ queryKey: ["org", "dashboard"] });
    },
    onError: (err) => toast.error(apiErrorMessage(err, "No se pudo dar de baja")),
  });

  return (
    <div>
      <PageHeader
        title="Flota"
        subtitle="Transportistas vinculados a tu organización"
        action={isFleet ? <LinkCarrierDialog /> : undefined}
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
                          onClick={() => setPendingUnlink(c)}
                        >
                          <UserMinus className="size-4" />
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

      <Dialog
        open={pendingUnlink != null}
        onOpenChange={(o) => {
          if (!o) setPendingUnlink(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dar de baja a {pendingUnlink?.company_name}</DialogTitle>
            <DialogDescription>
              El transportista deja de contar en tu flota y sus futuras entregas
              no suman a tus finanzas. Podés volver a vincularlo cuando quieras.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setPendingUnlink(null)}>
              Cancelar
            </Button>
            <Button
              className="bg-red text-white hover:opacity-90"
              disabled={unlinkMutation.isPending}
              onClick={() => {
                if (pendingUnlink) unlinkMutation.mutate(pendingUnlink.carrier_id);
              }}
            >
              {unlinkMutation.isPending && <Loader2 className="size-4 animate-spin" />}
              Confirmar baja
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function FleetPage() {
  return <OrgGate>{(org) => <FleetInner org={org} />}</OrgGate>;
}
