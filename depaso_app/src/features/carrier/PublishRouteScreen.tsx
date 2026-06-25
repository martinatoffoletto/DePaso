import { useCallback, useState } from "react";
import { View, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert, StyleSheet, Modal } from "react-native";
import { Text } from "react-native-paper";
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
  return (
    <Text style={{ fontSize: 9.5, letterSpacing: 1.5, color: T.inkMute, textTransform: "uppercase", fontWeight: "700", marginBottom: 8 }}>
      {text}
    </Text>
  );
}

function RouteAddress({ lat, lon }: { lat: number; lon: number }) {
  const [addr, setAddr] = useState(`${lat.toFixed(3)}, ${lon.toFixed(3)}`);
  useCallback(() => {
    reverseGeocode(lat, lon).then(setAddr).catch(() => {});
  }, [lat, lon])();
  return <Text style={{ fontSize: 12.5, color: T.ink, fontWeight: "500", flex: 1 }} numberOfLines={1}>{addr}</Text>;
}

export default function PublishRouteScreen({ onClose }: { onClose: () => void }) {
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
      Alert.alert("Faltan datos", "Completá el origen de tu trayecto.");
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
          : "Te vamos a sugerir pedidos que te queden de paso.",
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
      Alert.alert("Error", "No se pudo eliminar el trayecto.");
    }
  }

  const activeRoutes = myRoutes.filter((r) => r.is_active);
  const isDedicated = kind === "dedicated_window";

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[s.container, { paddingTop: 20 }]}>
        {/* ── Header ── */}
        <View style={s.header}>
          <View style={{ flex: 1 }}>
            <Text style={s.eyebrow}>{isDedicated ? "VENTANA DEDICADA" : "RUTA COLABORATIVA"}</Text>
            <Text style={s.title}>{isDedicated ? "Ventana de horario" : "Tu trayecto habitual"}</Text>
          </View>
          <TouchableOpacity onPress={onClose} hitSlop={10} style={s.closeBtn}>
            <MaterialCommunityIcons name="close" size={18} color={T.ink} />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20, gap: 18, paddingBottom: insets.bottom + 32 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Kind toggle ── */}
          <View style={s.kindRow}>
            {([
              { k: "collaborative_route" as RouteKind, icon: "repeat" as const,         label: "Habitual",          sub: "Repetición diaria" },
              { k: "dedicated_window"   as RouteKind, icon: "calendar-clock" as const,  label: "Ventana dedicada",  sub: "Fecha y hora fija" },
            ]).map(opt => {
              const active = kind === opt.k;
              return (
                <TouchableOpacity
                  key={opt.k}
                  style={[s.kindBtn, active && s.kindBtnActive]}
                  onPress={() => setKind(opt.k)}
                  activeOpacity={0.8}
                >
                  <View style={{ width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: active ? "rgba(244,239,227,0.15)" : T.cardSoft }}>
                    <MaterialCommunityIcons name={opt.icon} size={15} color={active ? T.lime : T.inkMute} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.kindText, active && s.kindTextActive]}>{opt.label}</Text>
                    <Text style={{ fontSize: 10.5, color: active ? "rgba(244,239,227,0.5)" : T.inkMute }}>{opt.sub}</Text>
                  </View>
                  {active && (
                    <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: T.lime, alignItems: "center", justifyContent: "center" }}>
                      <MaterialCommunityIcons name="check" size={11} color={T.forest} />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ── Info banner ── */}
          <View style={{ flexDirection: "row", gap: 10, backgroundColor: T.mint, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: T.border }}>
            <MaterialCommunityIcons name="information-outline" size={16} color={T.forest} style={{ marginTop: 1 }} />
            <Text style={{ flex: 1, fontSize: 13, color: T.forest, lineHeight: 19 }}>
              {isDedicated
                ? "Publicá una ventana de tiempo específica para hacer entregas. Elegí la fecha y hora de inicio y fin exactas."
                : "Publicá el recorrido que ya hacés todos los días. Te sugerimos pedidos de paso, sin desviarte más de un 15%."}
            </Text>
          </View>

          {/* ── Origin ── */}
          <View>
            <Label text="Desde" />
            <View style={s.inputBox}>
              <View style={{ width: 9, height: 9, borderRadius: 5, borderWidth: 2, borderColor: T.forest }} />
              <TextInput
                style={s.input}
                placeholder="Ej: Caballito, CABA"
                placeholderTextColor={T.inkFaint}
                value={origin}
                onChangeText={setOrigin}
              />
            </View>
          </View>

          {/* ── Destination ── */}
          <View>
            <Label text={isDedicated ? "Hasta (opcional)" : "Hasta"} />
            <View style={s.inputBox}>
              <View style={{ width: 9, height: 9, borderRadius: 3, backgroundColor: T.emerald, transform: [{ rotate: "45deg" }] }} />
              <TextInput
                style={s.input}
                placeholder="Ej: Microcentro, CABA"
                placeholderTextColor={T.inkFaint}
                value={destination}
                onChangeText={setDestination}
              />
            </View>
          </View>

          {/* ── Collaborative: days + duration ── */}
          {!isDedicated && (
            <>
              <View>
                <Label text="Días" />
                <View style={{ flexDirection: "row", gap: 6 }}>
                  {DAYS.map((d) => {
                    const active = days.includes(d.key);
                    return (
                      <TouchableOpacity
                        key={d.key}
                        style={[s.dayBtn, active && s.dayBtnActive]}
                        onPress={() => toggleDay(d.key)}
                        activeOpacity={0.8}
                      >
                        <Text style={[s.dayText, active && s.dayTextActive]}>{d.label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View>
                <Label text="Disponible desde ahora por" />
                <View style={{ flexDirection: "row", gap: 8 }}>
                  {DURATIONS.map((d) => {
                    const active = durationH === d.hours;
                    return (
                      <TouchableOpacity
                        key={d.hours}
                        style={[s.durBtn, active && s.dayBtnActive]}
                        onPress={() => setDurationH(d.hours)}
                        activeOpacity={0.8}
                      >
                        <Text style={[s.dayText, active && s.dayTextActive]}>{d.label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </>
          )}

          {/* ── Dedicated: date+time ── */}
          {isDedicated && (
            <>
              <View>
                <Label text="Inicio de ventana" />
                <View style={s.dateRow}>
                  <View style={[s.inputBox, { flex: 2 }]}>
                    <MaterialCommunityIcons name="calendar-outline" size={16} color={T.inkMute} />
                    <TextInput style={s.input} placeholder="DD/MM/AAAA" placeholderTextColor={T.inkFaint} value={startDate} onChangeText={setStartDate} keyboardType="numeric" />
                  </View>
                  <View style={[s.inputBox, { flex: 1 }]}>
                    <MaterialCommunityIcons name="clock-outline" size={16} color={T.inkMute} />
                    <TextInput style={s.input} placeholder="HH:MM" placeholderTextColor={T.inkFaint} value={startTime} onChangeText={setStartTime} keyboardType="numeric" />
                  </View>
                </View>
              </View>

              <View>
                <Label text="Fin de ventana" />
                <View style={s.dateRow}>
                  <View style={[s.inputBox, { flex: 2 }]}>
                    <MaterialCommunityIcons name="calendar-outline" size={16} color={T.inkMute} />
                    <TextInput style={s.input} placeholder="DD/MM/AAAA" placeholderTextColor={T.inkFaint} value={endDate} onChangeText={setEndDate} keyboardType="numeric" />
                  </View>
                  <View style={[s.inputBox, { flex: 1 }]}>
                    <MaterialCommunityIcons name="clock-outline" size={16} color={T.inkMute} />
                    <TextInput style={s.input} placeholder="HH:MM" placeholderTextColor={T.inkFaint} value={endTime} onChangeText={setEndTime} keyboardType="numeric" />
                  </View>
                </View>
              </View>
            </>
          )}

          {/* ── Submit ── */}
          <TouchableOpacity style={s.publishBtn} onPress={publish} disabled={saving} activeOpacity={0.88}>
            {saving ? (
              <ActivityIndicator color="#F4EFE3" />
            ) : (
              <>
                <MaterialCommunityIcons name={isDedicated ? "calendar-check" : "map-marker-path"} size={18} color="#F4EFE3" />
                <Text style={s.publishText}>{isDedicated ? "Publicar ventana" : "Publicar trayecto"}</Text>
              </>
            )}
          </TouchableOpacity>

          {/* ── Active routes ── */}
          {activeRoutes.length > 0 && (
            <View style={{ gap: 8 }}>
              <Label text="Trayectos activos" />
              {activeRoutes.map((r) => (
                <View key={r.id} style={s.routeRow}>
                  <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: T.mint, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: T.border }}>
                    <MaterialCommunityIcons
                      name={r.kind === "dedicated_window" ? "calendar-clock" : "map-marker-path"}
                      size={16}
                      color={T.forest}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.routeText} numberOfLines={1}>
                      {r.origin_lat.toFixed(3)}, {r.origin_lon.toFixed(3)}
                      {r.destination_lat != null
                        ? ` → ${r.destination_lat.toFixed(3)}, ${r.destination_lon?.toFixed(3)}`
                        : ""}
                    </Text>
                    {r.kind === "dedicated_window" ? (
                      <Text style={s.routeMeta}>
                        {new Date(r.window_start).toLocaleDateString("es-AR")}{" "}
                        {new Date(r.window_start).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
                        {" → "}
                        {new Date(r.window_end).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
                      </Text>
                    ) : r.recurrence_days ? (
                      <Text style={s.routeMeta}>{r.recurrence_days.toUpperCase()}</Text>
                    ) : null}
                  </View>
                  <TouchableOpacity onPress={() => remove(r.id)} hitSlop={10} style={{ padding: 4 }}>
                    <MaterialCommunityIcons name="trash-can-outline" size={18} color={T.red} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },

  header: {
    flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between",
    paddingHorizontal: 20, paddingBottom: 4,
  },
  eyebrow: { fontSize: 9.5, letterSpacing: 2.5, color: T.emeraldDeep, textTransform: "uppercase", fontWeight: "700" },
  title: { fontSize: 26, fontWeight: "800", color: T.ink, letterSpacing: -0.8, marginTop: 4 },
  closeBtn: { width: 38, height: 38, borderRadius: 12, borderWidth: 1, borderColor: T.border, backgroundColor: T.card, alignItems: "center", justifyContent: "center" },

  kindRow: { gap: 8 },
  kindBtn: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 16, padding: 14, backgroundColor: T.card, borderWidth: 1.2, borderColor: T.border },
  kindBtnActive: { backgroundColor: T.forest, borderColor: T.forest },
  kindText: { fontSize: 14, fontWeight: "700", color: T.ink },
  kindTextActive: { color: "#F4EFE3" },

  inputBox: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: T.card, borderRadius: 14, borderWidth: 1.2, borderColor: T.border, paddingHorizontal: 14, height: 52 },
  input: { flex: 1, fontSize: 15, color: T.ink, fontWeight: "500" },
  dateRow: { flexDirection: "row", gap: 8 },

  dayBtn: { flex: 1, height: 40, borderRadius: 11, borderWidth: 1.2, borderColor: T.border, backgroundColor: T.card, alignItems: "center", justifyContent: "center" },
  durBtn: { flex: 1, height: 40, borderRadius: 11, borderWidth: 1.2, borderColor: T.border, backgroundColor: T.card, alignItems: "center", justifyContent: "center" },
  dayBtnActive: { backgroundColor: T.forest, borderColor: T.forest },
  dayText: { fontSize: 13, fontWeight: "600", color: T.inkSoft },
  dayTextActive: { color: "#F4EFE3" },

  publishBtn: { backgroundColor: T.forest, borderRadius: 16, height: 54, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, shadowColor: T.forest, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 5 },
  publishText: { color: "#F4EFE3", fontWeight: "700", fontSize: 15 },

  routeRow: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: T.card, borderRadius: 14, borderWidth: 1, borderColor: T.borderSoft, padding: 12 },
  routeText: { fontSize: 12.5, color: T.ink, fontWeight: "500" },
  routeMeta: { fontSize: 10, letterSpacing: 0.5, color: T.inkMute, marginTop: 2 },
});
