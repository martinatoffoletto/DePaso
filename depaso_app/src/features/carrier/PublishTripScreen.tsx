import { useCallback, useState } from "react";
import { View, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert, Modal, Text } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { routesService } from "@/src/services/carriers";
import { CarrierRoute } from "@/src/types";
import { forwardGeocode, reverseGeocode } from "@/src/utils/geocoding";
import { T } from "@/constants/tokens";

const DAYS = [
  { key: "mon", label: "L" }, { key: "tue", label: "M" }, { key: "wed", label: "X" },
  { key: "thu", label: "J" }, { key: "fri", label: "V" }, { key: "sat", label: "S" },
  { key: "sun", label: "D" },
];

const DURATIONS = [
  { hours: 2, label: "2 h" },
  { hours: 4, label: "4 h" },
  { hours: 8, label: "8 h" },
  { hours: 12, label: "12 h" },
];

type RouteKind = "collaborative_route" | "dedicated_window";

function parseLocalDateTime(date: string, time: string): Date | null {
  const dp = date.trim().split("/");
  const tp = time.trim().split(":");
  if (dp.length !== 3 || tp.length !== 2) return null;
  const [d, m, y] = dp.map(Number);
  const [h, min] = tp.map(Number);
  if ([d, m, y, h, min].some((n) => isNaN(n))) return null;
  if (m < 1 || m > 12 || d < 1 || d > 31 || h < 0 || h > 23 || min < 0 || min > 59) return null;
  return new Date(y, m - 1, d, h, min);
}

function Label({ text }: { text: string }) {
  return <Text className="text-[9.5px] tracking-[1.5px] text-inkMute uppercase font-bold mb-2">{text}</Text>;
}

function RouteAddress({ lat, lon }: { lat: number; lon: number }) {
  const [addr, setAddr] = useState(`${lat.toFixed(3)}, ${lon.toFixed(3)}`);
  useFocusEffect(useCallback(() => {
    let alive = true;
    reverseGeocode(lat, lon).then((r) => { if (alive) setAddr(r); }).catch(() => {});
    return () => { alive = false; };
  }, [lat, lon]));
  return <Text className="text-[12.5px] text-ink font-medium flex-1" numberOfLines={1}>{addr}</Text>;
}

export default function PublishTripScreen({ onClose }: { onClose: () => void }) {
  const insets = useSafeAreaInsets();

  const [kind, setKind] = useState<RouteKind>("collaborative_route");
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [days, setDays] = useState<string[]>(["mon", "tue", "wed", "thu", "fri"]);
  const [durationH, setDurationH] = useState(4);
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");
  const [saving, setSaving] = useState(false);
  const [myRoutes, setMyRoutes] = useState<CarrierRoute[]>([]);

  useFocusEffect(useCallback(() => {
    routesService.mine().then(setMyRoutes).catch(() => {});
  }, []));

  function toggleDay(key: string) {
    setDays((d) => (d.includes(key) ? d.filter((x) => x !== key) : [...d, key]));
  }

  async function publish() {
    if (!origin.trim()) {
      Alert.alert("Faltan datos", "Completá el origen de tu viaje.");
      return;
    }
    if (kind === "collaborative_route" && !destination.trim()) {
      Alert.alert("Faltan datos", "Completá el destino para la ruta colaborativa.");
      return;
    }

    let windowStartISO: string;
    let windowEndISO: string;

    if (kind === "dedicated_window") {
      if (!startDate || !startTime || !endDate || !endTime) {
        Alert.alert("Faltan fechas", "Completá inicio y fin de la ventana dedicada.");
        return;
      }
      const parsedStart = parseLocalDateTime(startDate, startTime);
      const parsedEnd = parseLocalDateTime(endDate, endTime);
      if (!parsedStart || !parsedEnd) {
        Alert.alert("Formato incorrecto", "Usá DD/MM/AAAA para la fecha y HH:MM para la hora.");
        return;
      }
      if (parsedEnd <= parsedStart) {
        Alert.alert("Fechas inválidas", "El fin de la ventana debe ser posterior al inicio.");
        return;
      }
      windowStartISO = parsedStart.toISOString();
      windowEndISO = parsedEnd.toISOString();
    } else {
      const now = new Date();
      windowStartISO = now.toISOString();
      windowEndISO = new Date(now.getTime() + durationH * 3600 * 1000).toISOString();
    }

    setSaving(true);
    try {
      const [o, dest] = await Promise.all([
        forwardGeocode(origin),
        destination.trim() ? forwardGeocode(destination) : Promise.resolve(null),
      ]);

      if (!o) {
        Alert.alert("Dirección no encontrada", "Revisá el origen e intentá de nuevo.");
        return;
      }
      if (kind === "collaborative_route" && !dest) {
        Alert.alert("Dirección no encontrada", "Revisá el destino e intentá de nuevo.");
        return;
      }

      const route = await routesService.publish({
        kind,
        origin_lat: o.lat,
        origin_lon: o.lon,
        ...(dest ? { destination_lat: dest.lat, destination_lon: dest.lon } : {}),
        window_start: windowStartISO,
        window_end: windowEndISO,
        ...(kind === "collaborative_route" && days.length > 0
          ? { recurrence_days: days.join(",") }
          : {}),
      });

      setMyRoutes((r) => [...r, route]);
      setOrigin("");
      setDestination("");
      setStartDate(""); setStartTime(""); setEndDate(""); setEndTime("");

      Alert.alert(
        "Publicado",
        kind === "dedicated_window"
          ? "Tu ventana dedicada fue publicada."
          : "Te vamos a ofrecer pedidos que te queden de paso.",
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
  const isDedicated = kind === "dedicated_window";

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
              ? "Publicá una franja horaria específica para hacer entregas dedicadas."
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
              { k: "collaborative_route" as RouteKind, icon: "repeat" as const, label: "Habitual", sub: "Repetición diaria" },
              { k: "dedicated_window" as RouteKind, icon: "calendar-clock" as const, label: "Ventana dedicada", sub: "Fecha y hora fija" },
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
                    <Text className={`text-[10.5px] ${active ? "text-[#F4EFE3]/50" : "text-inkMute"}`}>{opt.sub}</Text>
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

          {/* Route block */}
          <View>
            <Label text="Desde" />
            <View className="flex-row items-center gap-[10px] bg-card rounded-[14px] border-[1.2px] border-border px-[14px] h-[52px]">
              <View className="w-[10px] h-[10px] rounded-full border-2 border-forest" />
              <TextInput
                className="flex-1 text-[15px] text-ink font-medium"
                placeholder="Ej: Caballito, CABA"
                placeholderTextColor={T.inkFaint}
                value={origin}
                onChangeText={setOrigin}
              />
            </View>
          </View>

          <View>
            <Label text={isDedicated ? "Hasta (opcional)" : "Hasta"} />
            <View className="flex-row items-center gap-[10px] bg-card rounded-[14px] border-[1.2px] border-border px-[14px] h-[52px]">
              <View className="w-[10px] h-[10px] rounded-[3px] bg-emerald rotate-45" />
              <TextInput
                className="flex-1 text-[15px] text-ink font-medium"
                placeholder="Ej: Tigre Centro"
                placeholderTextColor={T.inkFaint}
                value={destination}
                onChangeText={setDestination}
              />
            </View>
          </View>

          {/* Collaborative: days + duration */}
          {!isDedicated && (
            <>
              <View>
                <Label text="Días" />
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
                <Label text="Disponible desde ahora por" />
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
            </>
          )}

          {/* Dedicated: date + time */}
          {isDedicated && (
            <>
              <View>
                <Label text="Inicio de ventana" />
                <View className="flex-row gap-2">
                  <View className="flex-[2] flex-row items-center gap-[10px] bg-card rounded-[14px] border-[1.2px] border-border px-[14px] h-[52px]">
                    <MaterialCommunityIcons name="calendar-outline" size={16} color={T.inkMute} />
                    <TextInput className="flex-1 text-[15px] text-ink font-medium" placeholder="DD/MM/AAAA" placeholderTextColor={T.inkFaint} value={startDate} onChangeText={setStartDate} keyboardType="numeric" />
                  </View>
                  <View className="flex-1 flex-row items-center gap-[10px] bg-card rounded-[14px] border-[1.2px] border-border px-[14px] h-[52px]">
                    <MaterialCommunityIcons name="clock-outline" size={16} color={T.inkMute} />
                    <TextInput className="flex-1 text-[15px] text-ink font-medium" placeholder="HH:MM" placeholderTextColor={T.inkFaint} value={startTime} onChangeText={setStartTime} keyboardType="numeric" />
                  </View>
                </View>
              </View>

              <View>
                <Label text="Fin de ventana" />
                <View className="flex-row gap-2">
                  <View className="flex-[2] flex-row items-center gap-[10px] bg-card rounded-[14px] border-[1.2px] border-border px-[14px] h-[52px]">
                    <MaterialCommunityIcons name="calendar-outline" size={16} color={T.inkMute} />
                    <TextInput className="flex-1 text-[15px] text-ink font-medium" placeholder="DD/MM/AAAA" placeholderTextColor={T.inkFaint} value={endDate} onChangeText={setEndDate} keyboardType="numeric" />
                  </View>
                  <View className="flex-1 flex-row items-center gap-[10px] bg-card rounded-[14px] border-[1.2px] border-border px-[14px] h-[52px]">
                    <MaterialCommunityIcons name="clock-outline" size={16} color={T.inkMute} />
                    <TextInput className="flex-1 text-[15px] text-ink font-medium" placeholder="HH:MM" placeholderTextColor={T.inkFaint} value={endTime} onChangeText={setEndTime} keyboardType="numeric" />
                  </View>
                </View>
              </View>
            </>
          )}

          {/* Info band */}
          <View className="flex-row gap-[10px] bg-mint rounded-[14px] p-[14px] border border-border">
            <MaterialCommunityIcons name="information-outline" size={16} color={T.forest} style={{ marginTop: 1 }} />
            <Text className="flex-1 text-[13px] text-forest leading-[19px]">
              {isDedicated
                ? "Solo vas a recibir pedidos dentro de la franja que elegís."
                : "Te ofrecemos paquetes que van en tu mismo sentido, sin desviarte más de un 15%."}
            </Text>
          </View>

          {/* Active routes */}
          {activeRoutes.length > 0 && (
            <View className="gap-2">
              <Label text="Viajes activos" />
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
