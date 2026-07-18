import { View, TouchableOpacity } from "react-native";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { FeedItem } from "@/src/shared/types";
import { carrierPayout } from "@/src/shared/utils/payout";
import { useAddress } from "@/src/shared/hooks/useAddress";
import { PACKAGE_LABEL_SHORT as SIZE_LABEL } from "@/src/shared/utils/packageCategory";
import { T } from "@/constants/tokens";
import { money } from "./riderUi";

/** Small offer row in the online "Pedidos cerca tuyo" list. */
export function OfferRow({ item, onPress }: { item: FeedItem; onPress: () => void }) {
  const origAddr = useAddress(item.origin_lat, item.origin_lon);
  const destAddr = useAddress(item.destination_lat, item.destination_lon);
  return (
    <TouchableOpacity
      className="bg-card border border-border rounded-[14px] px-3 py-[10px] flex-row items-center gap-[10px]"
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View className="w-[38px] h-[38px] rounded-[10px] bg-cardSoft border border-borderSoft items-center justify-center">
        {item.distance_to_pickup_km != null ? (
          <>
            <Text className="text-[13px] font-bold text-ink">{item.distance_to_pickup_km.toFixed(1)}</Text>
            <Text className="text-[7px] tracking-[0.5px] text-inkMute mt-px">KM</Text>
          </>
        ) : (
          <MaterialCommunityIcons name="package-variant" size={18} color={T.forest} />
        )}
      </View>
      <View className="flex-1">
        <View className="flex-row items-center gap-[6px]">
          <Text className="text-[13px] text-ink font-semibold">{SIZE_LABEL[item.package_size]}</Text>
          <Text className="text-[8px] tracking-[1px] text-inkMute bg-bg px-[5px] py-px rounded font-bold uppercase">
            {item.weight_kg} kg
          </Text>
        </View>
        <Text className="text-[11px] text-inkMute mt-px" numberOfLines={1}>{origAddr} → {destAddr}</Text>
      </View>
      <View className="items-end">
        <Text className="text-[15px] font-bold text-ink tracking-[-0.4px]">
          {item.estimated_price != null ? money(carrierPayout(item.estimated_price)) : "—"}
        </Text>
        <Text className="text-[8.5px] tracking-[1px] text-emeraldDeep font-bold mt-px">VER</Text>
      </View>
    </TouchableOpacity>
  );
}
