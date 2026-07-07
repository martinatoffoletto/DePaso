import { useEffect, useState } from "react";
import { View } from "react-native";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { PackageCategory, Shipment, ShipmentStatus } from "@/src/types";
import { reverseGeocode } from "@/src/utils/geocoding";
import { T } from "@/constants/tokens";

/**
 * Presentational helpers shared by the shipment cards and the detail modal.
 * Extracted from ShipmentsScreen to keep that file focused on screen state.
 */

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>["name"];

export const CADETE_COLORS = [T.amber, T.violet, T.emerald, T.sky];

const STATUS_ORDER = [
  ShipmentStatus.ASSIGNED,
  ShipmentStatus.PICKUP_ARRIVED,
  ShipmentStatus.IN_TRANSIT,
  ShipmentStatus.DELIVERED,
];
const STEP_LABELS = ["Asignado", "Retiro", "En viaje", "Entrega"];

/** Reverse-geocodes coords to a human address, with the coords as a placeholder. */
export function useAddress(lat: number, lon: number): string {
  const [addr, setAddr] = useState(`${lat.toFixed(3)}, ${lon.toFixed(3)}`);
  useEffect(() => {
    let alive = true;
    reverseGeocode(lat, lon).then(r => { if (alive) setAddr(r); });
    return () => { alive = false; };
  }, [lat, lon]);
  return addr;
}

export function timelineSteps(status: ShipmentStatus) {
  const idx = STATUS_ORDER.indexOf(status);
  return STEP_LABELS.map((label, i) => ({
    label,
    done: idx > i || status === ShipmentStatus.DELIVERED,
    active: idx === i && status !== ShipmentStatus.DELIVERED,
  }));
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("es-AR", { day: "numeric", month: "short" }).toUpperCase();
}

function thumbIcon(cat: PackageCategory): IconName {
  if (cat === PackageCategory.S) return "email-outline";
  if (cat === PackageCategory.L || cat === PackageCategory.XL) return "cube-outline";
  return "package-variant";
}

export function carrierInitials(name?: string): string {
  if (!name) return "CA";
  return name.split(" ").filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase() || "CA";
}

export function liveMapRegion(s: Shipment) {
  const lat1 = s.origin_lat, lat2 = s.destination_lat;
  const lon1 = s.origin_lon, lon2 = s.destination_lon;
  return {
    latitude: (lat1 + lat2) / 2,
    longitude: (lon1 + lon2) / 2,
    latitudeDelta: Math.abs(lat1 - lat2) * 2.5 + 0.02,
    longitudeDelta: Math.abs(lon1 - lon2) * 2.5 + 0.02,
  };
}

export function PackageThumb({ category, size = 56 }: { category?: PackageCategory; size?: number }) {
  return (
    <View className="rounded-xl bg-cardSoft border border-borderSoft items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <MaterialCommunityIcons
        name={category ? thumbIcon(category) : "package-variant"}
        size={Math.round(size * 0.45)}
        color="rgba(11,59,46,0.28)"
      />
    </View>
  );
}

export function AvatarBubble({ initials, color, size = 32 }: { initials: string; color: string; size?: number }) {
  return (
    <View className="items-center justify-center shrink-0" style={{ width: size, height: size, borderRadius: size, backgroundColor: color }}>
      <Text style={{ fontSize: Math.round(size * 0.38), fontWeight: "700", color: "#F4EFE3" }}>{initials}</Text>
    </View>
  );
}

export function MiniRouteLine({ origin, destination }: { origin: string; destination: string }) {
  return (
    <View className="flex-row items-center">
      <View className="flex-row items-center gap-[6px] flex-1 overflow-hidden">
        <View className="w-2 h-2 rounded-full border-[1.8px] border-forest bg-card shrink-0" />
        <Text className="text-[12.5px] text-ink font-medium" numberOfLines={1}>{origin}</Text>
      </View>
      <View className="flex-row items-center gap-[2px] px-2">
        {[0.4, 0.7, 1.0].map((op, i) => (
          <View key={i} className="w-[3px] h-[3px] rounded-full bg-inkFaint" style={{ opacity: op }} />
        ))}
      </View>
      <View className="flex-row items-center gap-[6px] flex-1 justify-end overflow-hidden">
        <Text className="text-[12.5px] text-ink font-medium" numberOfLines={1}>{destination}</Text>
        <View className="w-2 h-2 rounded-[2px] bg-emerald rotate-45 shrink-0" />
      </View>
    </View>
  );
}

/** Shared progress-timeline row (used by the live card and the detail modal). */
export function StatusTimeline({ steps, dotBase }: { steps: ReturnType<typeof timelineSteps>; dotBase: number }) {
  const doneCount = steps.filter(st => st.done).length;
  return (
    <View className="flex-row items-start relative">
      <View className="absolute left-[22px] right-[22px] h-[2px] bg-border rounded-[2px]" style={{ top: dotBase / 2 + 1 }} />
      <View className="absolute left-[22px] h-[2px] bg-emerald rounded-[2px]" style={{ top: dotBase / 2 + 1, width: `${Math.max(0, doneCount * 30)}%` }} />
      {steps.map((step, i) => (
        <View key={i} className="flex-1 items-center" style={{ gap: dotBase <= 10 ? 4 : 6 }}>
          <View
            className="items-center justify-center"
            style={{
              width: step.active ? dotBase + 4 : dotBase, height: step.active ? dotBase + 4 : dotBase,
              borderRadius: (dotBase + 4) / 2,
              backgroundColor: step.done ? T.emerald : step.active ? T.card : T.bg,
              borderWidth: step.active ? 2.5 : step.done ? 0 : 2,
              borderColor: step.active ? T.emerald : T.border,
            }}
          >
            {step.done && <MaterialCommunityIcons name="check" size={dotBase <= 10 ? 6 : 7} color="#F4EFE3" />}
          </View>
          <Text
            className="text-center"
            style={{ fontSize: dotBase <= 10 ? 10.5 : 11, color: step.active ? T.ink : step.done ? T.inkSoft : T.inkFaint, fontWeight: step.active ? "700" : step.done ? "500" : "400" }}
            numberOfLines={1}
          >
            {step.label}
          </Text>
        </View>
      ))}
    </View>
  );
}
