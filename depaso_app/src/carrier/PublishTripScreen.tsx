import { useCallback, useEffect, useMemo, useState } from "react";
import { View, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Modal, Text } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { routesService } from "@/src/shared/api/carriers";
import { CarrierRoute } from "@/src/shared/types";
import { AddressField, SelectedAddress } from "@/src/shared/ui/AddressField";
import { FieldLabel } from "@/src/shared/ui/Field";
import { HourSelect } from "@/src/shared/ui/HourSelect";
import { MiniCalendar } from "@/src/shared/ui/MiniCalendar";
import { visibleRoutes } from "@/src/carrier/routeUtils";
import { parseApiDate } from "@/src/shared/utils/dates";
import { reverseGeocode } from "@/src/shared/utils/geocoding";
import { PublishedRouteRow } from "./components/PublishedRouteRow";
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

// Ambas variantes publican trayectos COLABORATIVOS (kind=collaborative_route):
// Habitual es recurrente (recurrence_days), Especial es un viaje puntual de un
// día concreto. La ventana dedicada no se publica desde acá — la maneja el
// toggle "Dedicado por espacio" de RiderHomeScreen (ver MODALIDADES.md).
type TripVariant = "habitual" | "especial";

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

export default function PublishTripScreen({ onClose, editRoute }: {
  onClose: () => void;
  /** Modo edición: prellena el form y guarda con PATCH en vez de crear. */
  editRoute?: CarrierRoute | null;
}) {
  const insets = useSafeAreaInsets();

  const editing = !!editRoute;
  const editStart = editRoute ? parseApiDate(editRoute.window_start) : null;
  const editEnd = editRoute ? parseApiDate(editRoute.window_end) : null;

  // La variante no se cambia al editar: el PATCH del backend ignora None y no
  // puede limpiar recurrence_days (habitual -> especial requeriría recrear).
  const [variant, setVariant] = useState<TripVariant>(
    editRoute && !editRoute.recurrence_days ? "especial" : "habitual",
  );

  // Addresses — text mirrors the field, coords only exist after picking a suggestion.
  const [originText, setOriginText] = useState("");
  const [originSel, setOriginSel] = useState<SelectedAddress | null>(
    editRoute ? { label: "", lat: editRoute.origin_lat, lon: editRoute.origin_lon } : null,
  );
  const [destText, setDestText] = useState("");
  const [destSel, setDestSel] = useState<SelectedAddress | null>(
    editRoute && editRoute.destination_lat != null && editRoute.destination_lon != null
      ? { label: "", lat: editRoute.destination_lat, lon: editRoute.destination_lon }
      : null,
  );

  // Habitual: recurrence days + start hour + duration.
  const [days, setDays] = useState<string[]>(
    editRoute?.recurrence_days
      ? editRoute.recurrence_days.split(",").map((d) => d.trim())
      : ["mon", "tue", "wed", "thu", "fri"],
  );
  const [startHour, setStartHour] = useState<number | null>(editStart ? editStart.getHours() : 9);

  // Especial: "now" or a specific day (calendar) + hour.
  const [startNow, setStartNow] = useState(!editing);
  const [tripDay, setTripDay] = useState<Date | null>(
    editRoute && !editRoute.recurrence_days ? editStart : null,
  );
  const [tripHour, setTripHour] = useState<number | null>(
    editRoute && !editRoute.recurrence_days && editStart ? editStart.getHours() : null,
  );

  const [durationH, setDurationH] = useState(
    editStart && editEnd
      ? Math.max(1, Math.round((editEnd.getTime() - editStart.getTime()) / 3_600_000))
      : 4,
  );
  const [saving, setSaving] = useState(false);
  const [myRoutes, setMyRoutes] = useState<CarrierRoute[]>([]);

  useFocusEffect(useCallback(() => {
    routesService.mine().then(setMyRoutes).catch(() => {});
  }, []));

  // Modo edición: mostrar las direcciones actuales legibles (las coords ya
  // están en originSel/destSel — esto solo completa el texto del campo).
  useEffect(() => {
    if (!editRoute) return;
    let alive = true;
    reverseGeocode(editRoute.origin_lat, editRoute.origin_lon)
      .then((a) => { if (alive) { setOriginText(a); setOriginSel((s) => (s ? { ...s, label: a } : s)); } })
      .catch(() => {});
    if (editRoute.destination_lat != null && editRoute.destination_lon != null) {
      reverseGeocode(editRoute.destination_lat, editRoute.destination_lon)
        .then((a) => { if (alive) { setDestText(a); setDestSel((s) => (s ? { ...s, label: a } : s)); } })
        .catch(() => {});
    }
    return () => { alive = false; };
  }, [editRoute]);

  const isEspecial = variant === "especial";

  const startPreview = useMemo(() => {
    if (!isEspecial) return null;
    if (startNow) return "Ahora mismo";
    if (tripDay && tripHour != null) {
      return `${tripDay.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })} · ${String(tripHour).padStart(2, "0")}:00`;
    }
    return null;
  }, [isEspecial, startNow, tripDay, tripHour]);

  function toggleDay(key: string) {
    setDays((d) => (d.includes(key) ? d.filter((x) => x !== key) : [...d, key]));
  }

  async function publish() {
    if (!originSel) {
      Alert.alert("Falta el origen", "Buscá la dirección y elegila de la lista de sugerencias.");
      return;
    }
    if (!destSel) {
      Alert.alert("Falta el destino", "Buscá la dirección y elegila de la lista de sugerencias.");
      return;
    }

    let windowStart: Date;
    if (isEspecial) {
      if (startNow) {
        windowStart = new Date();
      } else {
        if (!tripDay || tripHour == null) {
          Alert.alert("Falta el inicio", "Elegí el día en el calendario y la hora de salida, o tocá «Ahora».");
          return;
        }
        windowStart = new Date(tripDay.getFullYear(), tripDay.getMonth(), tripDay.getDate(), tripHour, 0, 0);
        // Al editar, un inicio en el pasado es válido (p. ej. cambiar solo la
        // dirección de un viaje cuya ventana ya está corriendo).
        if (!editing && windowStart <= new Date()) {
          Alert.alert("Inicio inválido", "El viaje tiene que empezar en el futuro. Si salís ya, tocá «Ahora».");
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
      if (editing && editRoute) {
        await routesService.update(editRoute.id, {
          origin_lat: originSel.lat,
          origin_lon: originSel.lon,
          destination_lat: destSel.lat,
          destination_lon: destSel.lon,
          window_start: windowStart.toISOString(),
          window_end: windowEnd.toISOString(),
          ...(isEspecial ? {} : { recurrence_days: days.join(",") }),
        });
        Alert.alert("Guardado", "Tu viaje fue actualizado.", [{ text: "OK", onPress: onClose }]);
        return;
      }

      const route = await routesService.publish({
        kind: "collaborative_route",
        origin_lat: originSel.lat,
        origin_lon: originSel.lon,
        destination_lat: destSel.lat,
        destination_lon: destSel.lon,
        window_start: windowStart.toISOString(),
        window_end: windowEnd.toISOString(),
        ...(isEspecial ? {} : { recurrence_days: days.join(",") }),
      });

      setMyRoutes((r) => [...r, route]);
      setOriginText(""); setOriginSel(null);
      setDestText(""); setDestSel(null);
      setTripDay(null); setTripHour(null); setStartNow(true);

      Alert.alert(
        "Publicado",
        isEspecial
          ? "Tu viaje especial fue publicado. Te ofrecemos paquetes que vayan en el mismo sentido ese día."
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

  const activeRoutes = visibleRoutes(myRoutes);

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
            <Text className="text-[9px] tracking-[1.2px] text-forest font-bold uppercase">Colaborativo</Text>
          </View>
          <View className="w-[38px]" />
        </View>

        {/* Title */}
        <View className="px-5 pt-4">
          <Text className="text-[10px] tracking-[2.5px] text-emeraldDeep uppercase mb-[6px]">
            {editing ? "Modificá tu viaje" : "Publicá un viaje"}
          </Text>
          <Text className="text-[28px] font-bold text-ink tracking-[-1px] leading-[30px]">
            {editing
              ? (isEspecial ? "Tu viaje especial" : "Tu ruta habitual")
              : (isEspecial ? "¿Qué viaje tenés planeado?" : "¿A dónde vas a ir igual?")}
          </Text>
          <Text className="text-[12.5px] text-inkSoft leading-[18px] mt-2">
            {editing
              ? "Ajustá el recorrido, los horarios o la duración y guardá los cambios."
              : isEspecial
                ? "Un viaje puntual que vas a hacer un día concreto. Te ofrecemos paquetes que vayan en el mismo sentido."
                : "Decinos tu ruta y horario. Te ofrecemos paquetes que van en el mismo sentido."}
          </Text>
        </View>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 20, gap: 16, paddingBottom: insets.bottom + 120 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Variant toggle — fijo al editar (el PATCH no puede limpiar recurrence_days) */}
          {!editing && <View className="gap-2">
            {([
              { v: "habitual" as TripVariant, icon: "repeat" as const, label: "Habitual", sub: "Tu trayecto de todos los días" },
              { v: "especial" as TripVariant, icon: "calendar-star" as const, label: "Especial", sub: "Un viaje puntual, un día concreto" },
            ]).map((opt) => {
              const active = variant === opt.v;
              return (
                <TouchableOpacity
                  key={opt.v}
                  className={`flex-row items-center gap-3 rounded-2xl p-[14px] border-[1.2px] ${active ? "bg-forest border-forest" : "bg-card border-border"}`}
                  onPress={() => setVariant(opt.v)}
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
          </View>}

          {/* Addresses — same autocomplete the shipper uses */}
          <AddressField
            label="Desde"
            placeholder="Ej: Av. Rivadavia 4800, Caballito"
            kind="origin"
            value={originText}
            onChangeText={(t) => { setOriginText(t); setOriginSel(null); }}
            onSelect={(sel) => { setOriginText(sel.label); setOriginSel(sel); }}
          />
          <AddressField
            label="Hasta"
            placeholder="Ej: Av. Cazadores 2100, Tigre"
            kind="destination"
            value={destText}
            onChangeText={(t) => { setDestText(t); setDestSel(null); }}
            onSelect={(sel) => { setDestText(sel.label); setDestSel(sel); }}
          />

          {/* Habitual: days + start hour */}
          {!isEspecial && (
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

          {/* Especial: "now" / calendar day + hour */}
          {isEspecial && (
            <View>
              <FieldLabel text="¿Cuándo salís?" />
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
                  <MiniCalendar selected={tripDay} onSelect={setTripDay} />
                  <HourSelect value={tripHour} onSelect={setTripHour} />
                </View>
              )}
            </View>
          )}

          {/* Duration — shared by both variants */}
          <View>
            <FieldLabel text={isEspecial ? "¿Cuánto dura el viaje (aprox.)?" : "¿Cuántas horas dura tu disponibilidad?"} />
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

          {/* Start preview (especial) */}
          {isEspecial && startPreview && (
            <View className="flex-row items-center gap-[10px] bg-card border border-border rounded-[14px] px-[14px] py-3">
              <MaterialCommunityIcons name="calendar-check-outline" size={16} color={T.forest} />
              <Text className="flex-1 text-[13px] text-ink font-medium">
                Salís: <Text className="font-bold">{startPreview}</Text> · {durationH} h
              </Text>
            </View>
          )}

          {/* Info band */}
          <View className="flex-row gap-[10px] bg-mint rounded-[14px] p-[14px] border border-border">
            <MaterialCommunityIcons name="information-outline" size={16} color={T.forest} style={{ marginTop: 1 }} />
            <Text className="flex-1 text-[13px] text-forest leading-[19px]">
              Te ofrecemos paquetes que van en tu mismo sentido, sin desviarte más de un 15%.
            </Text>
          </View>

          {/* Active routes (solo en modo publicar) */}
          {!editing && activeRoutes.length > 0 && (
            <View className="gap-2">
              <FieldLabel text="Viajes activos" />
              {activeRoutes.map((r) => (
                <PublishedRouteRow key={r.id} route={r} onRemove={() => remove(r.id)} />
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
                <Text className="text-[15px] font-bold text-[#F4EFE3]">{editing ? "Guardar cambios" : "Publicar viaje"}</Text>
                <MaterialCommunityIcons name="arrow-right" size={18} color="#F4EFE3" />
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
