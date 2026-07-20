import { useState } from "react";
import { View, TouchableOpacity, Text, Modal, ActivityIndicator, Alert } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CarrierRoute } from "@/src/shared/types";
import { parseApiDate } from "@/src/shared/utils/dates";
import { effectiveWindow, TRIP_LEAD_MS } from "@/src/carrier/routeUtils";
import { T } from "@/constants/tokens";
import { RouteAddress } from "./RouteAddress";

const DAY_LABELS: Record<string, string> = {
  mon: "Lun", tue: "Mar", wed: "Mié", thu: "Jue", fri: "Vie", sat: "Sáb", sun: "Dom",
};

const hhmm = (d: Date) => d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });

/**
 * Detalle de un viaje publicado (desde "Tus viajes publicados"): estado de la
 * ventana, y acciones — iniciar el trayecto (aun antes de la franja),
 * modificarlo o eliminarlo.
 */
export function TripDetailModal({ route, starting, onStartNow, onEdit, onRemove, onClose }: {
  route: CarrierRoute;
  starting: boolean;
  onStartNow: () => void;
  onEdit: () => void;
  onRemove: () => void;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [removing, setRemoving] = useState(false);

  const turno = route.kind === "dedicated_window";
  const habitual = !!route.recurrence_days;
  const now = Date.now();
  const active = effectiveWindow(route, now);
  const soon = !active ? effectiveWindow(route, now + TRIP_LEAD_MS) : null;
  const upcoming = soon && soon.start.getTime() > now ? soon : null;

  const start = parseApiDate(route.window_start);
  const end = parseApiDate(route.window_end);

  const statusLabel = active
    ? `En ventana ahora · hasta las ${hhmm(active.end)}`
    : upcoming
      ? `Arranca a las ${hhmm(upcoming.start)}`
      : habitual
        ? `Fuera de ventana · ${hhmm(start)} a ${hhmm(end)}`
        : `Programado · ${start.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })}`;

  function confirmRemove() {
    Alert.alert("Eliminar viaje", "¿Seguro que querés eliminar este viaje publicado?", [
      { text: "No, volver", style: "cancel" },
      {
        text: "Sí, eliminar", style: "destructive",
        onPress: () => { setRemoving(true); onRemove(); },
      },
    ]);
  }

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
            <MaterialCommunityIcons name={turno ? "truck-cargo-container" : habitual ? "repeat" : "calendar-star"} size={11} color={T.forest} />
            <Text className="text-[9px] tracking-[1.2px] text-forest font-bold uppercase">
              {turno ? "Turno en zona" : habitual ? "Ruta habitual" : "Viaje especial"}
            </Text>
          </View>
          <View className="w-[38px]" />
        </View>

        <View className="px-5 pt-4 gap-4">
          {/* Recorrido (trayecto) o zona (turno) */}
          <View className="bg-card border border-border rounded-2xl px-[14px] py-[14px] gap-[10px]">
            <View className="flex-row items-center gap-[8px]">
              <View className="w-[9px] h-[9px] rounded-full border-2 border-forest bg-card" />
              <RouteAddress lat={route.origin_lat} lon={route.origin_lon} />
            </View>
            {!turno && (
              <View className="flex-row items-center gap-[8px]">
                <View className="w-[9px] h-[9px] rounded-[2px] bg-emerald rotate-45" />
                <RouteAddress
                  lat={route.destination_lat ?? route.origin_lat}
                  lon={route.destination_lon ?? route.origin_lon}
                />
              </View>
            )}
          </View>

          {/* Días + franja */}
          <View className="bg-card border border-border rounded-2xl px-[14px] py-[14px] gap-2">
            {habitual && (
              <View className="flex-row items-center gap-[6px] flex-wrap">
                {route.recurrence_days!.split(",").map((d) => (
                  <View key={d} className="bg-mint border border-border rounded-lg px-[8px] py-[3px]">
                    <Text className="text-[10.5px] font-bold text-forest">{DAY_LABELS[d.trim()] ?? d}</Text>
                  </View>
                ))}
              </View>
            )}
            <View className="flex-row items-center gap-[6px]">
              <MaterialCommunityIcons
                name={active ? "play-circle-outline" : "clock-outline"}
                size={14}
                color={active ? T.forest : T.inkMute}
              />
              <Text className={`text-[12.5px] font-medium ${active ? "text-forest" : "text-inkSoft"}`}>
                {statusLabel}
              </Text>
            </View>
          </View>

          {/* Acciones */}
          <TouchableOpacity
            className="bg-forest rounded-2xl h-[52px] flex-row items-center justify-center gap-[10px]"
            style={{ shadowColor: T.forest, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 5 }}
            onPress={onStartNow}
            disabled={starting}
            activeOpacity={0.9}
          >
            {starting ? (
              <ActivityIndicator color="#F4EFE3" />
            ) : (
              <>
                <MaterialCommunityIcons name="navigation-variant" size={17} color={T.lime} />
                <Text className="text-[15px] font-bold text-[#F4EFE3]">
                  {turno
                    ? (active ? "Iniciar turno" : "Iniciar turno ahora")
                    : (active ? "Iniciar trayecto" : "Iniciar trayecto ahora")}
                </Text>
              </>
            )}
          </TouchableOpacity>

          <View className="flex-row gap-2">
            <TouchableOpacity
              className="flex-1 h-[46px] rounded-[14px] border-[1.2px] border-border bg-card flex-row items-center justify-center gap-[8px]"
              onPress={onEdit}
              activeOpacity={0.85}
            >
              <MaterialCommunityIcons name="pencil-outline" size={15} color={T.ink} />
              <Text className="text-[13.5px] font-semibold text-ink">Modificar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 h-[46px] rounded-[14px] border-[1.2px] border-border bg-card flex-row items-center justify-center gap-[8px]"
              onPress={confirmRemove}
              disabled={removing}
              activeOpacity={0.85}
            >
              {removing ? (
                <ActivityIndicator size={14} color={T.red} />
              ) : (
                <>
                  <MaterialCommunityIcons name="trash-can-outline" size={15} color={T.red} />
                  <Text className="text-[13.5px] font-semibold" style={{ color: T.red }}>Eliminar</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <Text className="text-[11.5px] text-inkMute leading-[17px] text-center px-2" style={{ marginBottom: insets.bottom }}>
            {turno
              ? "Iniciar antes de la franja adelanta la apertura de tu turno: te ponés disponible y los pedidos de tu zona empiezan a entrar desde ahora."
              : "Iniciar antes de la franja adelanta la apertura de la ventana de hoy: te ponés en línea y los pedidos de tu recorrido empiezan a entrar desde ahora."}
          </Text>
        </View>
      </View>
    </Modal>
  );
}
