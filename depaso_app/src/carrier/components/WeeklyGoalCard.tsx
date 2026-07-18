import { useEffect, useRef, useState } from "react";
import { View, TouchableOpacity, Modal, TextInput, Text } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { T } from "@/constants/tokens";
import { useGoalStore } from "@/src/carrier/goalStore";
import { AnimatedProgressBar } from "@/src/shared/ui/AnimatedProgressBar";
import { money } from "./riderUi";

const PRESETS = [15_000, 30_000, 60_000, 100_000];

/** Meta semanal del rider con barra de progreso — se fija tocando la card. */
export function WeeklyGoalCard({ weekEarned }: { weekEarned: number }) {
  const insets = useSafeAreaInsets();
  const goal = useGoalStore((s) => s.weeklyGoal);
  const setGoal = useGoalStore((s) => s.setGoal);
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");

  const pct = goal != null && goal > 0 ? Math.min(1, weekEarned / goal) : 0;
  const reached = goal != null && weekEarned >= goal;

  // Cuando la meta pasa a cumplida: haptic de éxito + micro-rebote del badge.
  const badgeScale = useSharedValue(1);
  const wasReached = useRef(reached);
  useEffect(() => {
    if (reached && !wasReached.current) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      badgeScale.value = withSequence(
        withTiming(1.18, { duration: 160 }),
        withSpring(1, { damping: 8, stiffness: 160 }),
      );
    }
    wasReached.current = reached;
  }, [reached, badgeScale]);
  const badgeStyle = useAnimatedStyle(() => ({ transform: [{ scale: badgeScale.value }] }));

  const save = (amount: number | null) => {
    setGoal(amount);
    setInput("");
    setOpen(false);
  };

  return (
    <>
      {goal == null ? (
        <TouchableOpacity
          className="bg-card border border-border border-dashed rounded-2xl px-4 py-[14px] flex-row items-center gap-3"
          onPress={() => setOpen(true)}
          activeOpacity={0.85}
        >
          <MaterialCommunityIcons name="flag-outline" size={20} color={T.inkMute} />
          <Text className="flex-1 text-[13px] text-inkMute">
            Fijate una meta semanal y seguí tu progreso acá.
          </Text>
          <Text className="text-[10px] tracking-[1.5px] text-emeraldDeep uppercase font-bold">Fijar</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          className="bg-card border border-border rounded-2xl p-[14px]"
          onPress={() => setOpen(true)}
          activeOpacity={0.85}
        >
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-[9px] tracking-[1.5px] text-inkMute uppercase font-bold">Meta semanal</Text>
            {reached ? (
              <Animated.View
                style={badgeStyle}
                className="flex-row items-center gap-1 bg-mint rounded-md px-[7px] py-[3px]"
              >
                <MaterialCommunityIcons name="check-circle" size={11} color={T.emeraldDeep} />
                <Text className="text-[9px] tracking-[1px] font-bold uppercase" style={{ color: T.emeraldDeep }}>
                  Cumplida
                </Text>
              </Animated.View>
            ) : (
              <Text className="text-[11px] text-inkMute font-semibold">{Math.round(pct * 100)}%</Text>
            )}
          </View>
          <Text className="text-[15px] text-ink font-bold tracking-[-0.3px] mb-2">
            {money(weekEarned)}
            <Text className="text-[13px] text-inkMute font-medium"> de {money(goal)}</Text>
          </Text>
          <AnimatedProgressBar
            pct={pct}
            minPct={0.02}
            fillColor={reached ? T.emerald : T.forest}
            trackClassName="h-[8px] rounded-full bg-borderSoft overflow-hidden"
          />
        </TouchableOpacity>
      )}

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity className="flex-1 bg-black/40" activeOpacity={1} onPress={() => setOpen(false)}>
          <View
            className="absolute left-0 right-0 bottom-0 bg-bg rounded-t-[24px] px-5 pt-3"
            style={{ paddingBottom: insets.bottom + 16 }}
          >
            <View className="w-[38px] h-1 bg-border rounded-[3px] self-center mb-3" />
            <Text className="text-base font-bold text-ink tracking-[-0.3px] mb-1">Meta semanal</Text>
            <Text className="text-[12.5px] text-inkMute mb-4">
              Cuánto querés ganar esta semana. Es solo para vos: no afecta los pedidos que recibís.
            </Text>

            <View className="flex-row gap-2 mb-3">
              {PRESETS.map((p) => (
                <TouchableOpacity
                  key={p}
                  className={`flex-1 rounded-xl border py-[10px] items-center ${goal === p ? "bg-forest border-forest" : "bg-card border-border"}`}
                  onPress={() => save(p)}
                  activeOpacity={0.8}
                >
                  <Text className={`text-[12px] font-bold ${goal === p ? "text-[#F4EFE3]" : "text-ink"}`}>
                    ${(p / 1000).toFixed(0)}k
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View className="flex-row items-center gap-2 bg-card border border-border rounded-xl px-3 mb-3">
              <Text className="text-[14px] text-inkMute font-semibold">$</Text>
              <TextInput
                className="flex-1 text-[15px] text-ink font-medium py-3"
                value={input}
                onChangeText={setInput}
                placeholder="Otro monto"
                placeholderTextColor={T.inkFaint}
                keyboardType="number-pad"
              />
              <TouchableOpacity
                onPress={() => {
                  const n = Number(input.replace(/\D/g, ""));
                  if (Number.isFinite(n) && n > 0) save(n);
                }}
                hitSlop={8}
              >
                <Text className="text-[10px] tracking-[1.5px] text-emeraldDeep uppercase font-bold">Guardar</Text>
              </TouchableOpacity>
            </View>

            {goal != null && (
              <TouchableOpacity className="items-center py-2" onPress={() => save(null)} activeOpacity={0.7}>
                <Text className="text-[12.5px] text-red font-medium">Quitar meta</Text>
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}
