import { useCallback, useMemo, useState } from "react";
import { View, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Modal, Text } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { routesService } from "@/src/shared/api/carriers";
import { CarrierRoute } from "@/src/shared/types";
import { AddressField, SelectedAddress } from "@/src/shared/ui/AddressField";
import { FieldLabel } from "@/src/shared/ui/Field";
import { HourSelect } from "./components/HourSelect";
import { MiniCalendar } from "./components/MiniCalendar";
import { RouteAddress } from "./components/RouteAddress";
import { T } from "@/constants/tokens";

const DAYS = [
  { key: "mon", label: "L" }, { key: "tue", label: "M" }, { key: "wed", label: "X" },
  { key: "thu", label: "J" }, { key: "fri", label: "V" }, { key: "sat", label: "S" },
  { key: "sun", label: "D" },
];
// JS Date.getDay(): 0 = Sunday … 6 = Saturday.
const DAY_TO_JS: Record<string, number> = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };

const DURATIONS = [
  { hours: 2, label: "2 h" },
  { hours: 4, label: "4 h" },
  { hours: 8, label: "8 h" },
  { hours: 12, label: "12 h" },
];

type RouteKind = "collaborative_route" | "dedicated_window";

/** Next datetime matching one of the recurrence days at the given hour. */
function nextOccurrence(days: string[], hour: number): Date {
  const now = new Date();
  for (let i = 0; i < 8; i++) {
    const candidate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i, hour, 0, 0);
    if (days.includes(Object.keys(DAY_TO_JS).find((k) => DAY_TO_JS[k] === candidate.getDay())!) && candidate > now) {
      return candidate;
    }
  }
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, hour, 0, 0);
}

export default function PublishTripScreen({ onClose }: { onClose: () => void }) {
  const insets = useSafeAreaInsets();

  const [kind, setKind] = useState<RouteKind>("collaborative_route");

  // Addresses — text mirrors the field, coords only exist after picking a suggestion.
  const [originText, setOriginText] = useState("");
  const [originSel, setOriginSel] = useState<SelectedAddress | null>(null);
  const [destText, setDestText] = useState("");
  const [destSel, setDestSel] = useState<SelectedAddress | null>(null);

  // Habitual: recurrence days + start hour + duration.
  const [days, setDays] = useState<string[]>(["mon", "tue", "wed", "thu", "fri"]);
  const [startHour, setStartHour] = useState<number | null>(9);

  // Dedicated window: day (calendar or "now") + hour + duration.
  const [startNow, setStartNow] = useState(true);
  const [windowDay, setWindowDay] = useState<Date | null>(null);
  const [windowHour, setWindowHour] = useState<number | null>(null);

  const [durationH, setDurationH] = useState(4);
  const [saving, setSaving] = useState(false);
  const [myRoutes, setMyRoutes] = useState<CarrierRoute[]>([]);

  useFocusEffect(useCallback(() => {
    routesService.mine().then(setMyRoutes).catch(() => {});
  }, []));

  const isDedicated = kind === "dedicated_window";

  const startPreview = useMemo(() => {
    if (isDedicated) {
      if (startNow) return "Ahora mismo";
      if (windowDay && windowHour != null) {
        return `${windowDay.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })} · ${String(windowHour).padStart(2, "0")}:00`;
      }
      return null;
    }
    return null;
  }, [isDedicated, startNow, windowDay, windowHour]);

  function toggleDay(key: string) {
    setDays((d) => (d.includes(key) ? d.filter((x) => x !== key) : [...d, key]));
  }

  async function publish() {
    if (!originSel) {
      Alert.alert("Falta el origen", "Buscá la dirección y elegila de la lista de sugerencias.");
      return;
    }
    if (kind === "collaborative_route" && !destSel) {
      Alert.alert("Falta el destino", "Buscá la dirección y elegila de la lista de sugerencias.");
      return;
    }

    let windowStart: Date;
    if (isDedicated) {
      if (startNow) {
        windowStart = new Date();
      } else {
        if (!windowDay || windowHour == null) {
          Alert.alert("Falta el inicio", "Elegí el día en el calendario y la hora de inicio, o tocá «Ahora».");
          return;
        }
        windowStart = new Date(windowDay.getFullYear(), windowDay.getMonth(), windowDay.getDate(), windowHour, 0, 0);
        if (windowStart <= new Date()) {
          Alert.alert("Inicio inválido", "La ventana tiene que empezar en el futuro. Si querés arrancar ya, tocá «Ahora».");
          return;
        }
      }
    } else {
      if (days.length === 0) {
        Alert.alert("Faltan los días", "Elegí al menos un día de la semana para tu trayecto habitual.");
        return;
      }
      if (startHour == null) {
        Alert.alert("Falta la hora", "Elegí a qué hora arrancás ese trayecto.");
        return;
      }
      windowStart = nextOccurrence(days, startHour);
    }
    const windowEnd = new Date(windowStart.getTime() + durationH * 3600 * 1000);

    setSaving(true);
    try {
      const route = await routesService.publish({
        kind,
        origin_lat: originSel.lat,
        origin_lon: originSel.lon,
        ...(destSel ? { destination_lat: destSel.lat, destination_lon: destSel.lon } : {}),
        window_start: windowStart.toISOString(),
        window_end: windowEnd.toISOString(),
        ...(kind === "collaborative_route" ? { recurrence_days: days.join(",") } : {}),
      });

      setMyRoutes((r) => [...r, route]);
      setOriginText(""); setOriginSel(null);
      setDestText(""); setDestSel(null);
      setWindowDay(null); setWindowHour(null); setStartNow(true);

      Alert.alert(
        "Publicado",
        isDedicated
          ? "Tu ventana dedicada fue publicada. Vas a recibir pedidos compatibles dentro de esa franja."
          : "Te vamos a ofrecer pedidos que te queden de paso en ese trayecto.",
      );
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail;
      Alert.alert("No se pudo publicar", typeof detail === "string" ? detail : "Intentá de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(routeId: number) {
    try {
      await routesService.deactivate(routeId);
      setMyRoutes((r) => r.filter((x) => x.id !== routeId));
    } catch {
      Alert.alert("Error", "No se pudo eliminar el viaje.");
    }
  }

  const activeRoutes = myRoutes.filter((r) => r.is_active);

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View className="flex-1 bg-bg" style={{ paddingTop: 20 }}>
        {/* Header */}
        <View className="flex-row items-center justify-between px-5 pb-1">
          <TouchableOpacity
            onPress={onClose}
            hitSlop={10}
            className="w-[38px] h-[38px] rounded-xl border border-border bg-card items-center justify-center"
            accessibilityLabel="Cerrar"
          >
            <MaterialCommunityIcons name="arrow-left" size={18} color={T.ink} />
          </TouchableOpacity>
          <View className="flex-row items-center gap-[6px] bg-mint px-[10px] py-[5px] rounded-[9px]">
            <MaterialCommunityIcons name="leaf" size={11} color={T.forest} />
            <Text className="text-[9px] tracking-[1.2px] text-forest font-bold uppercase">
              {isDedicated ? "Dedicado" : "Colaborativo"}
            </Text>
          </View>
          <View className="w-[38px]" />
        </View>

        {/* Title */}
        <View className="px-5 pt-4">
          <Text className="text-[10px] tracking-[2.5px] text-emeraldDeep uppercase mb-[6px]">Publicá un viaje</Text>
          <Text className="text-[28px] font-bold text-ink tracking-[-1px] leading-[30px]">
            {isDedicated ? "Elegí tu ventana" : "¿A dónde vas a ir igual?"}
          </Text>
          <Text className="text-[12.5px] text-inkSoft leading-[18px] mt-2">
            {isDedicated
              ? "Avisá desde qué zona y en qué franja horaria tenés capacidad para hacer entregas dedicadas."
              : "Decinos tu ruta y horario. Te ofrecemos paquetes que van en el mismo sentido."}
          </Text>
        </View>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 20, gap: 16, paddingBottom: insets.bottom + 120 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Kind toggle */}
          <View className="gap-2">
            {([
              { k: "collaborative_route" as RouteKind, icon: "repeat" as const, label: "Habitual", sub: "Tu trayecto de todos los días" },
              { k: "dedicated_window" as RouteKind, icon: "calendar-clock" as const, label: "Ventana dedicada", sub: "Zona + franja horaria puntual" },
            ]).map((opt) => {
              const active = kind === opt.k;
              return (
                <TouchableOpacity
                  key={opt.k}
                  className={`flex-row items-center gap-3 rounded-2xl p-[14px] border-[1.2px] ${active ? "bg-forest border-forest" : "bg-card border-border"}`}
                  onPress={() => setKind(opt.k)}
                  activeOpacity={0.85}
                >
                  <View className={`w-8 h-8 rounded-[10px] items-center justify-center ${active ? "bg-[#F4EFE3]/15" : "bg-cardSoft"}`}>
                    <MaterialCommunityIcons name={opt.icon} size={15} color={active ? T.lime : T.inkMute} />
                  </View>
                  <View className="flex-1">
                    <Text className={`text-sm font-bold ${active ? "text-[#F4EFE3]" : "text-ink"}`}>{opt.label}</Text>
                    <Text className={`text-[10.5px] ${active ? "text-[#F4EFE3]/75" : "text-inkMute"}`}>{opt.sub}</Text>
                  </View>
                  {active && (
                    <View className="w-[18px] h-[18px] rounded-full bg-lime items-center justify-center">
                      <MaterialCommunityIcons name="check" size={11} color={T.forest} />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Addresses — same autocomplete the shipper uses */}
          <AddressField
            label={isDedicated ? "Zona o dirección base" : "Desde"}
            placeholder={isDedicated ? "Ej: Palermo, CABA" : "Ej: Av. Rivadavia 4800, Caballito"}
            kind="origin"
            value={originText}
            onChangeText={(t) => { setOriginText(t); setOriginSel(null); }}
            onSelect={(sel) => { setOriginText(sel.label); setOriginSel(sel); }}
          />
          {!isDedicated && (
            <AddressField
              label="Hasta"
              placeholder="Ej: Av. Cazadores 2100, Tigre"
              kind="destination"
              value={destText}
              onChangeText={(t) => { setDestText(t); setDestSel(null); }}
              onSelect={(sel) => { setDestText(sel.label); setDestSel(sel); }}
            />
          )}

          {/* Collaborative: days + start hour + duration */}
          {!isDedicated && (
            <>
              <View>
                <FieldLabel text="¿Qué días hacés este trayecto?" />
                <View className="flex-row gap-[6px]">
                  {DAYS.map((d) => {
                    const active = days.includes(d.key);
                    return (
                      <TouchableOpacity
                        key={d.key}
                        className={`flex-1 h-10 rounded-[11px] border-[1.2px] items-center justify-center ${active ? "bg-forest border-forest" : "bg-card border-border"}`}
                        onPress={() => toggleDay(d.key)}
                        activeOpacity={0.8}
                      >
                        <Text className={`text-[13px] font-semibold ${active ? "text-[#F4EFE3]" : "text-inkSoft"}`}>{d.label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View>
                <FieldLabel text="Hora de inicio" />
                <HourSelect value={startHour} onSelect={setStartHour} />
              </View>
            </>
          )}

          {/* Dedicated: "now" / calendar day + hour */}
          {isDedicated && (
            <>
              <View>
                <FieldLabel text="Inicio de ventana" />
                <View className="flex-row gap-2 mb-2">
                  <TouchableOpacity
                    className={`flex-1 h-11 rounded-[12px] border-[1.2px] flex-row items-center justify-center gap-[6px] ${startNow ? "bg-forest border-forest" : "bg-card border-border"}`}
                    onPress={() => setStartNow(true)}
                    activeOpacity={0.8}
                  >
                    <MaterialCommunityIcons name="lightning-bolt" size={14} color={startNow ? T.lime : T.inkMute} />
                    <Text className={`text-[13px] font-semibold ${startNow ? "text-[#F4EFE3]" : "text-inkSoft"}`}>Ahora</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className={`flex-1 h-11 rounded-[12px] border-[1.2px] flex-row items-center justify-center gap-[6px] ${!startNow ? "bg-forest border-forest" : "bg-card border-border"}`}
                    onPress={() => setStartNow(false)}
                    activeOpacity={0.8}
                  >
                    <MaterialCommunityIcons name="calendar-outline" size={14} color={!startNow ? T.lime : T.inkMute} />
                    <Text className={`text-[13px] font-semibold ${!startNow ? "text-[#F4EFE3]" : "text-inkSoft"}`}>Elegir día y hora</Text>
                  </TouchableOpacity>
                </View>
                {!startNow && (
                  <View className="gap-2">
                    <MiniCalendar selected={windowDay} onSelect={setWindowDay} />
                    <HourSelect value={windowHour} onSelect={setWindowHour} />
                  </View>
                )}
              </View>
            </>
          )}

          {/* Duration — shared by both kinds */}
          <View>
            <FieldLabel text={isDedicated ? "¿Por cuántas horas?" : "¿Cuántas horas dura tu disponibilidad?"} />
            <View className="flex-row gap-2">
              {DURATIONS.map((d) => {
                const active = durationH === d.hours;
                return (
                  <TouchableOpacity
                    key={d.hours}
                    className={`flex-1 h-10 rounded-[11px] border-[1.2px] items-center justify-center ${active ? "bg-forest border-forest" : "bg-card border-border"}`}
                    onPress={() => setDurationH(d.hours)}
                    activeOpacity={0.8}
                  >
                    <Text className={`text-[13px] font-semibold ${active ? "text-[#F4EFE3]" : "text-inkSoft"}`}>{d.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Start preview (dedicated) */}
          {isDedicated && startPreview && (
            <View className="flex-row items-center gap-[10px] bg-card border border-border rounded-[14px] px-[14px] py-3">
              <MaterialCommunityIcons name="calendar-check-outline" size={16} color={T.forest} />
              <Text className="flex-1 text-[13px] text-ink font-medium">
                Empieza: <Text className="font-bold">{startPreview}</Text> · {durationH} h
              </Text>
            </View>
          )}

          {/* Info band */}
          <View className="flex-row gap-[10px] bg-mint rounded-[14px] p-[14px] border border-border">
            <MaterialCommunityIcons name="information-outline" size={16} color={T.forest} style={{ marginTop: 1 }} />
            <Text className="flex-1 text-[13px] text-forest leading-[19px]">
              {isDedicated
                ? "Mientras la ventana esté activa vas a recibir pedidos compatibles con tu vehículo y tu capacidad restante."
                : "Te ofrecemos paquetes que van en tu mismo sentido, sin desviarte más de un 15%."}
            </Text>
          </View>

          {/* Active routes */}
          {activeRoutes.length > 0 && (
            <View className="gap-2">
              <FieldLabel text="Viajes activos" />
              {activeRoutes.map((r) => (
                <View key={r.id} className="flex-row items-center gap-3 bg-card rounded-[14px] border border-borderSoft p-3">
                  <View className="w-[34px] h-[34px] rounded-[10px] bg-mint items-center justify-center border border-border">
                    <MaterialCommunityIcons
                      name={r.kind === "dedicated_window" ? "calendar-clock" : "map-marker-path"}
                      size={16}
                      color={T.forest}
                    />
                  </View>
                  <View className="flex-1">
                    {r.destination_lat != null ? (
                      <View className="flex-row items-center gap-1">
                        <RouteAddress lat={r.origin_lat} lon={r.origin_lon} />
                        <MaterialCommunityIcons name="arrow-right" size={12} color={T.inkMute} />
                        <RouteAddress lat={r.destination_lat} lon={r.destination_lon ?? 0} />
                      </View>
                    ) : (
                      <RouteAddress lat={r.origin_lat} lon={r.origin_lon} />
                    )}
                    {r.kind === "dedicated_window" ? (
                      <Text className="text-[10px] tracking-[0.5px] text-inkMute mt-1">
                        {new Date(r.window_start).toLocaleDateString("es-AR")}{" "}
                        {new Date(r.window_start).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
                        {" → "}
                        {new Date(r.window_end).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
                      </Text>
                    ) : r.recurrence_days ? (
                      <Text className="text-[10px] tracking-[0.5px] text-inkMute mt-1">{r.recurrence_days.toUpperCase()}</Text>
                    ) : null}
                  </View>
                  <TouchableOpacity onPress={() => remove(r.id)} hitSlop={10} className="p-1" accessibilityLabel="Eliminar viaje">
                    <MaterialCommunityIcons name="trash-can-outline" size={18} color={T.red} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </ScrollView>

        {/* Footer CTA */}
        <View className="absolute left-0 right-0 bottom-0 px-4 pt-6" style={{ paddingBottom: insets.bottom + 16 }}>
          <TouchableOpacity
            className="bg-forest rounded-2xl h-[54px] flex-row items-center justify-center gap-[10px]"
            style={{ shadowColor: T.forest, shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.35, shadowRadius: 24, elevation: 6 }}
            onPress={publish}
            disabled={saving}
            activeOpacity={0.9}
          >
            {saving ? (
              <ActivityIndicator color="#F4EFE3" />
            ) : (
              <>
                <Text className="text-[15px] font-bold text-[#F4EFE3]">{isDedicated ? "Publicar ventana" : "Publicar viaje"}</Text>
                <MaterialCommunityIcons name="arrow-right" size={18} color="#F4EFE3" />
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
