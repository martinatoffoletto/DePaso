import { useState } from "react";
import { View, ScrollView, TouchableOpacity, Modal, Text } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { T } from "@/constants/tokens";

/** Hour dropdown — opens a bottom sheet with filtered options. */
export function HourSelect({ value, onSelect, disabled, title = "Hora de inicio", placeholder = "Elegí la hora", minHour = 0 }: {
  value: number | null;
  onSelect: (hour: number) => void;
  disabled?: boolean;
  title?: string;
  placeholder?: string;
  /** Earliest selectable hour (inclusive). Hours before this are hidden. */
  minHour?: number;
}) {
  const [open, setOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const hours = Array.from({ length: 24 }).map((_, i) => i).filter(h => h >= minHour);
  return (
    <>
      <TouchableOpacity
        className={`flex-row items-center gap-[10px] bg-card rounded-[14px] border-[1.2px] border-border px-[14px] h-[52px] ${disabled ? "opacity-40" : ""}`}
        onPress={() => !disabled && setOpen(true)}
        activeOpacity={0.8}
        disabled={disabled}
      >
        <MaterialCommunityIcons name="clock-outline" size={16} color={T.inkMute} />
        <Text className={`flex-1 text-[15px] font-medium ${value != null ? "text-ink" : "text-inkFaint"}`}>
          {value != null ? `${String(value).padStart(2, "0")}:00` : placeholder}
        </Text>
        <MaterialCommunityIcons name="chevron-down" size={18} color={T.inkMute} />
      </TouchableOpacity>
      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity className="flex-1 bg-black/40" activeOpacity={1} onPress={() => setOpen(false)}>
          <View className="absolute left-0 right-0 bottom-0 bg-bg rounded-t-[24px] pt-3" style={{ paddingBottom: insets.bottom + 8, maxHeight: "60%" }}>
            <View className="w-[38px] h-1 bg-border rounded-[3px] self-center mb-2" />
            <Text className="text-sm font-bold text-ink text-center mb-2">{title}</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {hours.map((h) => (
                <TouchableOpacity
                  key={h}
                  className={`px-6 py-3 flex-row items-center justify-between ${value === h ? "bg-mint" : ""}`}
                  onPress={() => { onSelect(h); setOpen(false); }}
                  activeOpacity={0.7}
                >
                  <Text className={`text-[15px] font-medium ${value === h ? "text-forest" : "text-ink"}`}>
                    {String(h).padStart(2, "0")}:00
                  </Text>
                  {value === h && <MaterialCommunityIcons name="check" size={16} color={T.forest} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}
