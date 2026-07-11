import type { ComponentProps } from "react";
import type { MaterialCommunityIcons } from "@expo/vector-icons";
import { TransportType } from "../types";

type IconName = ComponentProps<typeof MaterialCommunityIcons>["name"];

/** Catálogo de vehículos del cadete — usado en el registro y en la
 * creación tardía del perfil (si falló durante el alta). */
export const VEHICLES: { type: TransportType; label: string; icon: IconName; capacityKg: number }[] = [
  { type: TransportType.PEDESTRIAN, label: "A pie",     icon: "walk",        capacityKg: 5 },
  { type: TransportType.BIKE,       label: "Bici",      icon: "bike",        capacityKg: 8 },
  { type: TransportType.MOTORCYCLE, label: "Moto",      icon: "motorbike",   capacityKg: 15 },
  { type: TransportType.CAR,        label: "Auto",      icon: "car",         capacityKg: 80 },
  { type: TransportType.VAN,        label: "Camioneta", icon: "van-utility", capacityKg: 600 },
  { type: TransportType.TRUCK,      label: "Camión",    icon: "truck",       capacityKg: 2000 },
];

/** Movilidad blanda no lleva patente (espejo de MOTORIZED_VEHICLES del backend). */
export function vehicleNeedsPlate(type: TransportType): boolean {
  return ![TransportType.PEDESTRIAN, TransportType.BIKE].includes(type);
}
