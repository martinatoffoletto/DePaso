import type { BadgeProps } from "@/components/ui/badge";
import type { OrgCarrierStatus, ShipmentStatus } from "@/types";

type Tone = NonNullable<BadgeProps["tone"]>;

/* Etiquetas en español rioplatense + tono de badge para cada estado de envío. */
const SHIPMENT_STATUS: Record<ShipmentStatus, { label: string; tone: Tone }> = {
  pending: { label: "Pendiente", tone: "amber" },
  assigned: { label: "Asignado", tone: "sky" },
  pickup_arrived: { label: "En retiro", tone: "violet" },
  in_transit: { label: "En tránsito", tone: "forest" },
  delivered: { label: "Entregado", tone: "emerald" },
  cancelled: { label: "Cancelado", tone: "red" },
};

export function shipmentStatusMeta(status: ShipmentStatus) {
  return SHIPMENT_STATUS[status] ?? { label: status, tone: "neutral" as Tone };
}

export const SHIPMENT_STATUS_OPTIONS: ShipmentStatus[] = [
  "pending",
  "assigned",
  "pickup_arrived",
  "in_transit",
  "delivered",
  "cancelled",
];

const CARRIER_LINK_STATUS: Record<OrgCarrierStatus, { label: string; tone: Tone }> = {
  active: { label: "Activo", tone: "emerald" },
  inactive: { label: "Inactivo", tone: "neutral" },
};

export function carrierLinkStatusMeta(status: OrgCarrierStatus) {
  return CARRIER_LINK_STATUS[status] ?? { label: status, tone: "neutral" as Tone };
}

const PACKAGE_SIZE_LABEL: Record<string, string> = {
  s: "Chico",
  m: "Mediano",
  l: "Grande",
  xl: "Mudanza",
};

export function packageSizeLabel(size: string): string {
  return PACKAGE_SIZE_LABEL[size] ?? size.toUpperCase();
}

export function modalityLabel(modality: string): string {
  return modality === "dedicated" ? "Dedicado" : "Colaborativo";
}

export function assignmentModeLabel(mode: string): string {
  return mode === "on_demand" ? "A demanda" : "Por disponibilidad";
}

const ORG_KIND_LABEL: Record<string, string> = {
  fleet: "Flota",
  merchant: "Comercio",
};

export function orgKindLabel(kind: string): string {
  return ORG_KIND_LABEL[kind] ?? kind;
}
