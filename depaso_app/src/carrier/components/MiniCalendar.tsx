import { useState } from "react";
import { View, TouchableOpacity, Text } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { T } from "@/constants/tokens";

const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/** Compact month calendar — past days disabled, tap to pick a day. */
export function MiniCalendar({ selected, onSelect }: { selected: Date | null; onSelect: (d: Date) => void }) {
  const [monthOffset, setMonthOffset] = useState(0);
  const today = new Date();
  const base = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
  const daysInMonth = new Date(base.getFullYear(), base.getMonth() + 1, 0).getDate();
  const leadingBlanks = (base.getDay() + 6) % 7; // Monday-first grid

  const cells: (number | null)[] = [
    ...Array.from({ length: leadingBlanks }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <View className="bg-card rounded-[14px] border-[1.2px] border-border p-3">
      <View className="flex-row items-center justify-between mb-2">
        <TouchableOpacity
          onPress={() => setMonthOffset((m) => Math.max(0, m - 1))}
          hitSlop={10}
          className={monthOffset === 0 ? "opacity-30" : ""}
          disabled={monthOffset === 0}
        >
          <MaterialCommunityIcons name="chevron-left" size={20} color={T.ink} />
        </TouchableOpacity>
        <Text className="text-[13px] font-bold text-ink">{MONTHS[base.getMonth()]} {base.getFullYear()}</Text>
        <TouchableOpacity onPress={() => setMonthOffset((m) => Math.min(2, m + 1))} hitSlop={10}>
          <MaterialCommunityIcons name="chevron-right" size={20} color={T.ink} />
        </TouchableOpacity>
      </View>
      <View className="flex-row mb-1">
        {["L", "M", "X", "J", "V", "S", "D"].map((d, i) => (
          <Text key={i} className="flex-1 text-center text-[10px] tracking-[0.5px] text-inkMute font-bold">{d}</Text>
        ))}
      </View>
      <View className="flex-row flex-wrap">
        {cells.map((day, i) => {
          if (day === null) return <View key={`b${i}`} style={{ width: "14.28%" }} className="h-9" />;
          const date = new Date(base.getFullYear(), base.getMonth(), day);
          const isPast = date < new Date(today.getFullYear(), today.getMonth(), today.getDate());
          const isSelected = selected != null && sameDay(date, selected);
          const isToday = sameDay(date, today);
          return (
            <TouchableOpacity
              key={day}
              style={{ width: "14.28%" }}
              className="h-9 items-center justify-center"
              onPress={() => !isPast && onSelect(date)}
              disabled={isPast}
              activeOpacity={0.7}
            >
              <View className={`w-8 h-8 rounded-[10px] items-center justify-center ${isSelected ? "bg-forest" : isToday ? "bg-mint" : ""}`}>
                <Text className={`text-[13px] font-semibold ${isSelected ? "text-[#F4EFE3]" : isPast ? "text-inkFaint" : isToday ? "text-forest" : "text-ink"}`}>
                  {day}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
