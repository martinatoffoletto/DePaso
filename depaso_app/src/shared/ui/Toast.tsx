import { useEffect, useRef } from "react";
import { Animated, TouchableOpacity } from "react-native";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useToastStore, ToastType } from "@/src/shared/ui/toastStore";
import { T } from "@/constants/tokens";

const STYLE: Record<ToastType, { bg: string; icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"] }> = {
  error:   { bg: T.red,     icon: "alert-circle-outline" },
  success: { bg: T.forest,  icon: "check-circle-outline" },
  info:    { bg: T.ink,     icon: "information-outline" },
};

/** Global toast, mounted once. Slides in from the top and auto-hides. */
export function Toast() {
  const insets = useSafeAreaInsets();
  const message = useToastStore((s) => s.message);
  const type = useToastStore((s) => s.type);
  const hide = useToastStore((s) => s.hide);
  const y = useRef(new Animated.Value(-120)).current;

  useEffect(() => {
    if (message) {
      Animated.spring(y, { toValue: 0, useNativeDriver: true, bounciness: 6 }).start();
      const timer = setTimeout(() => hide(), 3500);
      return () => clearTimeout(timer);
    }
    Animated.timing(y, { toValue: -120, duration: 200, useNativeDriver: true }).start();
  }, [message, y, hide]);

  if (!message) return null;
  const s = STYLE[type];

  return (
    <Animated.View
      style={{ position: "absolute", top: insets.top + 8, left: 12, right: 12, transform: [{ translateY: y }], zIndex: 1000 }}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={hide}
        className="flex-row items-center gap-2 rounded-2xl px-4 py-3"
        style={{ backgroundColor: s.bg, shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 16, elevation: 8 }}
      >
        <MaterialCommunityIcons name={s.icon} size={18} color="#fff" />
        <Text className="flex-1 text-[13px] text-white font-semibold">{message}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}
