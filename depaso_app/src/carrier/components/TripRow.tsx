import { View } from "react-native";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { CarrierRoute } from "@/src/shared/types";
import { useAddress } from "@/src/shared/hooks/useAddress";
import { T } from "@/constants/tokens";

/** Published collaborative trip card (offline state). */
export function TripRow({ route }: { route: CarrierRoute }) {
  const origAddr = useAddress(route.origin_lat, route.origin_lon);
  const destAddr = useAddress(route.destination_lat ?? route.origin_lat, route.destination_lon ?? route.origin_lon);
  return (
    <View className="bg-card border border-border rounded-2xl px-[14px] py-3">
      <View className="flex-row items-center gap-2 mb-[10px]">
        <MaterialCommunityIcons
          name={route.kind === "dedicated_window" ? "calendar-clock" : "map-marker-path"}
          size={14}
          color={T.emeraldDeep}
        />
        <Text className="text-[11px] tracking-[1px] text-inkMute font-bold uppercase">
          {route.kind === "dedicated_window" ? "Ventana dedicada" : "Ruta habitual"}
        </Text>
      </View>
      <View className="flex-row items-center">
        <View className="flex-row items-center gap-[6px] flex-1 min-w-0">
          <View className="w-[9px] h-[9px] rounded-full border-2 border-forest bg-card" />
          <Text className="text-[13px] text-ink font-medium flex-1" numberOfLines={1}>{origAddr}</Text>
        </View>
        <MaterialCommunityIcons name="dots-horizontal" size={16} color={T.inkFaint} />
        <View className="flex-row items-center gap-[6px] flex-1 min-w-0 justify-end">
          <Text className="text-[13px] text-ink font-medium flex-1 text-right" numberOfLines={1}>{destAddr}</Text>
          <View className="w-[9px] h-[9px] rounded-[2px] bg-emerald rotate-45" />
        </View>
      </View>
      {route.recurrence_days && (
        <Text className="text-[10px] tracking-[1px] text-inkMute uppercase mt-2">{route.recurrence_days.replace(/,/g, " · ")}</Text>
      )}
    </View>
  );
}
