import { useCallback, useState } from "react";
import { View, TouchableOpacity, Text, ActivityIndicator } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { CarrierRoute } from "@/src/shared/types";
import { reverseGeocode } from "@/src/shared/utils/geocoding";
import { T } from "@/constants/tokens";

function useTripAddresses(route: CarrierRoute): { origin: string; dest: string } {
  const [origin, setOrigin] = useState(`${route.origin_lat.toFixed(3)}, ${route.origin_lon.toFixed(3)}`);
  const [dest, setDest] = useState(
    route.destination_lat != null ? `${route.destination_lat.toFixed(3)}, ${route.destination_lon!.toFixed(3)}` : "",
  );
  useFocusEffect(useCallback(() => {
    let alive = true;
    reverseGeocode(route.origin_lat, route.origin_lon).then((r) => { if (alive) setOrigin(r); }).catch(() => {});
    if (route.destination_lat != null && route.destination_lon != null) {
      reverseGeocode(route.destination_lat, route.destination_lon).then((r) => { if (alive) setDest(r); }).catch(() => {});
    }
    return () => { alive = false; };
  }, [route.origin_lat, route.origin_lon, route.destination_lat, route.destination_lon]));
  return { origin, dest };
}

const hhmm = (d: Date) => d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });

/**
 * Sesión de trayectoria viva (colaborativo por espacio, ver MODALIDADES.md):
 * el rider está dentro de la ventana de su trayecto habitual/especial, o la
 * ventana arranca en minutos (`upcoming`) y puede adelantar el inicio.
 * Offline: card con los pedidos ya listos y el CTA "Iniciar trayecto".
 */
export function ActiveTripCard({ route, windowStart, windowEnd, offersCount, upcoming, starting, onStart }: {
  route: CarrierRoute;
  windowStart: Date;
  windowEnd: Date;
  offersCount: number;
  upcoming: boolean;
  starting: boolean;
  onStart: () => void;
}) {
  const { origin, dest } = useTripAddresses(route);
  const habitual = !!route.recurrence_days;
  return (
    <View className="bg-forest rounded-[24px] px-5 pt-[18px] pb-[18px] overflow-hidden">
      <View className="flex-row items-center gap-2 mb-3">
        <MaterialCommunityIcons name={habitual ? "repeat" : "calendar-star"} size={13} color={T.lime} />
        <Text className="text-[10px] tracking-[2px] text-lime font-bold uppercase">
          {upcoming
            ? `${habitual ? "Tu trayecto habitual" : "Tu viaje especial"} arranca a las ${hhmm(windowStart)}`
            : `${habitual ? "Tu trayecto habitual" : "Tu viaje especial"} está en ventana`}
        </Text>
      </View>

      <View className="flex-row items-center gap-2 mb-1">
        <View className="w-[9px] h-[9px] rounded-full border-2 border-lime bg-forest" />
        <Text className="text-[14px] text-[#F4EFE3] font-semibold flex-1" numberOfLines={1}>{origin}</Text>
      </View>
      <View className="flex-row items-center gap-2">
        <View className="w-[9px] h-[9px] rounded-[2px] bg-lime rotate-45" />
        <Text className="text-[14px] text-[#F4EFE3] font-semibold flex-1" numberOfLines={1}>{dest}</Text>
      </View>

      <View className="flex-row items-center gap-[6px] mt-[10px]">
        <MaterialCommunityIcons name="clock-outline" size={13} color="#F4EFE3" style={{ opacity: 0.75 }} />
        <Text className="text-[12px] text-[#F4EFE3]/75">
          {upcoming
            ? `Ventana de ${hhmm(windowStart)} a ${hhmm(windowEnd)}`
            : `Ventana activa hasta las ${hhmm(windowEnd)}`}
          {offersCount > 0
            ? ` · ${offersCount} ${offersCount === 1 ? "pedido listo" : "pedidos listos"} en tu recorrido`
            : ""}
        </Text>
      </View>

      <TouchableOpacity
        className="bg-lime rounded-2xl py-[14px] flex-row items-center justify-center gap-[10px] mt-4"
        style={{ shadowColor: T.lime, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.4, shadowRadius: 22, elevation: 6 }}
        onPress={onStart}
        disabled={starting}
        activeOpacity={0.9}
      >
        {starting ? (
          <ActivityIndicator color={T.forest} />
        ) : (
          <>
            <MaterialCommunityIcons name="navigation-variant" size={18} color={T.forest} />
            <Text className="text-[15px] font-bold text-forest tracking-[-0.3px]">
              {upcoming ? "Iniciar trayecto ahora" : "Iniciar trayecto"}
            </Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

/** Banner compacto sobre el mapa operativo: la sesión de trayecto está
 * corriendo (o por arrancar, si el rider se conectó unos minutos antes). */
export function ActiveTripBanner({ route, windowStart, windowEnd, upcoming }: {
  route: CarrierRoute;
  windowStart: Date;
  windowEnd: Date;
  upcoming: boolean;
}) {
  const { origin, dest } = useTripAddresses(route);
  return (
    <View
      className="self-start mt-2 flex-row items-center gap-[8px] bg-forest border-[1.2px] border-forest rounded-[12px] px-3 py-[7px]"
      style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 10, elevation: 4, maxWidth: "100%" }}
    >
      <MaterialCommunityIcons name="navigation-variant" size={13} color={T.lime} />
      <Text className="text-[11.5px] font-bold text-[#F4EFE3]" numberOfLines={1} style={{ flexShrink: 1 }}>
        {origin.split(",")[0]} → {dest.split(",")[0]}
      </Text>
      <Text className="text-[10.5px] text-[#F4EFE3]/70">
        {upcoming ? `desde ${hhmm(windowStart)}` : `hasta ${hhmm(windowEnd)}`}
      </Text>
    </View>
  );
}
