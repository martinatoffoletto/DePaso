import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus } from "lucide-react";
import { api, apiErrorMessage } from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import { AddressAutocomplete } from "@/components/AddressAutocomplete";
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
import type { AddressSuggestion } from "@/lib/addressSearch";
import type { OrgShipment, OrgShipmentCreate } from "@/types";

type PackageSize = OrgShipmentCreate["package_size"];
type Modality = OrgShipmentCreate["modality"];
type AssignmentMode = OrgShipmentCreate["assignment_mode"];

// Espejo de shared/cargo.py (MAX_WEIGHT_KG / XL_MIN_WEIGHT_KG): mismos topes
// que valida el backend, para avisar antes del 400.
const WEIGHT_LIMITS: Record<PackageSize, { min: number; max: number; hint: string }> = {
  s: { min: 0.1, max: 3, hint: "hasta 3 kg" },
  m: { min: 0.1, max: 10, hint: "hasta 10 kg" },
  l: { min: 0.1, max: 30, hint: "hasta 30 kg" },
  xl: { min: 30, max: 2000, hint: "desde 30 kg" },
};

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
  origin: AddressSuggestion | null;
  destination: AddressSuggestion | null;
  weight_kg: string;
  description: string;
  recipient_name: string;
  recipient_phone: string;
}

const INITIAL: FormState = {
  package_size: "m",
  modality: "collaborative",
  assignment_mode: "on_demand",
  origin: null,
  destination: null,
  weight_kg: "",
  description: "",
  recipient_name: "",
  recipient_phone: "",
};

export function CreateShipmentDialog() {
  const qc = useQueryClient();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(INITIAL);

  // Regla de dominio: las mudanzas (XL) son siempre dedicadas.
  const forcedDedicated = form.package_size === "xl";
  const modality: Modality = forcedDedicated ? "dedicated" : form.modality;
  const weightLimit = WEIGHT_LIMITS[form.package_size];

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const mutation = useMutation({
    mutationFn: async () => {
      if (!form.origin || !form.destination) {
        throw new Error("Elegí una dirección de las sugerencias.");
      }
      const payload: OrgShipmentCreate = {
        package_size: form.package_size,
        modality,
        assignment_mode: form.assignment_mode,
        origin_lat: form.origin.lat,
        origin_lon: form.origin.lon,
        destination_lat: form.destination.lat,
        destination_lon: form.destination.lon,
        weight_kg: Number(form.weight_kg),
        description: form.description.trim() || null,
        recipient_name: form.recipient_name.trim() || null,
        recipient_phone: form.recipient_phone.trim() || null,
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
            Programá un envío para tu organización. Buscá las direcciones de
            retiro y entrega.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!form.origin || !form.destination) {
              toast.error("Elegí las direcciones desde las sugerencias.");
              return;
            }
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
                      {o.label} — {WEIGHT_LIMITS[o.value].hint}
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
                min={weightLimit.min}
                max={weightLimit.max}
                step="0.1"
                value={form.weight_kg}
                onChange={(e) => set("weight_kg", e.target.value)}
                required
              />
              <p className="text-xs text-ink-mute">
                {SIZE_OPTIONS.find((o) => o.value === form.package_size)?.label}:{" "}
                {weightLimit.hint}
              </p>
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

          <div className="space-y-1.5">
            <Label htmlFor="origin">Dirección de retiro</Label>
            <AddressAutocomplete
              id="origin"
              placeholder="Av. Corrientes 1234"
              value={form.origin}
              onChange={(v) => set("origin", v)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="destination">Dirección de entrega</Label>
            <AddressAutocomplete
              id="destination"
              placeholder="Cabildo 2500"
              value={form.destination}
              onChange={(v) => set("destination", v)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="rname">Quién recibe</Label>
              <Input
                id="rname"
                placeholder="Nombre y apellido"
                maxLength={120}
                value={form.recipient_name}
                onChange={(e) => set("recipient_name", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rphone">Teléfono de contacto</Label>
              <Input
                id="rphone"
                type="tel"
                placeholder="+54 9 11 ..."
                maxLength={30}
                value={form.recipient_phone}
                onChange={(e) => set("recipient_phone", e.target.value)}
              />
            </div>
          </div>

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
