import { View, TouchableOpacity, Text } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { T } from "@/constants/tokens";

/** Card de demanda en el home offline: hay pedidos compatibles ahora. */
export function OffersTeaser({ count, onConnect }: { count: number; onConnect: () => void }) {
  if (count <= 0) return null;
  return (
    <TouchableOpacity
      className="bg-mint border-[1.2px] border-emerald rounded-2xl px-4 py-[14px] flex-row items-center gap-3"
      onPress={onConnect}
      activeOpacity={0.85}
    >
      <View className="w-9 h-9 rounded-xl bg-emerald items-center justify-center shrink-0">
        <MaterialCommunityIcons name="radar" size={20} color="#fff" />
      </View>
      <View className="flex-1">
        <Text className="text-[13.5px] font-bold" style={{ color: T.forest }}>
          {count === 1 ? "Hay 1 pedido cerca tuyo ahora" : `Hay ${count} pedidos cerca tuyo ahora`}
        </Text>
        <Text className="text-[11.5px] mt-px" style={{ color: T.inkSoft }}>
          Conectate para verlos y aceptar el que te convenga.
        </Text>
      </View>
      <MaterialCommunityIcons name="arrow-right" size={18} color={T.emeraldDeep} />
    </TouchableOpacity>
  );
}
