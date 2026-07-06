import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus } from "lucide-react";
import { api, apiErrorMessage } from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { OrgShipment, OrgShipmentCreate } from "@/types";

type PackageSize = OrgShipmentCreate["package_size"];
type Modality = OrgShipmentCreate["modality"];
type AssignmentMode = OrgShipmentCreate["assignment_mode"];

const SIZE_OPTIONS: { value: PackageSize; label: string }[] = [
  { value: "s", label: "Chico" },
  { value: "m", label: "Mediano" },
  { value: "l", label: "Grande" },
  { value: "xl", label: "Mudanza (XL)" },
];

interface FormState {
  package_size: PackageSize;
  modality: Modality;
  assignment_mode: AssignmentMode;
  origin_lat: string;
  origin_lon: string;
  destination_lat: string;
  destination_lon: string;
  weight_kg: string;
  description: string;
}

const INITIAL: FormState = {
  package_size: "m",
  modality: "collaborative",
  assignment_mode: "on_demand",
  origin_lat: "",
  origin_lon: "",
  destination_lat: "",
  destination_lon: "",
  weight_kg: "",
  description: "",
};

export function CreateShipmentDialog() {
  const qc = useQueryClient();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(INITIAL);

  // Regla de dominio: las mudanzas (XL) son siempre dedicadas.
  const forcedDedicated = form.package_size === "xl";
  const modality: Modality = forcedDedicated ? "dedicated" : form.modality;

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const mutation = useMutation({
    mutationFn: async () => {
      const payload: OrgShipmentCreate = {
        package_size: form.package_size,
        modality,
        assignment_mode: form.assignment_mode,
        origin_lat: Number(form.origin_lat),
        origin_lon: Number(form.origin_lon),
        destination_lat: Number(form.destination_lat),
        destination_lon: Number(form.destination_lon),
        weight_kg: Number(form.weight_kg),
        description: form.description.trim() || null,
      };
      return (await api.post<OrgShipment>("/organizations/me/shipments", payload)).data;
    },
    onSuccess: () => {
      toast.success("Envío creado");
      qc.invalidateQueries({ queryKey: ["org", "shipments"] });
      qc.invalidateQueries({ queryKey: ["org", "dashboard"] });
      setForm(INITIAL);
      setOpen(false);
    },
    onError: (err) => toast.error(apiErrorMessage(err, "No se pudo crear el envío")),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" /> Nuevo envío
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nuevo envío</DialogTitle>
          <DialogDescription>
            Programá un envío para tu organización. Las coordenadas son de retiro
            y entrega.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate();
          }}
        >
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Tamaño</Label>
              <Select
                value={form.package_size}
                onValueChange={(v) => set("package_size", v as PackageSize)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SIZE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="weight">Peso (kg)</Label>
              <Input
                id="weight"
                type="number"
                min="0.1"
                step="0.1"
                value={form.weight_kg}
                onChange={(e) => set("weight_kg", e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Modalidad</Label>
              <Select
                value={modality}
                onValueChange={(v) => set("modality", v as Modality)}
                disabled={forcedDedicated}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="collaborative">Colaborativo</SelectItem>
                  <SelectItem value="dedicated">Dedicado</SelectItem>
                </SelectContent>
              </Select>
              {forcedDedicated && (
                <p className="text-xs text-ink-mute">Las mudanzas son siempre dedicadas.</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Asignación</Label>
              <Select
                value={form.assignment_mode}
                onValueChange={(v) => set("assignment_mode", v as AssignmentMode)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="on_demand">A demanda</SelectItem>
                  <SelectItem value="by_availability">Por disponibilidad</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <fieldset className="space-y-2 rounded-lg border border-line p-3">
            <legend className="px-1 text-xs font-medium text-ink-mute">Retiro</legend>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="olat">Latitud</Label>
                <Input
                  id="olat"
                  type="number"
                  step="any"
                  placeholder="-34.6037"
                  value={form.origin_lat}
                  onChange={(e) => set("origin_lat", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="olon">Longitud</Label>
                <Input
                  id="olon"
                  type="number"
                  step="any"
                  placeholder="-58.3816"
                  value={form.origin_lon}
                  onChange={(e) => set("origin_lon", e.target.value)}
                  required
                />
              </div>
            </div>
          </fieldset>

          <fieldset className="space-y-2 rounded-lg border border-line p-3">
            <legend className="px-1 text-xs font-medium text-ink-mute">Entrega</legend>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="dlat">Latitud</Label>
                <Input
                  id="dlat"
                  type="number"
                  step="any"
                  placeholder="-34.5885"
                  value={form.destination_lat}
                  onChange={(e) => set("destination_lat", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="dlon">Longitud</Label>
                <Input
                  id="dlon"
                  type="number"
                  step="any"
                  placeholder="-58.3974"
                  value={form.destination_lon}
                  onChange={(e) => set("destination_lon", e.target.value)}
                  required
                />
              </div>
            </div>
          </fieldset>

          <div className="space-y-1.5">
            <Label htmlFor="desc">Descripción (opcional)</Label>
            <Input
              id="desc"
              placeholder="Contenido del paquete"
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
            />
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
              Crear envío
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
