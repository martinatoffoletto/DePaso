import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Building2, Loader2 } from "lucide-react";
import { api, apiErrorMessage } from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { MyOrganization, OrgKind } from "@/types";

const KIND_OPTIONS: { value: OrgKind; label: string; hint: string }[] = [
  { value: "merchant", label: "Comercio", hint: "Usás DePaso para tus envíos" },
  { value: "fleet", label: "Flota", hint: "Tenés transportistas propios" },
];

/** Onboarding: crea una organización y el usuario queda como owner. */
export function CreateOrgCard() {
  const qc = useQueryClient();
  const toast = useToast();
  const [name, setName] = useState("");
  const [cuit, setCuit] = useState("");
  const [kind, setKind] = useState<OrgKind>("merchant");

  const mutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post<MyOrganization>("/organizations", {
        name: name.trim(),
        cuit: cuit.trim(),
        kind,
      });
      return data;
    },
    onSuccess: () => {
      toast.success("Organización creada");
      qc.invalidateQueries({ queryKey: ["org"] });
    },
    onError: (err) => toast.error(apiErrorMessage(err, "No se pudo crear la organización")),
  });

  return (
    <div className="mx-auto max-w-lg py-8">
      <Card>
        <CardHeader>
          <div className="mb-2 flex size-11 items-center justify-center rounded-xl bg-mint text-forest-deep">
            <Building2 className="size-6" />
          </div>
          <CardTitle>Creá tu organización</CardTitle>
          <p className="text-sm text-ink-mute">
            Todavía no administrás ninguna pyme. Registrá los datos de tu empresa
            para empezar a operar en el panel.
          </p>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              mutation.mutate();
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="org-name">Nombre de la empresa</Label>
              <Input
                id="org-name"
                placeholder="Logística del Sur S.A."
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="org-cuit">CUIT</Label>
              <Input
                id="org-cuit"
                placeholder="30-71234567-8"
                value={cuit}
                onChange={(e) => setCuit(e.target.value)}
                required
              />
              <p className="text-xs text-ink-mute">Formato: 30-71234567-8</p>
            </div>
            <div className="space-y-1.5">
              <Label>Tipo de organización</Label>
              <Select value={kind} onValueChange={(v) => setKind(v as OrgKind)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {KIND_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label} — {o.hint}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
              Crear organización
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
