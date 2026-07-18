import { View } from "react-native";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { T } from "@/constants/tokens";

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>["name"];

/** Fila ícono + label + valor del resumen de envío. */
export function SummaryRow({ icon, label, value }: { icon: IconName; label: string; value: string }) {
  return (
    <View className="flex-row items-start gap-[10px] py-[10px]">
      <MaterialCommunityIcons name={icon} size={17} color={T.inkMute} />
      <Text className="text-[13px] text-inkMute w-20">{label}</Text>
      <Text className="flex-1 text-sm text-ink font-medium text-right" numberOfLines={2}>{value}</Text>
    </View>
  );
}
