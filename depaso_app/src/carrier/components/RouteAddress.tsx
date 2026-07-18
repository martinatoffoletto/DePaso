import { useCallback, useState } from "react";
import { Text } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { reverseGeocode } from "@/src/shared/utils/geocoding";

/** Dirección legible de una ruta publicada (geocodea al enfocar la pantalla). */
export function RouteAddress({ lat, lon }: { lat: number; lon: number }) {
  const [addr, setAddr] = useState(`${lat.toFixed(3)}, ${lon.toFixed(3)}`);
  useFocusEffect(useCallback(() => {
    let alive = true;
    reverseGeocode(lat, lon).then((r) => { if (alive) setAddr(r); }).catch(() => {});
    return () => { alive = false; };
  }, [lat, lon]));
  return <Text className="text-[12.5px] text-ink font-medium flex-1" numberOfLines={1}>{addr}</Text>;
}
