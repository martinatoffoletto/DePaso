import { View, TouchableOpacity } from "react-native";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { T } from "@/constants/tokens";

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>["name"];

function Toggle({ on }: { on: boolean }) {
  return (
    <View className={`w-[38px] h-[22px] rounded-full px-[2px] justify-center ${on ? "bg-forest items-end" : "bg-border items-start"}`}>
      <View className="w-[18px] h-[18px] rounded-full bg-[#F4EFE3]" />
    </View>
  );
}

type Trailing = "chevron" | "toggle-on" | "toggle-off" | string;

/** Fila de una sección del perfil: ícono + label (+ valor) + chevron/toggle/texto. */
export function ProfileRow({ icon, label, value, trailing = "chevron", accent = false, danger = false, onPress }: {
  icon: IconName; label: string; value?: string;
  trailing?: Trailing; accent?: boolean; danger?: boolean; onPress?: () => void;
}) {
  const isChevron  = trailing === "chevron";
  const isToggleOn = trailing === "toggle-on";
  const isToggleOff = trailing === "toggle-off";
  const isText = !isChevron && !isToggleOn && !isToggleOff;
  return (
    <TouchableOpacity className="flex-row items-center gap-[14px] px-4 py-[14px]" activeOpacity={onPress ? 0.7 : 1} onPress={onPress}>
      <View className={`w-9 h-9 rounded-[10px] items-center justify-center shrink-0 ${accent ? "bg-mint" : "bg-cardSoft border border-borderSoft"}`}>
        <MaterialCommunityIcons name={icon} size={18} color={danger ? T.red : accent ? T.forest : T.inkSoft} />
      </View>
      <View className="flex-1 min-w-0">
        <Text className={`text-sm font-medium ${danger ? "text-red" : "text-ink"}`}>{label}</Text>
        {value && <Text className="text-[11.5px] text-inkMute mt-px" numberOfLines={1}>{value}</Text>}
      </View>
      {isChevron    && <MaterialCommunityIcons name="chevron-right" size={18} color={T.inkFaint} />}
      {isToggleOn   && <Toggle on={true} />}
      {isToggleOff  && <Toggle on={false} />}
      {isText       && <Text className="text-[10px] tracking-[1px] text-inkMute uppercase font-semibold">{trailing}</Text>}
    </TouchableOpacity>
  );
}

/** Grupo de filas con título en mayúsculas y separadores. */
export function ProfileSection({ title, rows }: { title: string; rows: React.ReactNode[] }) {
  return (
    <View className="mt-[18px]">
      <Text className="text-[10px] font-bold tracking-[2px] text-inkMute uppercase mx-5 mb-2">{title}</Text>
      <View className="mx-4 bg-card rounded-[18px] border border-border overflow-hidden">
        {rows.map((row, i) => (
          <View key={i}>
            {i > 0 && <View className="h-px bg-borderSoft ml-[66px]" />}
            {row}
          </View>
        ))}
      </View>
    </View>
  );
}
