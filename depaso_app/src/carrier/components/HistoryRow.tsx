import { View } from "react-native";
import { Text } from "react-native-paper";
import { Shipment, ShipmentStatus } from "@/src/shared/types";
import { carrierPayout } from "@/src/shared/utils/payout";
import { useAddress } from "@/src/shared/hooks/useAddress";
import { PACKAGE_LABEL_SHORT as SIZE_LABEL } from "@/src/shared/utils/packageCategory";
import { T } from "@/constants/tokens";

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("es-AR", { day: "numeric", month: "short" }) +
    " · " + d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
}

/** Fila del historial del cadete: envío entregado o cancelado. */
export function HistoryRow({ shipment }: { shipment: Shipment }) {
  const origAddr = useAddress(shipment.origin_lat, shipment.origin_lon);
  const destAddr = useAddress(shipment.destination_lat, shipment.destination_lon);
  const delivered = shipment.status === ShipmentStatus.DELIVERED;
  return (
    <View className="bg-card rounded-2xl border border-borderSoft p-[14px]">
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center gap-2">
          <View className="w-[9px] h-[9px] rounded-full" style={{ backgroundColor: delivered ? T.emerald : T.red }} />
          <Text className="text-[10px] tracking-[1.5px] text-inkMute font-bold">DP-{String(shipment.id).padStart(4, "0")}</Text>
          <View className={`rounded-md px-[7px] py-[2px] ${delivered ? "bg-mint" : "bg-cardSoft"}`}>
            <Text className={`text-[9px] tracking-[1px] font-bold uppercase ${delivered ? "text-emeraldDeep" : "text-red"}`}>
              {delivered ? "Entregado" : "Cancelado"}
            </Text>
          </View>
        </View>
        {shipment.estimated_price != null && delivered && (
          <Text className="text-sm font-bold text-emeraldDeep">+${Math.round(carrierPayout(shipment.estimated_price)).toLocaleString("es-AR")}</Text>
        )}
      </View>
      <View className="gap-[5px] mb-2">
        <View className="flex-row items-center gap-[8px]">
          <View className="w-[8px] h-[8px] rounded-full border-2 border-forest bg-card" />
          <Text className="flex-1 text-[12.5px] text-ink font-medium" numberOfLines={1}>{origAddr}</Text>
        </View>
        <View className="flex-row items-center gap-[8px]">
          <View className="w-[8px] h-[8px] rounded-[2px] bg-emerald rotate-45" />
          <Text className="flex-1 text-[12.5px] text-ink font-medium" numberOfLines={1}>{destAddr}</Text>
        </View>
      </View>
      <Text className="text-[10.5px] text-inkMute">
        {SIZE_LABEL[shipment.package_size]} · {shipment.weight_kg} kg · {formatDate(shipment.updated_at)}
      </Text>
    </View>
  );
}
