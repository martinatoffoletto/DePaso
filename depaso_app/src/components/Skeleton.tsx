import { useEffect, useRef } from "react";
import { Animated, ViewStyle } from "react-native";
import { T } from "@/constants/tokens";

/** A pulsing placeholder block, for perceived-speed loading states. */
export function Skeleton({ width, height = 16, radius = 8, style }: {
  width?: number | `${number}%`;
  height?: number;
  radius?: number;
  style?: ViewStyle;
}) {
  const pulse = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <Animated.View
      style={[
        { width: width ?? "100%", height, borderRadius: radius, backgroundColor: T.border, opacity: pulse },
        style,
      ]}
    />
  );
}

/** A card-shaped skeleton row, handy for list loading states. */
export function SkeletonCard() {
  return (
    <Animated.View className="bg-card rounded-[18px] border border-border p-4 gap-3">
      <Skeleton width="60%" height={14} />
      <Skeleton width="90%" height={12} />
      <Skeleton width="40%" height={12} />
    </Animated.View>
  );
}
