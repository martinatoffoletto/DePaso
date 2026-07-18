import { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

/**
 * Barra de progreso cuyo ancho crece con animación al montar y al cambiar `pct`.
 * `trackClassName` estiliza el riel (alto, color de fondo, radio, overflow-hidden).
 */
export function AnimatedProgressBar({
  pct,
  fillColor,
  trackClassName,
  minPct = 0,
  duration = 650,
}: {
  /** Progreso 0..1. */
  pct: number;
  fillColor: string;
  trackClassName: string;
  /** Ancho mínimo visible (0..1) para que se vea aunque el progreso sea ~0. */
  minPct?: number;
  duration?: number;
}) {
  const reduced = useReducedMotion();
  const w = useSharedValue(reduced ? pct : 0);

  useEffect(() => {
    w.value = reduced ? pct : withTiming(pct, { duration, easing: Easing.out(Easing.cubic) });
  }, [pct, reduced, duration, w]);

  const style = useAnimatedStyle(() => ({
    width: `${Math.max(minPct, w.value) * 100}%`,
  }));

  return (
    <View className={trackClassName}>
      <Animated.View className="h-full rounded-full" style={[{ backgroundColor: fillColor }, style]} />
    </View>
  );
}
