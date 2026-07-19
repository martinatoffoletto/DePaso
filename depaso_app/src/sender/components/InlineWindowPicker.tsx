import { View, Text } from "react-native";
import { HourSelect } from "@/src/shared/ui/HourSelect";
import { PickupSchedule, todayISO } from "@/src/sender/pickupSchedule";

/**
 * Selector de franja compacto para la card "Hoy" — mismo par Desde/Hasta que usa
 * AddressScreen (PickupScheduleCard), con el día fijo en hoy. Deja el schedule
 * como { kind: "window" } para que el flow derive assignment_mode = by_availability.
 */
export function InlineWindowPicker({ schedule, onChange, dark }: {
  schedule: PickupSchedule;
  onChange: (s: PickupSchedule) => void;
  dark?: boolean;
}) {
  const win = schedule.kind === "window" ? schedule : null;
  const startHour = win?.startHour ?? null;
  const endHour = win?.endHour ?? null;
  const date = win?.date ?? todayISO();

  // When the selected day is today, only allow hours from now onward.
  const isToday = date === todayISO();
  const nowHour = new Date().getHours();
  const minStart = isToday ? nowHour : 0;
  const minEnd = startHour != null ? startHour + 1 : minStart;

  const labelClass = dark ? "text-[#F4EFE3]/70" : "text-inkMute";

  return (
    <View className="flex-row gap-2 mt-3">
      <View className="flex-1">
        <Text className={`text-[9px] tracking-[1.2px] uppercase mb-[6px] ${labelClass}`}>DESDE</Text>
        <HourSelect
          value={startHour}
          onSelect={(h) => onChange({ kind: "window", date, startHour: h, endHour: endHour != null && endHour <= h ? null : endHour })}
          title="Desde qué hora"
          placeholder="Desde"
          minHour={minStart}
        />
      </View>
      <View className="flex-1">
        <Text className={`text-[9px] tracking-[1.2px] uppercase mb-[6px] ${labelClass}`}>HASTA</Text>
        <HourSelect
          value={endHour}
          onSelect={(h) => onChange({ kind: "window", date, startHour: startHour != null && startHour >= h ? null : startHour, endHour: h })}
          title="Hasta qué hora"
          placeholder="Hasta"
          minHour={minEnd}
        />
      </View>
    </View>
  );
}
