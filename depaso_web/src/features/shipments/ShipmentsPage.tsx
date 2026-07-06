import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Package } from "lucide-react";
import { api } from "@/lib/api";
import { formatDateTime, formatKg, formatMoney } from "@/lib/utils";
import {
  assignmentModeLabel,
  modalityLabel,
  packageSizeLabel,
  shipmentStatusMeta,
  SHIPMENT_STATUS_OPTIONS,
} from "@/lib/status";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState, ErrorState, TableSkeleton, NotAvailableNotice } from "@/components/states";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { OrgGate } from "@/features/org/OrgGate";
import { CreateShipmentDialog } from "@/features/shipments/CreateShipmentDialog";
import type { MyOrganization, OrgShipment, ShipmentStatus } from "@/types";

type StatusFilter = ShipmentStatus | "all";

function ShipmentsInner({ org }: { org: MyOrganization }) {
  const isMerchant = org.kind === "merchant" || org.kind === "both";
  const [filter, setFilter] = useState<StatusFilter>("all");

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["org", "shipments", filter],
    queryFn: async () => {
      const params = filter === "all" ? {} : { status: filter };
      return (await api.get<OrgShipment[]>("/organizations/me/shipments", { params })).data;
    },
  });

  return (
    <div>
      <PageHeader
        title="Envíos"
        subtitle="Envíos creados por tu organización"
        action={isMerchant ? <CreateShipmentDialog /> : undefined}
      />

      {!isMerchant && (
        <div className="mb-4">
          <NotAvailableNotice>
            Tu organización es de tipo flota. La creación de envíos está
            disponible para organizaciones de tipo comercio.
          </NotAvailableNotice>
        </div>
      )}

      <div className="mb-4 flex items-center gap-2">
        <span className="text-sm text-ink-mute">Estado:</span>
        <Select value={filter} onValueChange={(v) => setFilter(v as StatusFilter)}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {SHIPMENT_STATUS_OPTIONS.map((s) => (
              <SelectItem key={s} value={s}>
                {shipmentStatusMeta(s).label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card className="overflow-hidden">
        {isLoading ? (
          <TableSkeleton rows={6} cols={6} />
        ) : isError ? (
          <ErrorState error={error} onRetry={() => refetch()} />
        ) : (data?.length ?? 0) === 0 ? (
          <EmptyState
            title={filter === "all" ? "Todavía no tenés envíos" : "Sin envíos en este estado"}
            description={
              isMerchant && filter === "all"
                ? "Creá tu primer envío para empezar a operar."
                : undefined
            }
            icon={<Package className="size-6" />}
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Paquete</TableHead>
                  <TableHead>Modalidad</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Precio</TableHead>
                  <TableHead className="text-right">CO₂</TableHead>
                  <TableHead>Creado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data!.map((s) => {
                  const meta = shipmentStatusMeta(s.status);
                  return (
                    <TableRow key={s.id}>
                      <TableCell className="tnum font-medium text-ink">#{s.id}</TableCell>
                      <TableCell className="text-ink-soft">
                        {packageSizeLabel(s.package_size)} · {formatKg(s.weight_kg)}
                      </TableCell>
                      <TableCell className="text-ink-soft">
                        <div className="leading-tight">
                          <div>{modalityLabel(s.modality)}</div>
                          <div className="text-xs text-ink-mute">
                            {assignmentModeLabel(s.assignment_mode)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge tone={meta.tone}>{meta.label}</Badge>
                      </TableCell>
                      <TableCell className="tnum text-right text-ink-soft">
                        {formatMoney(s.estimated_price)}
                      </TableCell>
                      <TableCell className="tnum text-right text-ink-soft">
                        {s.co2_savings_kg == null ? "—" : formatKg(s.co2_savings_kg)}
                      </TableCell>
                      <TableCell className="tnum text-ink-mute">
                        {formatDateTime(s.created_at)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  );
}

export function ShipmentsPage() {
  return <OrgGate>{(org) => <ShipmentsInner org={org} />}</OrgGate>;
}
