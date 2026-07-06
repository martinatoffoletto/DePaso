import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, SlidersHorizontal } from "lucide-react";
import { api, apiErrorMessage } from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorState } from "@/components/states";
import { Skeleton } from "@/components/ui/skeleton";
import type { MatchingWeights, WeightKey } from "@/types";

const WEIGHT_LABELS: Record<WeightKey, string> = {
  geo: "Geografía",
  detour: "Desvío",
  cargo: "Compatibilidad de carga",
  reputation: "Reputación",
  time_window: "Ventana horaria",
};

const KEYS: WeightKey[] = ["geo", "detour", "cargo", "reputation", "time_window"];

export function MatchingWeightsCard() {
  const qc = useQueryClient();
  const toast = useToast();
  const [draft, setDraft] = useState<MatchingWeights | null>(null);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["matching", "weights"],
    queryFn: async () => (await api.get<MatchingWeights>("/matching/weights")).data,
  });

  useEffect(() => {
    if (data) setDraft(data);
  }, [data]);

  const mutation = useMutation({
    mutationFn: async (weights: MatchingWeights) =>
      (await api.patch<MatchingWeights>("/matching/weights", weights)).data,
    onSuccess: (fresh) => {
      toast.success("Pesos actualizados");
      qc.setQueryData(["matching", "weights"], fresh);
      setDraft(fresh);
    },
    onError: (err) => toast.error(apiErrorMessage(err, "No se pudieron guardar los pesos")),
  });

  const sum = draft ? KEYS.reduce((acc, k) => acc + draft[k], 0) : 0;
  const balanced = Math.abs(sum - 1) < 0.001;
  const dirty = draft != null && data != null && KEYS.some((k) => draft[k] !== data[k]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <SlidersHorizontal className="size-4.5 text-forest" />
          Pesos del algoritmo de matching
        </CardTitle>
        <p className="text-sm text-ink-mute">
          Los pesos deben sumar 1. Ajustan la importancia de cada factor en el ranking
          de transportistas.
        </p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {KEYS.map((k) => (
              <Skeleton key={k} className="h-10 w-full" />
            ))}
          </div>
        ) : isError ? (
          <ErrorState error={error} onRetry={() => refetch()} />
        ) : draft ? (
          <div className="space-y-4">
            {KEYS.map((k) => (
              <div key={k} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-ink">{WEIGHT_LABELS[k]}</span>
                  <span className="tnum text-ink-soft">{draft[k].toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={draft[k]}
                  onChange={(e) =>
                    setDraft((d) => (d ? { ...d, [k]: Number(e.target.value) } : d))
                  }
                  className="w-full accent-forest"
                />
              </div>
            ))}

            <div className="flex items-center justify-between border-t border-line pt-3">
              <span
                className={`tnum text-sm font-medium ${
                  balanced ? "text-emerald-deep" : "text-red"
                }`}
              >
                Suma: {sum.toFixed(2)} {balanced ? "✓" : "(debe ser 1,00)"}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={!dirty || mutation.isPending}
                  onClick={() => data && setDraft(data)}
                >
                  Descartar
                </Button>
                <Button
                  size="sm"
                  disabled={!dirty || !balanced || mutation.isPending}
                  onClick={() => draft && mutation.mutate(draft)}
                >
                  {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
                  Guardar
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
