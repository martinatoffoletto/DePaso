import { useEffect } from "react";
import { View, TouchableOpacity, Text } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { T } from "@/constants/tokens";
import { AnimatedCounter } from "@/src/shared/ui/AnimatedCounter";
import type { WeekEarnings } from "@/src/carrier/weekEarnings";
import { money } from "./riderUi";

const BAR_AREA_H = 46;

/** Una barra del gráfico: su altura crece con animación al montar y al cambiar. */
function Bar({ height, color, opacity, delay }: { height: number; color: string; opacity: number; delay: number }) {
  const reduced = useReducedMotion();
  const h = useSharedValue(reduced ? height : 0);

  useEffect(() => {
    h.value = reduced
      ? height
      : withDelay(delay, withTiming(height, { duration: 480, easing: Easing.out(Easing.cubic) }));
  }, [height, delay, reduced, h]);

  const style = useAnimatedStyle(() => ({ height: h.value }));

  return (
    <Animated.View
      style={[
        { width: 16, borderTopLeftRadius: 4, borderTopRightRadius: 4, backgroundColor: color, opacity },
        style,
      ]}
    />
  );
}

/**
 * Mini gráfico de barras: payout por día de la semana (lun→dom).
 * - `onOpenEarnings`: muestra el link "Ver pagos" (uso en el home).
 * - `onSelectDay`: hace las barras tocables para filtrar por día (uso en Pagos).
 */
export function WeekEarningsCard({ week, title = "Esta semana", onOpenEarnings, selectedDay, onSelectDay }: {
  week: WeekEarnings;
  title?: string;
  onOpenEarnings?: () => void;
  selectedDay?: number | null;
  onSelectDay?: (day: number | null) => void;
}) {
  const max = Math.max(...week.days.map((d) => d.amount), 1);
  return (
    <TouchableOpacity
      className="bg-card border border-border rounded-2xl p-[14px]"
      onPress={onOpenEarnings}
      activeOpacity={0.85}
      disabled={!onOpenEarnings}
    >
      <View className="flex-row items-center justify-between mb-3">
        <View>
          <Text className="text-[9px] tracking-[1.5px] text-inkMute uppercase font-bold">{title}</Text>
          <AnimatedCounter
            value={week.total}
            format={money}
            className="text-[24px] font-bold text-ink tracking-[-0.8px] mt-px"
          />
        </View>
        {onOpenEarnings && (
          <View className="flex-row items-center gap-1">
            <Text className="text-[10px] tracking-[1.5px] text-emeraldDeep uppercase font-bold">Ver pagos</Text>
            <MaterialCommunityIcons name="chevron-right" size={14} color={T.emeraldDeep} />
          </View>
        )}
      </View>

      <View className="flex-row items-end gap-[6px]">
        {week.days.map((d, i) => {
          const h = d.amount > 0 ? Math.max(6, Math.round((d.amount / max) * BAR_AREA_H)) : 3;
          const isSelected = selectedDay === i;
          const dimmed = selectedDay != null && !isSelected;
          const bar = (
            <>
              <View style={{ height: BAR_AREA_H, justifyContent: "flex-end" }}>
                <Bar
                  height={h}
                  color={d.amount > 0 ? (isSelected ? T.forest : T.emerald) : T.border}
                  opacity={d.isFuture ? 0.35 : dimmed ? 0.45 : 1}
                  delay={i * 45}
                />
              </View>
              <Text
                className={`text-[9px] tracking-[0.5px] ${d.isToday || isSelected ? "text-ink font-bold" : "text-inkMute font-semibold"}`}
              >
                {d.label}
              </Text>
            </>
          );
          return onSelectDay ? (
            <TouchableOpacity
              key={i}
              className="flex-1 items-center gap-[5px]"
              onPress={() => onSelectDay(isSelected ? null : i)}
              activeOpacity={0.7}
            >
              {bar}
            </TouchableOpacity>
          ) : (
            <View key={i} className="flex-1 items-center gap-[5px]">
              {bar}
            </View>
          );
        })}
      </View>
    </TouchableOpacity>
  );
}
