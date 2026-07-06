import { useEffect, useState } from "react";
import { View, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { T } from "@/constants/tokens";
import { shipmentsService } from "@/src/services/shipments";
import type { Quote } from "@/src/types";
import type { Coords } from "./FlowNavigator";

function fmtPrice(v: number | undefined): string {
  return v != null ? `$${v.toLocaleString("es-AR")}` : "—";
}

type DeliveryMode = "dedicada" | "colaborativa";

const MAP_HEIGHT = 300;
const SHEET_OVERLAP = 38;

const BA_DEFAULT: Coords = { latitude: -34.6037, longitude: -58.3816 };

// Soft shadow shared by the floating map controls.
const FLOAT_SHADOW = { shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 3 };

function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <View className="flex-row gap-[6px] items-center">
      {Array.from({ length: total }).map((_, i) => (
        <View key={i} className="h-[6px] rounded" style={{ width: i === current - 1 ? 18 : 6, backgroundColor: i < current ? T.forest : T.border }} />
      ))}
      <Text className="text-[10px] tracking-[1.5px] text-inkMute ml-1">{String(current).padStart(2, "0")}/{String(total).padStart(2, "0")}</Text>
    </View>
  );
}

type Props = {
  origin: string;
  destination: string;
  originCoords: Coords | null;
  destinationCoords: Coords | null;
  categoryId: string;
  initialMode?: DeliveryMode;
  onBack: () => void;
  onNext: (mode: DeliveryMode, quote: Quote | null) => void;
};

export function RouteOfferScreen({ origin, destination, originCoords, destinationCoords, categoryId, initialMode, onBack, onNext }: Props) {
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<DeliveryMode>(initialMode ?? "colaborativa");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(true);

  const hasCoords = !!originCoords && !!destinationCoords;
  const isCollab = mode === "colaborativa";

  useEffect(() => {
    if (!hasCoords) { setQuoteLoading(false); return; }
    let alive = true;
    setQuoteLoading(true);
    shipmentsService
      .getQuote({
        origin_lat: originCoords!.latitude,
        origin_lon: originCoords!.longitude,
        destination_lat: destinationCoords!.latitude,
        destination_lon: destinationCoords!.longitude,
        package_size: categoryId,
      })
      .then(q => { if (alive) setQuote(q); })
      .catch(() => {})
      .finally(() => { if (alive) setQuoteLoading(false); });
    return () => { alive = false; };
  }, [hasCoords, originCoords, destinationCoords, categoryId]);

  const mapRegion = hasCoords ? {
    latitude: (originCoords!.latitude + destinationCoords!.latitude) / 2,
    longitude: (originCoords!.longitude + destinationCoords!.longitude) / 2,
    latitudeDelta: Math.abs(originCoords!.latitude - destinationCoords!.latitude) * 2.5 + 0.04,
    longitudeDelta: Math.abs(originCoords!.longitude - destinationCoords!.longitude) * 2.5 + 0.04,
  } : {
    latitude: BA_DEFAULT.latitude,
    longitude: BA_DEFAULT.longitude,
    latitudeDelta: 0.12,
    longitudeDelta: 0.12,
  };

  const originLabel = origin.split(",")[0] || "Origen";
  const destLabel   = destination.split(",")[0] || "Destino";

  return (
    <View className="flex-1 bg-bg">
      {/* Full-bleed map */}
      <MapView
        style={{ position: "absolute", top: 0, left: 0, right: 0, height: MAP_HEIGHT }}
        region={mapRegion}
        scrollEnabled={false}
        zoomEnabled={false}
        pitchEnabled={false}
        rotateEnabled={false}
      >
        {hasCoords && (
          <>
            <Marker coordinate={originCoords!}>
              <View className="w-[22px] h-[22px] rounded-full bg-[#F4EFE3] border-[3px] border-forest items-center justify-center">
                <View className="w-[6px] h-[6px] rounded-full bg-forest" />
              </View>
            </Marker>
            <Marker coordinate={destinationCoords!}>
              <View className="w-[18px] h-[18px] rounded bg-emerald rotate-45" />
            </Marker>
            <Polyline
              coordinates={[originCoords!, destinationCoords!]}
              strokeColor={T.forest}
              strokeWidth={4}
            />
            <Polyline
              coordinates={[originCoords!, destinationCoords!]}
              strokeColor={T.lime}
              strokeWidth={2}
              lineDashPattern={[3, 5]}
            />
          </>
        )}
      </MapView>

      {/* Floating controls over map */}
      <View className="absolute left-4 right-4 flex-row items-center justify-between z-10" style={{ top: insets.top + 12 }}>
        <TouchableOpacity
          className="w-10 h-10 rounded-[14px] border border-border bg-[#F4EFE3]/95 items-center justify-center"
          style={FLOAT_SHADOW}
          onPress={onBack}
          hitSlop={8}
        >
          <MaterialCommunityIcons name="arrow-left" size={18} color={T.ink} />
        </TouchableOpacity>

        {/* Step pill */}
        <View className="bg-[#F4EFE3]/95 border border-border rounded-[14px] px-3 py-2" style={FLOAT_SHADOW}>
          <StepDots current={3} total={4} />
        </View>

        <TouchableOpacity className="w-10 h-10 rounded-[14px] border border-border bg-[#F4EFE3]/95 items-center justify-center" style={FLOAT_SHADOW} hitSlop={8}>
          <MaterialCommunityIcons name="navigation-outline" size={18} color={T.ink} />
        </TouchableOpacity>
      </View>

      {/* Distance / route float card */}
      <View
        className="absolute left-4 right-4 z-10 bg-[#F4EFE3]/95 border border-border rounded-[14px] px-[14px] py-[10px] flex-row items-center justify-between"
        style={{ top: MAP_HEIGHT - 70, shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 4 }}
      >
        <View className="flex-row items-center gap-[14px] flex-1">
          <View>
            <Text className="text-[8.5px] tracking-[1.2px] text-inkMute uppercase">DISTANCIA</Text>
            <Text className="text-base font-bold text-ink tracking-[-0.4px]">
              {quote ? `${quote.distance_km.toFixed(1)} km` : "— km"}
            </Text>
          </View>
          <View className="w-px h-6 bg-borderSoft" />
          <View>
            <Text className="text-[8.5px] tracking-[1.2px] text-inkMute uppercase">RUTA</Text>
            <Text className="text-[13px] text-ink font-semibold max-w-[140px]" numberOfLines={1}>{originLabel} → {destLabel}</Text>
          </View>
        </View>
        <View className="flex-row items-center gap-1 bg-mint px-2 py-1 rounded-lg">
          <View className="w-[5px] h-[5px] rounded-full bg-emeraldDeep" />
          <Text className="text-[9px] tracking-[1px] text-forest font-bold uppercase">OK</Text>
        </View>
      </View>

      {/* Content column */}
      <View className="flex-1">
        {/* spacer = map height minus overlap */}
        <View style={{ height: MAP_HEIGHT - SHEET_OVERLAP }} />

        {/* Bottom sheet */}
        <View
          className="flex-1 bg-bg rounded-t-[28px] pt-[14px]"
          style={{ shadowColor: T.forest, shadowOffset: { width: 0, height: -12 }, shadowOpacity: 0.12, shadowRadius: 30, elevation: 12 }}
        >
          {/* Drag handle */}
          <View className="w-[38px] h-1 bg-border rounded-[3px] self-center mb-3" />

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 10, paddingBottom: insets.bottom + 90 }}
          >
            <Text className="text-[10px] tracking-[2.5px] text-emeraldDeep uppercase">PASO 03 · ELEGÍ EL VIAJE</Text>
            <Text className="text-[22px] font-bold text-ink tracking-[-0.7px] leading-6 mb-[2px]">¿Cómo lo enviamos?</Text>

            {/* Dedicada card */}
            <TouchableOpacity
              className={`bg-card rounded-2xl border-[1.5px] p-3 px-[14px] flex-row items-center gap-3 overflow-hidden ${mode === "dedicada" ? "border-forest" : "border-border"}`}
              onPress={() => setMode("dedicada")}
              activeOpacity={0.8}
            >
              <View className={`w-[22px] h-[22px] rounded-full border-2 items-center justify-center ${mode === "dedicada" ? "border-forest" : "border-border"}`}>
                {mode === "dedicada" && <View className="w-[10px] h-[10px] rounded-full bg-forest" />}
              </View>
              <View className="flex-1">
                <View className="flex-row items-center gap-[6px] mb-[2px]">
                  <Text className="text-[15px] font-bold text-ink tracking-[-0.3px]">Sólo tu envío</Text>
                  <View className="bg-bg rounded px-[5px] py-[2px]"><Text className="text-[8px] tracking-[1px] text-inkMute uppercase">DEDICADA</Text></View>
                </View>
                <View className="flex-row gap-[10px] items-center">
                  <Text className="text-[11.5px] text-inkMute">{quote ? `${quote.eta_dedicated_min} min` : "—"}</Text>
                  <Text className="text-[11.5px] text-inkMute">· Directo</Text>
                </View>
              </View>
              {quoteLoading
                ? <ActivityIndicator size="small" color={T.forest} />
                : <Text className="text-lg font-bold text-ink tracking-[-0.5px]">{fmtPrice(quote?.price_dedicated)}</Text>}
            </TouchableOpacity>

            {/* Colaborativa card */}
            <TouchableOpacity
              className={`rounded-2xl border-[1.5px] p-3 px-[14px] flex-row items-center gap-3 overflow-hidden ${isCollab ? "bg-forest border-forest" : "bg-card border-border"}`}
              style={isCollab ? { shadowColor: T.forest, shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.4, shadowRadius: 24, elevation: 5 } : undefined}
              onPress={() => setMode("colaborativa")}
              activeOpacity={0.8}
            >
              {/* decorative lime blob */}
              {isCollab && <View className="absolute -right-[10px] -top-[10px] w-[130px] h-[90px] rounded-[60px] bg-lime opacity-[0.16]" />}

              <View className={`w-[22px] h-[22px] rounded-full border-2 items-center justify-center ${isCollab ? "border-lime" : "border-border"}`}>
                {isCollab && <View className="w-[10px] h-[10px] rounded-full bg-lime" />}
              </View>
              <View className="flex-1 relative">
                <View className="flex-row items-center gap-[6px] mb-[2px]">
                  <Text className={`text-[15px] font-bold tracking-[-0.3px] ${isCollab ? "text-[#F4EFE3]" : "text-ink"}`}>Compartí el viaje</Text>
                  <View className="bg-lime rounded px-[5px] py-[2px]"><Text className="text-[8px] tracking-[1px] text-forest font-bold uppercase">ECO −43%</Text></View>
                </View>
                <View className="flex-row gap-[10px] items-center">
                  <Text className={`text-[11.5px] ${isCollab ? "text-[#F4EFE3]/65" : "text-inkMute"}`}>
                    {quote ? `${quote.eta_collaborative_min} min` : "—"}
                  </Text>
                  <Text className={`text-[11.5px] font-semibold ${isCollab ? "text-lime" : "text-emeraldDeep"}`}>
                    {quote ? `−${quote.co2_savings_estimate_kg.toFixed(1)} kg CO₂` : ""}
                  </Text>
                </View>
              </View>
              <View className="items-end relative">
                {quoteLoading
                  ? <ActivityIndicator size="small" color={isCollab ? T.lime : T.forest} />
                  : <>
                      <Text className={`text-lg font-bold tracking-[-0.5px] ${isCollab ? "text-[#F4EFE3]" : "text-ink"}`}>{fmtPrice(quote?.price_collaborative)}</Text>
                      <Text className={`text-[10px] line-through ${isCollab ? "text-[#F4EFE3]/40" : "text-inkFaint"}`}>{fmtPrice(quote?.price_dedicated)}</Text>
                    </>}
              </View>
            </TouchableOpacity>

            {/* Eco strip */}
            <View className="bg-cardSoft rounded-xl border border-border border-dashed p-[10px] px-3 flex-row items-center gap-[10px]">
              <View className="flex-row">
                {[
                  { initials: "MA", bg: T.amber },
                  { initials: "FC", bg: T.violet },
                  { initials: "RP", bg: T.emerald },
                ].map((av, i) => (
                  <View key={i} className="w-[22px] h-[22px] rounded-full border-2 border-bg items-center justify-center" style={{ backgroundColor: av.bg, marginLeft: i === 0 ? 0 : -8 }}>
                    <Text className="text-[7px] font-bold text-[#F4EFE3]">{av.initials}</Text>
                  </View>
                ))}
              </View>
              <Text className="flex-1 text-[11.5px] text-inkSoft leading-4">
                <Text className="text-ink font-semibold">3 cadetes </Text>
                están haciendo esta ruta ahora
              </Text>
            </View>
          </ScrollView>
        </View>
      </View>

      {/* Sticky footer CTA */}
      <View className="absolute bottom-0 left-0 right-0 px-4 pt-6 z-20" style={{ paddingBottom: insets.bottom + 12 }}>
        <TouchableOpacity
          className="bg-forest rounded-2xl h-[54px] flex-row items-center justify-center gap-[10px]"
          style={{ shadowColor: T.forest, shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.45, shadowRadius: 24, elevation: 5 }}
          onPress={() => onNext(mode, quote)}
          activeOpacity={0.88}
        >
          <Text className="text-[#F4EFE3] font-semibold text-[15px]">Continuar · Resumen</Text>
          <MaterialCommunityIcons name="arrow-right" size={18} color="#F4EFE3" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
