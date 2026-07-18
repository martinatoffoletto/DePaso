import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Loader2, PauseCircle, PlayCircle } from "lucide-react";
import { api, apiErrorMessage } from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Carrier, ModerationAction } from "@/types";

export function CarriersPage() {
  const qc = useQueryClient();
  const toast = useToast();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["admin", "carriers", "pending"],
    queryFn: async () => (await api.get<Carrier[]>("/admin/carriers/pending")).data,
    refetchInterval: 30_000,
  });

  const mutation = useMutation({
    mutationFn: async ({ id, action }: { id: number; action: ModerationAction }) =>
      (await api.patch<Carrier>(`/admin/carriers/${id}`, { action })).data,
    onSuccess: (_res, vars) => {
      const verb =
        vars.action === "verify"
          ? "verificado"
          : vars.action === "suspend"
            ? "suspendido"
            : "reactivado";
      toast.success(`Transportista ${verb}`);
      qc.invalidateQueries({ queryKey: ["admin", "carriers", "pending"] });
      qc.invalidateQueries({ queryKey: ["admin", "dashboard"] });
    },
    onError: (err) => toast.error(apiErrorMessage(err, "No se pudo moderar")),
  });

  const busy = (id: number) => mutation.isPending && mutation.variables?.id === id;

  return (
    <div>
      <PageHeader
        title="Transportistas"
        subtitle="Aprobá, suspendé o reactivá transportistas esperando verificación"
      />

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <TableSkeleton rows={4} cols={3} />
          ) : isError ? (
            <ErrorState error={error} onRetry={() => refetch()} />
          ) : (data?.length ?? 0) === 0 ? (
            <EmptyState
              title="No hay transportistas pendientes"
              description="Todas las verificaciones están al día."
              icon={<CheckCircle2 className="size-6" />}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Transportista</TableHead>
                  <TableHead>Vehículo</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data!.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-ink">{c.company_name}</span>
                        {!c.is_active && <Badge tone="red">Suspendido</Badge>}
                      </div>
                    </TableCell>
                    <TableCell className="text-ink-soft">
                      {c.vehicle_type} · {c.license_plate}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          disabled={busy(c.id)}
                          onClick={() => mutation.mutate({ id: c.id, action: "verify" })}
                        >
                          {busy(c.id) ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <CheckCircle2 className="size-4" />
                          )}
                          Verificar
                        </Button>
                        {c.is_active ? (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={busy(c.id)}
                            onClick={() => mutation.mutate({ id: c.id, action: "suspend" })}
                          >
                            <PauseCircle className="size-4" /> Suspender
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={busy(c.id)}
                            onClick={() => mutation.mutate({ id: c.id, action: "reactivate" })}
                          >
                            <PlayCircle className="size-4" /> Reactivar
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
