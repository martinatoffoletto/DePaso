import { View, TouchableOpacity } from "react-native";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { DeliveryMode, Shipment } from "@/src/shared/types";
import { PACKAGE_LABEL_SHORT as SIZE_LABEL } from "@/src/shared/utils/packageCategory";
import { T } from "@/constants/tokens";
import { AvatarBubble, MiniRouteLine, PackageThumb, StatusTimeline, timelineSteps, useAddress } from "./shipmentsUi";

/** Card de un envío activo en la lista "En curso". */
export function LiveShipmentCard({ shipment, onPress }: { shipment: Shipment; onPress: () => void }) {
  const isCollab = shipment.modality === DeliveryMode.COLLABORATIVE;
  const sizeLabel = SIZE_LABEL[shipment.package_size] ?? "Paquete";
  const steps = timelineSteps(shipment.status);
  const origAddr = useAddress(shipment.origin_lat, shipment.origin_lon);
  const destAddr = useAddress(shipment.destination_lat, shipment.destination_lon);

  return (
    <TouchableOpacity
      className="bg-card rounded-[22px] border border-border overflow-hidden"
      style={{ shadowColor: T.forest, shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.18, shadowRadius: 32, elevation: 4 }}
      onPress={onPress}
      activeOpacity={0.95}
    >
      {/* Route header */}
      <View className="p-[14px] border-b border-borderSoft">
        <View className="flex-row items-center justify-between mb-[10px]">
          <View className="flex-row items-center gap-[6px] bg-forest px-[9px] py-[5px] rounded-lg">
            <View className="w-2 h-2 rounded-full bg-lime" />
            <Text className="text-[9.5px] tracking-[1.2px] font-bold text-lime uppercase">EN CURSO</Text>
          </View>
          <View className="flex-row items-center gap-2">
            <View className="flex-row items-center gap-[5px] bg-cardSoft border border-border px-2 py-[5px] rounded-lg">
              <MaterialCommunityIcons name="clock-outline" size={11} color={T.forest} />
              <Text className="text-[9.5px] text-inkSoft font-semibold">En camino</Text>
            </View>
            <View className="bg-cardSoft border border-border px-2 py-[5px] rounded-lg">
              <Text className="text-[9.5px] tracking-[1px] text-ink font-bold">DP-{String(shipment.id).padStart(4, "0")}</Text>
            </View>
          </View>
        </View>
        <MiniRouteLine origin={origAddr} destination={destAddr} />
        <View className="mt-2">
          <View className="bg-cardSoft border border-borderSoft rounded-lg px-2 py-1 self-start">
            <Text className="text-[9.5px] tracking-[1px] text-inkSoft font-bold uppercase">{shipment.weight_kg} KG</Text>
          </View>
        </View>
      </View>

      {/* Progress timeline */}
      <View className="px-4 pt-[14px] pb-3 border-b border-borderSoft">
        <StatusTimeline steps={steps} dotBase={10} />
      </View>

      {/* Package row */}
      <View className="flex-row items-center gap-3 px-4 py-3 border-b border-borderSoft">
        <PackageThumb category={shipment.package_size} size={48} />
        <View className="flex-1">
          <Text className="text-[15.5px] font-bold text-ink tracking-[-0.3px]">{sizeLabel} · {shipment.weight_kg} kg</Text>
          <Text className="text-[11.5px] text-inkMute mt-[2px]" numberOfLines={1}>{origAddr} → {destAddr}</Text>
        </View>
        {isCollab && (
          <View className="flex-row items-center gap-1 bg-mint px-[7px] py-[3px] rounded-md">
            <MaterialCommunityIcons name="leaf" size={10} color={T.forest} />
            <Text className="text-[9px] tracking-[1px] text-forest font-bold uppercase">COLAB</Text>
          </View>
        )}
      </View>

      {/* Cadete + tap hint */}
      <View className="flex-row items-center gap-3 px-4 py-[14px]">
        <AvatarBubble initials="CA" color={T.amber} size={40} />
        <View className="flex-1">
          <Text className="text-[8.5px] tracking-[1.2px] text-inkMute uppercase">TU CADETE</Text>
          <View className="flex-row items-center gap-[6px] mt-px">
            <Text className="text-sm text-ink font-semibold">Cadete asignado</Text>
            <MaterialCommunityIcons name="star" size={11} color={T.amber} />
            <Text className="text-[10px] text-inkSoft font-bold">5.0</Text>
          </View>
        </View>
        <View className="flex-row items-center gap-[5px] bg-cardSoft border border-border px-[10px] py-[7px] rounded-[10px]">
          <Text className="text-[11.5px] text-inkSoft font-semibold">Ver detalles</Text>
          <MaterialCommunityIcons name="chevron-right" size={14} color={T.inkSoft} />
        </View>
      </View>
    </TouchableOpacity>
  );
}
