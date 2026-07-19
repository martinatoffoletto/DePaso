import { View, TouchableOpacity, Text } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { CarrierRoute } from "@/src/shared/types";
import { parseApiDate } from "@/src/shared/utils/dates";
import { T } from "@/constants/tokens";
import { RouteAddress } from "./RouteAddress";

/** Fila de una ruta/ventana publicada, con baja opcional (tachito). */
export function PublishedRouteRow({ route: r, onRemove }: {
  route: CarrierRoute;
  onRemove?: () => void;
}) {
  return (
    <View className="flex-row items-center gap-3 bg-card rounded-[14px] border border-borderSoft p-3">
      <View className="w-[34px] h-[34px] rounded-[10px] bg-mint items-center justify-center border border-border">
        <MaterialCommunityIcons
          name={r.kind === "dedicated_window" ? "calendar-clock" : r.recurrence_days ? "repeat" : "calendar-star"}
          size={16}
          color={T.forest}
        />
      </View>
      <View className="flex-1">
        {r.destination_lat != null && r.destination_lon != null ? (
          <View className="flex-row items-center gap-1">
            <RouteAddress lat={r.origin_lat} lon={r.origin_lon} />
            <MaterialCommunityIcons name="arrow-right" size={12} color={T.inkMute} />
            <RouteAddress lat={r.destination_lat} lon={r.destination_lon} />
          </View>
        ) : (
          <RouteAddress lat={r.origin_lat} lon={r.origin_lon} />
        )}
        {r.recurrence_days ? (
          <Text className="text-[10px] tracking-[0.5px] text-inkMute mt-1">{r.recurrence_days.toUpperCase()}</Text>
        ) : (
          <Text className="text-[10px] tracking-[0.5px] text-inkMute mt-1">
            {parseApiDate(r.window_start).toLocaleDateString("es-AR")}{" "}
            {parseApiDate(r.window_start).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
            {" → "}
            {parseApiDate(r.window_end).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
          </Text>
        )}
      </View>
      {onRemove && (
        <TouchableOpacity onPress={onRemove} hitSlop={10} className="p-1" accessibilityLabel="Eliminar viaje">
          <MaterialCommunityIcons name="trash-can-outline" size={18} color={T.red} />
        </TouchableOpacity>
      )}
    </View>
  );
}
