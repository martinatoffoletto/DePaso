import { useState } from "react";
import { View, TouchableOpacity, Text } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { T } from "@/constants/tokens";
import { HourSelect } from "@/src/shared/ui/HourSelect";
import { MiniCalendar } from "@/src/shared/ui/MiniCalendar";
import {
  PickupSchedule, todayISO, tomorrowISO, dateToISO, dayLabel,
} from "@/src/sender/pickupSchedule";

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>["name"];

const OPTIONS: { kind: PickupSchedule["kind"]; label: string; icon: IconName }[] = [
  { kind: "asap",   label: "Inmediato",      icon: "flash-outline" },
  { kind: "window", label: "Franja horaria", icon: "timer-sand" },
  { kind: "exact",  label: "Hora exacta",    icon: "clock-outline" },
];

function emptyFor(kind: PickupSchedule["kind"]): PickupSchedule {
  if (kind === "window") return { kind: "window", date: todayISO(), startHour: null, endHour: null };
  if (kind === "exact") return { kind: "exact", date: todayISO(), hour: null };
  return { kind: "asap" };
}

function DayChip({ label, selected, onPress, icon }: {
  label: string; selected: boolean; onPress: () => void; icon?: IconName;
}) {
  return (
    <TouchableOpacity
      className={`flex-row items-center gap-[5px] rounded-full px-[12px] py-[6px] border ${selected ? "bg-forest border-forest" : "bg-cardSoft border-borderSoft"}`}
      onPress={onPress}
      activeOpacity={0.78}
    >
      {icon && <MaterialCommunityIcons name={icon} size={13} color={selected ? "#F4EFE3" : T.forest} />}
      <Text className={`text-xs font-semibold ${selected ? "text-[#F4EFE3]" : "text-ink"}`}>{label}</Text>
    </TouchableOpacity>
  );
}

/** Card "¿Cuándo lo retiramos?" — inmediato, franja horaria u hora exacta (con día). */
export function PickupScheduleCard({ value, onChange }: {
  value: PickupSchedule;
  onChange: (s: PickupSchedule) => void;
}) {
  const [calOpen, setCalOpen] = useState(false);

  const setDate = (iso: string) => {
    if (value.kind === "asap") return;
    onChange({ ...value, date: iso });
  };

  const isOtherDay = value.kind !== "asap" && value.date !== todayISO() && value.date !== tomorrowISO();

  return (
    <View className="bg-card rounded-2xl border border-border p-[14px] gap-3">
      <View className="flex-row items-center gap-[10px]">
        <View className="w-8 h-8 rounded-[10px] bg-cardSoft border border-borderSoft items-center justify-center shrink-0">
          <MaterialCommunityIcons name="clock-outline" size={18} color={T.forest} />
        </View>
        <Text className="text-[9px] tracking-[1.5px] text-inkMute uppercase">¿CUÁNDO LO RETIRAMOS?</Text>
      </View>

      <View className="flex-row gap-[6px]">
        {OPTIONS.map((opt) => {
          const selected = value.kind === opt.kind;
          return (
            <TouchableOpacity
              key={opt.kind}
              className={`flex-1 flex-row items-center justify-center gap-[5px] rounded-full px-[8px] py-[7px] border ${selected ? "bg-forest border-forest" : "bg-cardSoft border-borderSoft"}`}
              onPress={() => { if (!selected) { setCalOpen(false); onChange(emptyFor(opt.kind)); } }}
              activeOpacity={0.78}
            >
              <MaterialCommunityIcons name={opt.icon} size={13} color={selected ? "#F4EFE3" : T.forest} />
              <Text className={`text-[11.5px] font-semibold ${selected ? "text-[#F4EFE3]" : "text-ink"}`}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {value.kind !== "asap" && (
        <>
          {/* Day */}
          <View>
            <Text className="text-[9px] tracking-[1.2px] text-inkMute uppercase mb-[6px]">DÍA</Text>
            <View className="flex-row gap-[6px] flex-wrap">
              <DayChip
                label="Hoy"
                selected={!calOpen && value.date === todayISO()}
                onPress={() => { setCalOpen(false); setDate(todayISO()); }}
              />
              <DayChip
                label="Mañana"
                selected={!calOpen && value.date === tomorrowISO()}
                onPress={() => { setCalOpen(false); setDate(tomorrowISO()); }}
              />
              <DayChip
                label={isOtherDay ? dayLabel(value.date) : "Otro día"}
                icon="calendar-month-outline"
                selected={calOpen || isOtherDay}
                onPress={() => setCalOpen((o) => !o)}
              />
            </View>
            {calOpen && (
              <View className="mt-2">
                <MiniCalendar
                  selected={(() => {
                    const [y, m, d] = value.date.split("-").map(Number);
                    return new Date(y, m - 1, d);
                  })()}
                  onSelect={(d) => { setDate(dateToISO(d)); setCalOpen(false); }}
                />
              </View>
            )}
          </View>

          {/* Hours */}
          {value.kind === "window" ? (
            <View className="flex-row gap-2">
              <View className="flex-1">
                <Text className="text-[9px] tracking-[1.2px] text-inkMute uppercase mb-[6px]">DESDE</Text>
                <HourSelect
                  value={value.startHour}
                  onSelect={(h) => onChange({ ...value, startHour: h, endHour: value.endHour != null && value.endHour <= h ? null : value.endHour })}
                  title="Desde qué hora"
                  placeholder="Desde"
                />
              </View>
              <View className="flex-1">
                <Text className="text-[9px] tracking-[1.2px] text-inkMute uppercase mb-[6px]">HASTA</Text>
                <HourSelect
                  value={value.endHour}
                  onSelect={(h) => onChange({ ...value, startHour: value.startHour != null && value.startHour >= h ? null : value.startHour, endHour: h })}
                  title="Hasta qué hora"
                  placeholder="Hasta"
                />
              </View>
            </View>
          ) : (
            <View>
              <Text className="text-[9px] tracking-[1.2px] text-inkMute uppercase mb-[6px]">HORA</Text>
              <HourSelect
                value={value.hour}
                onSelect={(h) => onChange({ ...value, hour: h })}
                title="Hora de retiro"
                placeholder="Elegí la hora de retiro"
              />
            </View>
          )}
        </>
      )}
    </View>
  );
}
