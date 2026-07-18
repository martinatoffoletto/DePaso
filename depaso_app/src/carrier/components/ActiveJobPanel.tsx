import { View, TouchableOpacity, ActivityIndicator, Linking } from "react-native";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Shipment, ShipmentStatus } from "@/src/shared/types";
import { carrierPayout } from "@/src/shared/utils/payout";
import { useAddress } from "@/src/shared/hooks/useAddress";
import { T } from "@/constants/tokens";
import { money } from "./riderUi";

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>["name"];

/** Operational milestones — managed from the map, not from the history tab. */
const NEXT_ACTION: Partial<Record<ShipmentStatus, { next: ShipmentStatus; label: string; icon: IconName }>> = {
  [ShipmentStatus.ASSIGNED]:       { next: ShipmentStatus.PICKUP_ARRIVED, label: "Llegué al origen",  icon: "map-marker-check-outline" },
  [ShipmentStatus.PICKUP_ARRIVED]: { next: ShipmentStatus.IN_TRANSIT,     label: "Retiré el paquete", icon: "package-up" },
  [ShipmentStatus.IN_TRANSIT]:     { next: ShipmentStatus.DELIVERED,      label: "Entregué el paquete", icon: "check-decagram-outline" },
};

const STATUS_LABEL: Partial<Record<ShipmentStatus, { text: string; color: string; bg: string }>> = {
  [ShipmentStatus.ASSIGNED]:       { text: "IR AL RETIRO", color: T.amberDeep,   bg: T.amberBg },
  [ShipmentStatus.PICKUP_ARRIVED]: { text: "EN RETIRO",    color: T.emeraldDeep, bg: T.mint },
  [ShipmentStatus.IN_TRANSIT]:     { text: "EN CAMINO",    color: T.forest,      bg: T.mint },
};

/** Active delivery card in the map's bottom sheet — milestones live here. */
export function ActiveJobPanel({ shipment, advancing, onAdvance, onCancel }: {
  shipment: Shipment;
  advancing: boolean;
  onAdvance: (next: ShipmentStatus) => void;
  onCancel: () => void;
}) {
  const origAddr = useAddress(shipment.origin_lat, shipment.origin_lon);
  const destAddr = useAddress(shipment.destination_lat, shipment.destination_lon);
  const action = NEXT_ACTION[shipment.status];
  const statusInfo = STATUS_LABEL[shipment.status];

  return (
    <View className="bg-card border-[1.2px] border-forest rounded-[18px] p-[14px]">
      <View className="flex-row items-center justify-between mb-[10px]">
        <View className="flex-row items-center gap-2">
          <Text className="text-[10px] tracking-[1.5px] text-inkMute font-bold">DP-{String(shipment.id).padStart(4, "0")}</Text>
          {statusInfo && (
            <View className="rounded-md px-[7px] py-[3px]" style={{ backgroundColor: statusInfo.bg }}>
              <Text className="text-[9px] tracking-[1px] font-bold uppercase" style={{ color: statusInfo.color }}>
                {statusInfo.text}
              </Text>
            </View>
          )}
        </View>
        {shipment.estimated_price != null && (
          <Text className="text-[16px] font-extrabold text-ink tracking-[-0.4px]">{money(carrierPayout(shipment.estimated_price))}</Text>
        )}
      </View>

      <View className="gap-[6px] mb-[10px]">
        <View className="flex-row items-center gap-[10px]">
          <View className="w-[9px] h-[9px] rounded-full border-2 border-forest bg-card" />
          <Text className="flex-1 text-[13px] text-ink font-medium" numberOfLines={1}>{origAddr}</Text>
        </View>
        <View className="flex-row items-center gap-[10px]">
          <View className="w-[9px] h-[9px] rounded-[3px] bg-emerald rotate-45" />
          <Text className="flex-1 text-[13px] text-ink font-medium" numberOfLines={1}>{destAddr}</Text>
        </View>
      </View>

      {(shipment.recipient_name || shipment.recipient_phone) && (
        <View className="flex-row items-center gap-[10px] bg-cardSoft border border-borderSoft rounded-xl px-3 py-2 mb-[10px]">
          <MaterialCommunityIcons name="account-outline" size={15} color={T.inkSoft} />
          <Text className="flex-1 text-[12.5px] text-ink font-semibold" numberOfLines={1}>
            {shipment.recipient_name || "Destinatario"}
          </Text>
          {shipment.recipient_phone && (
            <TouchableOpacity
              className="flex-row items-center gap-[5px] bg-forest rounded-lg px-[10px] py-[6px]"
              onPress={() => Linking.openURL(`tel:${shipment.recipient_phone}`)}
              activeOpacity={0.85}
            >
              <MaterialCommunityIcons name="phone" size={12} color="#F4EFE3" />
              <Text className="text-[11px] text-[#F4EFE3] font-semibold">Llamar</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {action && (
        <TouchableOpacity
          className="bg-forest rounded-[13px] h-[46px] flex-row items-center justify-center gap-2"
          onPress={() => onAdvance(action.next)}
          disabled={advancing}
          activeOpacity={0.88}
        >
          {advancing
            ? <ActivityIndicator color="#F4EFE3" size="small" />
            : <>
                <MaterialCommunityIcons name={action.icon} size={16} color="#F4EFE3" />
                <Text className="text-[#F4EFE3] font-bold text-[13.5px]">{action.label}</Text>
              </>}
        </TouchableOpacity>
      )}

      {shipment.status === ShipmentStatus.ASSIGNED && (
        <TouchableOpacity className="items-center pt-[10px]" onPress={onCancel} activeOpacity={0.8}>
          <Text className="text-[11.5px] text-red font-medium">No puedo llevarlo · penaliza reputación</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
