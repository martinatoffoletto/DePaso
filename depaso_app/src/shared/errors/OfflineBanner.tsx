import { View } from "react-native";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useConnectionStore } from "@/src/shared/errors/connectionStore";

/** Thin banner shown while the app can't reach the API. Mounted once globally,
 * above the tabs. Takes no space when online. */
export function OfflineBanner() {
  const online = useConnectionStore((s) => s.online);
  const insets = useSafeAreaInsets();
  if (online) return null;
  return (
    <View className="bg-red" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center justify-center gap-2 py-[6px] px-4">
        <MaterialCommunityIcons name="wifi-off" size={13} color="#fff" />
        <Text className="text-[11px] text-white font-semibold tracking-[0.3px]" style={{ color: "#FFFFFF" }}>
          Sin conexión — reintentando…
        </Text>
      </View>
    </View>
  );
}
