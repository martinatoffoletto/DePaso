import { View, TouchableOpacity } from "react-native";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { DeliveryMode, Shipment, ShipmentStatus } from "@/src/shared/types";
import { PACKAGE_LABEL_SHORT as SIZE_LABEL } from "@/src/shared/utils/packageCategory";
import { T } from "@/constants/tokens";
import { AvatarBubble, CADETE_COLORS, MiniRouteLine, PackageThumb, formatDate, useAddress } from "./shipmentsUi";

/** Card de un envío pasado (entregado o cancelado) en el historial. */
export function PastShipmentCard({ item, onPress, onRate }: { item: Shipment; onPress: () => void; onRate: () => void }) {
  const router = useRouter();
  const isDelivered = item.status === ShipmentStatus.DELIVERED;
  const isCancelled = item.status === ShipmentStatus.CANCELLED;
  const isCollab = item.modality === DeliveryMode.COLLABORATIVE;
  const statusColor = isDelivered ? T.emeraldDeep : isCancelled ? T.red : T.amber;
  const statusBg = isDelivered ? T.mint : isCancelled ? T.redBg : T.amberBg;
  const statusLabel = isDelivered ? "ENTREGADO" : isCancelled ? "CANCELADO" : "PENDIENTE";
  const origCoord = useAddress(item.origin_lat, item.origin_lon);
  const destCoord = useAddress(item.destination_lat, item.destination_lon);
  const avatarColor = CADETE_COLORS[item.id % 4];

  return (
    <TouchableOpacity className="bg-card rounded-[18px] border border-border p-[14px]" onPress={onPress} activeOpacity={0.88}>
      {/* Top: id + status + date */}
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center gap-2">
          <Text className="text-[10px] tracking-[1.5px] text-ink font-bold">DP-{String(item.id).padStart(4, "0")}</Text>
          <View className="flex-row items-center gap-1 px-[7px] py-[3px] rounded-md" style={{ backgroundColor: statusBg }}>
            <View className="w-[5px] h-[5px] rounded-full" style={{ backgroundColor: statusColor }} />
            <Text className="text-[9px] tracking-[1px] font-bold uppercase" style={{ color: statusColor }}>{statusLabel}</Text>
          </View>
        </View>
        <Text className="text-[10px] tracking-[1px] text-inkMute uppercase">{formatDate(item.created_at)}</Text>
      </View>

      {/* Body: thumb + info + price */}
      <View className="flex-row gap-3 mb-3 items-start">
        <PackageThumb size={56} category={item.package_size} />
        <View className="flex-1">
          <Text className="text-base font-bold text-ink tracking-[-0.3px]">{SIZE_LABEL[item.package_size]}</Text>
          <Text className="text-[11.5px] text-inkMute mt-[2px]">
            {item.weight_kg} kg{item.description ? ` · ${item.description}` : ""}
          </Text>
          <View className="flex-row items-center gap-[6px] mt-[6px] flex-wrap">
            {isCollab && (
              <View className="bg-mint border border-borderSoft px-[6px] py-[2px] rounded-[5px]">
                <Text className="text-[8.5px] tracking-[1px] text-forest font-bold uppercase">COLABORATIVA</Text>
              </View>
            )}
            {(item.co2_savings_kg ?? 0) > 0 && (
              <View className="flex-row items-center gap-[3px]">
                <MaterialCommunityIcons name="leaf" size={10} color={T.emeraldDeep} />
                <Text className="text-[9px] tracking-[1px] text-emeraldDeep font-bold uppercase">
                  -{item.co2_savings_kg} CO₂
                </Text>
              </View>
            )}
          </View>
        </View>
        {item.estimated_price != null && (
          <View className="items-end">
            <Text className="text-[17px] font-bold text-ink tracking-[-0.5px]">
              ${item.estimated_price.toLocaleString("es-AR")}
            </Text>
            <Text className="text-[8.5px] tracking-[1px] text-inkMute uppercase">ARS</Text>
          </View>
        )}
      </View>

      {/* Route */}
      <View className="bg-bg rounded-xl px-3 py-2 mb-[10px]">
        <MiniRouteLine origin={origCoord} destination={destCoord} />
      </View>

      {/* Cadete row */}
      <View className="flex-row items-center gap-[10px] pt-1">
        <AvatarBubble initials="C" color={avatarColor} size={28} />
        <View className="flex-1">
          <Text className="text-xs text-ink font-medium">Cadete</Text>
          <Text className="text-[9px] tracking-[1px] text-inkMute uppercase mt-px">1 VIAJE JUNTOS</Text>
        </View>
        {isDelivered && (
          <TouchableOpacity className="flex-row items-center gap-[5px] bg-forest px-[10px] py-[6px] rounded-lg" activeOpacity={0.85} onPress={onRate}>
            <MaterialCommunityIcons name="star-outline" size={11} color={T.lime} />
            <Text className="text-[11.5px] font-semibold text-[#F4EFE3]">Calificar</Text>
          </TouchableOpacity>
        )}
        {isCancelled && (
          <TouchableOpacity className="border border-border px-[10px] py-[6px] rounded-lg" activeOpacity={0.85} onPress={() => router.push("/(main)/enviar")}>
            <Text className="text-[11.5px] font-semibold text-inkSoft">Reenviar</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}
