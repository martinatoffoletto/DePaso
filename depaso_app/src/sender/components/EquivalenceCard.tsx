import { View } from "react-native";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { T } from "@/constants/tokens";

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>["name"];

/** Card de equivalencia de CO₂ (km en auto, árboles, cargas de celular). */
export function EquivalenceCard({ icon, value, unit, label }: {
  icon: IconName; value: string; unit: string; label: string;
}) {
  return (
    <View className="flex-1 bg-card rounded-[18px] border border-border p-4 gap-[6px]">
      <View className="w-9 h-9 rounded-[10px] bg-mint items-center justify-center">
        <MaterialCommunityIcons name={icon} size={20} color={T.forest} />
      </View>
      <Text className="text-[22px] font-bold text-ink tracking-[-0.5px] mt-1">
        {value}<Text className="text-[13px] font-medium text-inkMute"> {unit}</Text>
      </Text>
      <Text className="text-[11.5px] text-inkMute">{label}</Text>
    </View>
  );
}
