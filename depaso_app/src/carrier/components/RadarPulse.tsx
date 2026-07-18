import { useEffect } from "react";
import { View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { T } from "@/constants/tokens";

const RING = 84;

function Ring({ delay, reduced }: { delay: number; reduced: boolean }) {
  const p = useSharedValue(0);

  useEffect(() => {
    if (reduced) return;
    p.value = withDelay(
      delay,
      withRepeat(withTiming(1, { duration: 2600, easing: Easing.out(Easing.ease) }), -1, false),
    );
    return () => cancelAnimation(p);
  }, [p, delay, reduced]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: 0.35 + p.value * 0.65 }],
    opacity: (1 - p.value) * 0.4,
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: "absolute",
          width: RING,
          height: RING,
          borderRadius: RING / 2,
          borderWidth: 1.5,
          borderColor: T.emerald,
        },
        style,
      ]}
    />
  );
}

/** Radar con anillos que se expanden en loop — para el empty state del feed. */
export function RadarPulse() {
  const reduced = useReducedMotion();
  return (
    <View style={{ width: RING, height: RING }} className="items-center justify-center">
      {!reduced && (
        <>
          <Ring delay={0} reduced={reduced} />
          <Ring delay={870} reduced={reduced} />
          <Ring delay={1740} reduced={reduced} />
        </>
      )}
      <MaterialCommunityIcons name="radar" size={30} color={T.inkMute} />
    </View>
  );
}
