import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Building2, Loader2 } from "lucide-react";
import { api, apiErrorMessage } from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import { PageHeader } from "@/components/PageHeader";
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
import type { AdminCreateOrganizationResponse, OrgKind } from "@/types";

const KIND_OPTIONS: { value: OrgKind; label: string; hint: string }[] = [
  { value: "merchant", label: "Comercio / pyme", hint: "Usa DePaso para sus envíos" },
  { value: "fleet", label: "Fletero", hint: "Tiene transportistas propios" },
];

const EMPTY_FORM = { name: "", cuit: "", email: "", password: "", kind: "merchant" as OrgKind };

/** Alta manual (admin-only): crea de una la cuenta dueña + la organización B2B. */
export function AltasPage() {
  const toast = useToast();
  const [form, setForm] = useState(EMPTY_FORM);

  const mutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post<AdminCreateOrganizationResponse>("/admin/organizations", {
        name: form.name.trim(),
        cuit: form.cuit.trim(),
        email: form.email.trim(),
        password: form.password,
        kind: form.kind,
      });
      return data;
    },
    onSuccess: (data) => {
      toast.success(`Cuenta creada: ${data.name} (${data.owner_email})`);
      setForm(EMPTY_FORM);
    },
    onError: (err) => toast.error(apiErrorMessage(err, "No se pudo crear la cuenta")),
  });

  return (
    <div>
      <PageHeader
        title="Altas"
        subtitle="Alta manual de cuentas B2B: comercios/pymes y fleteros"
      />

      <div className="mx-auto max-w-lg">
        <Card>
          <CardHeader>
            <div className="mb-2 flex size-11 items-center justify-center rounded-xl bg-mint text-forest-deep">
              <Building2 className="size-6" />
            </div>
            <CardTitle>Nueva cuenta B2B</CardTitle>
            <p className="text-sm text-ink-mute">
              Creá el usuario dueño y su organización de una sola vez. La cuenta
              queda lista para operar con el email y la contraseña que definas acá.
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
                <Label htmlFor="altas-name">Nombre de la empresa</Label>
                <Input
                  id="altas-name"
                  placeholder="Logística del Sur S.A."
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="altas-cuit">CUIT</Label>
                <Input
                  id="altas-cuit"
                  placeholder="30-71234567-8"
                  value={form.cuit}
                  onChange={(e) => setForm((f) => ({ ...f, cuit: e.target.value }))}
                  required
                />
                <p className="text-xs text-ink-mute">Formato: 30-71234567-8</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="altas-email">Email</Label>
                <Input
                  id="altas-email"
                  type="email"
                  placeholder="contacto@empresa.com"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="altas-password">Contraseña</Label>
                <Input
                  id="altas-password"
                  type="password"
                  placeholder="Mínimo 8 caracteres"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  minLength={8}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Tipo de organización</Label>
                <Select
                  value={form.kind}
                  onValueChange={(v) => setForm((f) => ({ ...f, kind: v as OrgKind }))}
                >
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
                Crear cuenta
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
