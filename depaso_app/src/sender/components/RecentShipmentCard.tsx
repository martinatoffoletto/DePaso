import { View, TouchableOpacity, Text } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { T } from "@/constants/tokens";
import { sizeLabel } from "@/src/shared/utils/packageCategory";
import { parseApiDate } from "@/src/shared/utils/dates";
import type { Shipment } from "@/src/shared/types";

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>["name"];

const SIZE_ICON: Record<string, IconName> = {
  s: "email-outline",
  m: "cube-outline",
  l: "package-variant-closed",
  xl: "truck-outline",
};

const AVATAR_BG = [T.amber, T.violet, T.emerald];

const MONTHS = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];

function dateLabel(iso: string): string {
  const d = parseApiDate(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

function initials(name: string): string {
  return name.split(/\s+/).slice(0, 2).map((w) => w.charAt(0).toUpperCase()).join("");
}

/** Card compacta de un envío reciente en el home — tap para volver a mandar. */
export function RecentShipmentCard({ shipment, index, onPress }: {
  shipment: Shipment;
  index: number;
  onPress: () => void;
}) {
  const title = shipment.description?.trim() || sizeLabel(shipment.package_size);
  const subtitle = shipment.recipient_name
    ? `A ${shipment.recipient_name.split(/\s+/)[0]}`
    : dateLabel(shipment.created_at);

  return (
    <TouchableOpacity
      className="flex-1 bg-card rounded-[14px] border border-border p-[10px]"
      onPress={onPress}
      activeOpacity={0.78}
    >
      <View className="w-[30px] h-[30px] rounded-lg bg-cardSoft border border-borderSoft items-center justify-center mb-2">
        <MaterialCommunityIcons name={SIZE_ICON[shipment.package_size] ?? "cube-outline"} size={14} color={T.inkSoft} />
      </View>
      <Text className="text-[12.5px] font-semibold text-ink" numberOfLines={1}>{title}</Text>
      <Text className="text-[9px] tracking-[1px] text-inkMute uppercase mt-px" numberOfLines={1}>{subtitle}</Text>
      {!!shipment.recipient_name && (
        <View
          className="absolute top-[10px] right-[10px] w-[18px] h-[18px] rounded-full border-2 border-card items-center justify-center"
          style={{ backgroundColor: AVATAR_BG[index % AVATAR_BG.length] }}
        >
          <Text className="text-[7px] font-bold text-[#F4EFE3]">{initials(shipment.recipient_name)}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}
