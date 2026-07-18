import { View } from "react-native";
import { Text } from "react-native-paper";
import { T } from "@/constants/tokens";

/** Indicador de progreso del flow de envío (puntitos + "02/04"). */
export function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <View className="flex-row gap-[6px] items-center">
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          className="h-[6px] rounded-[4px]"
          style={{ width: i === current - 1 ? 18 : 6, backgroundColor: i < current ? T.forest : T.border }}
        />
      ))}
      <Text className="text-[10px] tracking-[1.5px] text-inkMute ml-1">
        {String(current).padStart(2, "0")}/{String(total).padStart(2, "0")}
      </Text>
    </View>
  );
}
