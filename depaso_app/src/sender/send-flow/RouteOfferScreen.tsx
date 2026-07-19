import { useEffect, useState } from "react";
import { View, TouchableOpacity, ScrollView } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { T } from "@/constants/tokens";
import { StepDots } from "@/src/sender/components/StepDots";
import { ProductOptionCard } from "@/src/sender/components/ProductOptionCard";
import { InlineWindowPicker } from "@/src/sender/components/InlineWindowPicker";
import { shipmentsService } from "@/src/shared/api/shipments";
import type { Quote, ProductMode } from "@/src/shared/types";
import { PickupSchedule, pickupScheduleValid, pickupScheduleLabel, todayISO } from "@/src/sender/pickupSchedule";
import type { Coords } from "./FlowNavigator";

const MAP_HEIGHT = 300;
const SHEET_OVERLAP = 38;

const BA_DEFAULT: Coords = { latitude: -34.6037, longitude: -58.3816 };

// Soft shadow shared by the floating map controls.
const FLOAT_SHADOW = { shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 3 };


type Props = {
  origin: string;
  destination: string;
  originCoords: Coords | null;
  destinationCoords: Coords | null;
  categoryId: string;
  initialMode?: ProductMode;
  schedule: PickupSchedule;
  onScheduleChange: (s: PickupSchedule) => void;
  onBack: () => void;
  onNext: (mode: ProductMode, quote: Quote | null) => void;
};

export function RouteOfferScreen({
  origin, destination, originCoords, destinationCoords, categoryId,
  initialMode, schedule, onScheduleChange, onBack, onNext,
}: Props) {
  const insets = useSafeAreaInsets();
  // Mudanzas/fletes (XL) van siempre en viaje dedicado (spec 3.3): "De paso"
  // (colaborativo) no se ofrece — el backend rechaza XL colaborativo.
  const isXl = categoryId === "xl";
  const clamp = (m: ProductMode): ProductMode => (isXl && m === "depaso" ? "ya" : m);
  const [mode, setMode] = useState<ProductMode>(clamp(initialMode ?? "ya"));
  useEffect(() => {
    if (isXl && mode === "depaso") setMode("ya");
  }, [isXl, mode]);

  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(true);
  const [quoteError, setQuoteError] = useState(false);
  const [retryTick, setRetryTick] = useState(0);

  const hasCoords = !!originCoords && !!destinationCoords;

  useEffect(() => {
    if (!hasCoords) { setQuoteLoading(false); return; }
    let alive = true;
    setQuoteLoading(true);
    setQuoteError(false);
    shipmentsService
      .getQuote({
        origin_lat: originCoords!.latitude,
        origin_lon: originCoords!.longitude,
        destination_lat: destinationCoords!.latitude,
        destination_lon: destinationCoords!.longitude,
        package_size: categoryId,
      })
      .then(q => { if (alive) setQuote(q); })
      .catch(() => { if (alive) setQuoteError(true); })
      .finally(() => { if (alive) setQuoteLoading(false); });
    return () => { alive = false; };
  }, [hasCoords, originCoords, destinationCoords, categoryId, retryTick]);

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

  // "Hoy" exige una franja válida (retiro programado); sin ella no se continúa.
  const selectHoy = () => {
    setMode("hoy");
    if (schedule.kind !== "window") {
      onScheduleChange({ kind: "window", date: todayISO(), startHour: null, endHour: null });
    }
  };
  const hoyWindowValid = schedule.kind === "window" && pickupScheduleValid(schedule);
  const hoyNeedsWindow = mode === "hoy" && !hoyWindowValid;
  const canContinue = !hoyNeedsWindow;

  const depasoSelected = mode === "depaso";
  const routesNow = quote?.collaborative_routes_now ?? 0;

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

        {/* spacer para centrar el pill de pasos (simetría con el botón back) */}
        <View className="w-10 h-10" />
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
            <Text className="text-[10px] tracking-[2.5px] text-emeraldDeep uppercase">PASO 03 · ¿CUÁNDO LO NECESITÁS?</Text>
            <Text className="text-[22px] font-bold text-ink tracking-[-0.7px] leading-6 mb-[2px]">Elegí tu envío</Text>

            {quoteError && (
              <View className="flex-row items-center gap-2 bg-redBg border border-red/30 rounded-xl px-3 py-[10px]">
                <MaterialCommunityIcons name="wifi-off" size={15} color={T.red} />
                <Text className="flex-1 text-[12px] text-red font-medium">No pudimos calcular el precio.</Text>
                <TouchableOpacity onPress={() => setRetryTick(t => t + 1)} className="bg-red rounded-lg px-3 py-[6px]" activeOpacity={0.85}>
                  <Text className="text-[11px] text-white font-bold" style={{ color: "#FFFFFF" }}>Reintentar</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Ya — dedicado por demanda */}
            <ProductOptionCard
              selected={mode === "ya"}
              onPress={() => setMode("ya")}
              title="Ya"
              badgeLabel="DEDICADA"
              badgeTone="neutral"
              loading={quoteLoading}
              price={quote?.price_dedicated}
              meta={
                <View className="flex-row gap-[8px] items-center">
                  <Text className="text-[11.5px] text-inkMute">{quote ? `${quote.eta_dedicated_min} min` : "—"}</Text>
                  <Text className="text-[11.5px] text-inkMute">· Un cadete sale ahora, sólo por tu envío</Text>
                </View>
              }
            />

            {/* Hoy — dedicado por espacio (retiro programado en la franja) */}
            <ProductOptionCard
              selected={mode === "hoy"}
              onPress={selectHoy}
              title="Hoy"
              badgeLabel="PROGRAMADA"
              badgeTone="scheduled"
              loading={quoteLoading}
              price={quote?.price_scheduled}
              meta={
                <Text className="text-[11.5px] text-inkMute">
                  {hoyWindowValid ? pickupScheduleLabel(schedule) : "Retiro en tu franja · esperá y ahorrá"}
                </Text>
              }
            >
              {mode === "hoy" && (
                <InlineWindowPicker schedule={schedule} onChange={onScheduleChange} />
              )}
            </ProductOptionCard>

            {/* De paso — colaborativo (no disponible para fletes XL) */}
            {isXl ? (
              <View className="rounded-2xl border border-border border-dashed bg-cardSoft p-3 px-[14px] flex-row items-center gap-3">
                <MaterialCommunityIcons name="account-group-outline" size={20} color={T.inkMute} />
                <View className="flex-1">
                  <Text className="text-[13.5px] font-semibold text-inkSoft">«De paso» no disponible</Text>
                  <Text className="text-[11.5px] text-inkMute mt-[2px]">
                    Las mudanzas y fletes van siempre en un viaje dedicado, por su volumen.
                  </Text>
                </View>
              </View>
            ) : (
              <ProductOptionCard
                variant="eco"
                selected={depasoSelected}
                dimmed={routesNow === 0}
                onPress={() => setMode("depaso")}
                title="De paso"
                badgeLabel="ECO −43%"
                badgeTone="eco"
                loading={quoteLoading}
                price={quote?.price_collaborative}
                strikePrice={quote?.price_dedicated}
                meta={
                  <View className="flex-row gap-[10px] items-center">
                    <Text className="text-[11.5px]" style={{ color: depasoSelected ? "#F4EFE3" : T.inkMute }}>
                      {quote ? `${quote.eta_collaborative_min} min` : "—"}
                    </Text>
                    <Text className="text-[11.5px] font-semibold" style={{ color: depasoSelected ? T.lime : T.emeraldDeep }}>
                      {quote ? `−${quote.co2_savings_estimate_kg.toFixed(1)} kg CO₂` : ""}
                    </Text>
                  </View>
                }
              >
                {quote && (
                  <View className="mt-[10px]">
                    {routesNow > 0 ? (
                      <View className={`self-start flex-row items-center gap-[6px] rounded-full px-[10px] py-[5px] ${depasoSelected ? "bg-lime" : "bg-mint"}`}>
                        <View className="w-[5px] h-[5px] rounded-full bg-emeraldDeep" />
                        <Text className="text-[10.5px] font-bold text-forest">
                          {routesNow} {routesNow === 1 ? "viaje compatible" : "viajes compatibles"} ahora
                        </Text>
                      </View>
                    ) : (
                      <Text className="text-[11px] leading-4" style={{ color: depasoSelected ? "#F4EFE3" : T.inkMute }}>
                        Nadie va en camino ahora — tu envío queda publicado y te avisamos apenas alguien coincida.
                      </Text>
                    )}
                  </View>
                )}
              </ProductOptionCard>
            )}

            {/* Eco strip */}
            {!isXl && (
              <View className="bg-cardSoft rounded-xl border border-border border-dashed p-[10px] px-3 flex-row items-center gap-[10px]">
                <View className="w-[26px] h-[26px] rounded-lg bg-mint items-center justify-center">
                  <MaterialCommunityIcons name="leaf" size={15} color={T.forest} />
                </View>
                <Text className="flex-1 text-[11.5px] text-inkSoft leading-4">
                  «De paso» suma tu paquete a un viaje que ya existe: evitás un vehículo extra en la calle.
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>

      {/* Sticky footer CTA */}
      <View className="absolute bottom-0 left-0 right-0 px-4 pt-6 z-20" style={{ paddingBottom: insets.bottom + 12 }}>
        <TouchableOpacity
          className={`rounded-2xl h-[54px] flex-row items-center justify-center gap-[10px] ${canContinue ? "bg-forest" : "bg-inkMute"}`}
          style={canContinue ? { shadowColor: T.forest, shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.45, shadowRadius: 24, elevation: 5 } : undefined}
          onPress={() => canContinue && onNext(mode, quote)}
          activeOpacity={0.88}
          disabled={!canContinue}
        >
          <Text className="text-[#F4EFE3] font-semibold text-[15px]" style={{ color: "#F4EFE3" }}>
            {canContinue ? "Continuar · Resumen" : "Elegí la franja de retiro"}
          </Text>
          {canContinue && <MaterialCommunityIcons name="arrow-right" size={18} color="#F4EFE3" />}
        </TouchableOpacity>
      </View>
    </View>
  );
}
