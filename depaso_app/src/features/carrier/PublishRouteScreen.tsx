import { useCallback, useState } from "react";
import { View, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert, StyleSheet, Modal } from "react-native";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { routesService } from "@/src/services/carriers";
import { CarrierRoute } from "@/src/types";
import { forwardGeocode } from "@/src/utils/geocoding";
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

export default function PublishRouteScreen({ onClose }: { onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [days, setDays] = useState<string[]>(["mon", "tue", "wed", "thu", "fri"]);
  const [durationH, setDurationH] = useState(4);
  const [saving, setSaving] = useState(false);
  const [myRoutes, setMyRoutes] = useState<CarrierRoute[]>([]);

  useFocusEffect(useCallback(() => {
    routesService.mine().then(setMyRoutes).catch(() => {});
  }, []));

  function toggleDay(key: string) {
    setDays(d => d.includes(key) ? d.filter(x => x !== key) : [...d, key]);
  }

  async function publish() {
    if (!origin.trim() || !destination.trim()) {
      Alert.alert("Faltan datos", "Completá origen y destino de tu trayecto.");
      return;
    }
    setSaving(true);
    try {
      const [o, d] = await Promise.all([forwardGeocode(origin), forwardGeocode(destination)]);
      if (!o || !d) {
        Alert.alert("Dirección no encontrada", "Revisá las direcciones e intentá de nuevo.");
        return;
      }
      const now = new Date();
      const end = new Date(now.getTime() + durationH * 3600 * 1000);
      const route = await routesService.publish({
        kind: "collaborative_route",
        origin_lat: o.lat,
        origin_lon: o.lon,
        destination_lat: d.lat,
        destination_lon: d.lon,
        window_start: now.toISOString(),
        window_end: end.toISOString(),
        recurrence_days: days.length ? days.join(",") : undefined,
      });
      setMyRoutes(r => [...r, route]);
      setOrigin("");
      setDestination("");
      Alert.alert("¡Trayecto publicado!", "Te vamos a sugerir pedidos que te queden de paso.");
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      Alert.alert("No se pudo publicar", typeof detail === "string" ? detail : "Intentá de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(routeId: number) {
    try {
      await routesService.deactivate(routeId);
      setMyRoutes(r => r.filter(x => x.id !== routeId));
    } catch {
      Alert.alert("Error", "No se pudo eliminar el trayecto.");
    }
  }

  const activeRoutes = myRoutes.filter(r => r.is_active);

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[s.container, { paddingTop: 16 }]}>
        <View style={s.header}>
          <View>
            <Text style={s.eyebrow}>MODALIDAD COLABORATIVA</Text>
            <Text style={s.title}>Tu trayecto habitual</Text>
          </View>
          <TouchableOpacity onPress={onClose} hitSlop={10} style={s.closeBtn}>
            <MaterialCommunityIcons name="close" size={18} color={T.ink} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: insets.bottom + 32 }} keyboardShouldPersistTaps="handled">
          <Text style={s.desc}>
            Publicá el recorrido que ya hacés todos los días (al trabajo, a la facultad).
            Te sugerimos pedidos que te queden de paso, sin desviarte más de un 15%.
          </Text>

          <View>
            <Text style={s.label}>DESDE</Text>
            <View style={s.inputBox}>
              <View style={{ width: 8, height: 8, borderRadius: 4, borderWidth: 1.8, borderColor: T.forest }} />
              <TextInput
                style={s.input}
                placeholder="Ej: Caballito"
                placeholderTextColor={T.inkFaint}
                value={origin}
                onChangeText={setOrigin}
              />
            </View>
          </View>

          <View>
            <Text style={s.label}>HASTA</Text>
            <View style={s.inputBox}>
              <View style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: T.emerald, transform: [{ rotate: "45deg" }] }} />
              <TextInput
                style={s.input}
                placeholder="Ej: Microcentro"
                placeholderTextColor={T.inkFaint}
                value={destination}
                onChangeText={setDestination}
              />
            </View>
          </View>

          <View>
            <Text style={s.label}>DÍAS</Text>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {DAYS.map(d => {
                const active = days.includes(d.key);
                return (
                  <TouchableOpacity
                    key={d.key}
                    style={[s.dayBtn, active && s.dayBtnActive]}
                    onPress={() => toggleDay(d.key)}
                  >
                    <Text style={[s.dayText, active && s.dayTextActive]}>{d.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View>
            <Text style={s.label}>DISPONIBLE DESDE AHORA POR</Text>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {DURATIONS.map(d => {
                const active = durationH === d.hours;
                return (
                  <TouchableOpacity
                    key={d.hours}
                    style={[s.durBtn, active && s.dayBtnActive]}
                    onPress={() => setDurationH(d.hours)}
                  >
                    <Text style={[s.dayText, active && s.dayTextActive]}>{d.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <TouchableOpacity style={s.publishBtn} onPress={publish} disabled={saving} activeOpacity={0.88}>
            {saving
              ? <ActivityIndicator color={T.lime} />
              : <>
                  <MaterialCommunityIcons name="map-marker-path" size={17} color={T.lime} />
                  <Text style={s.publishText}>Publicar trayecto</Text>
                </>}
          </TouchableOpacity>

          {activeRoutes.length > 0 && (
            <View style={{ gap: 8 }}>
              <Text style={s.label}>TRAYECTOS ACTIVOS</Text>
              {activeRoutes.map(r => (
                <View key={r.id} style={s.routeRow}>
                  <MaterialCommunityIcons name="map-marker-path" size={16} color={T.forest} />
                  <View style={{ flex: 1 }}>
                    <Text style={s.routeText}>
                      {r.origin_lat.toFixed(3)}, {r.origin_lon.toFixed(3)} → {r.destination_lat?.toFixed(3)}, {r.destination_lon?.toFixed(3)}
                    </Text>
                    {r.recurrence_days && <Text style={s.routeDays}>{r.recurrence_days.toUpperCase()}</Text>}
                  </View>
                  <TouchableOpacity onPress={() => remove(r.id)} hitSlop={8}>
                    <MaterialCommunityIcons name="trash-can-outline" size={17} color={T.red} />
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
  header: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", paddingHorizontal: 20 },
  eyebrow: { fontSize: 10, letterSpacing: 2.5, color: T.emeraldDeep, textTransform: "uppercase" },
  title: { fontSize: 24, fontWeight: "700", color: T.ink, letterSpacing: -0.7, marginTop: 4 },
  closeBtn: { width: 36, height: 36, borderRadius: 12, borderWidth: 1, borderColor: T.border, backgroundColor: T.card, alignItems: "center", justifyContent: "center" },
  desc: { fontSize: 13.5, color: T.inkSoft, lineHeight: 19 },

  label: { fontSize: 9.5, letterSpacing: 1.5, color: T.inkMute, textTransform: "uppercase", marginBottom: 8, fontWeight: "600" },
  inputBox: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: T.card, borderRadius: 14, borderWidth: 1.2, borderColor: T.border, paddingHorizontal: 14, height: 52 },
  input: { flex: 1, fontSize: 15, color: T.ink, fontWeight: "500" },

  dayBtn: { flex: 1, height: 38, borderRadius: 10, borderWidth: 1.2, borderColor: T.border, backgroundColor: T.card, alignItems: "center", justifyContent: "center" },
  durBtn: { flex: 1, height: 38, borderRadius: 10, borderWidth: 1.2, borderColor: T.border, backgroundColor: T.card, alignItems: "center", justifyContent: "center" },
  dayBtnActive: { backgroundColor: T.forest, borderColor: T.forest },
  dayText: { fontSize: 12.5, fontWeight: "600", color: T.inkSoft },
  dayTextActive: { color: T.lime },

  publishBtn: { backgroundColor: T.forest, borderRadius: 16, height: 52, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  publishText: { color: "#F4EFE3", fontWeight: "600", fontSize: 15 },

  routeRow: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: T.card, borderRadius: 12, borderWidth: 1, borderColor: T.borderSoft, padding: 12 },
  routeText: { fontSize: 12, color: T.ink, fontWeight: "500" },
  routeDays: { fontSize: 9, letterSpacing: 1, color: T.inkMute, marginTop: 2 },
});
