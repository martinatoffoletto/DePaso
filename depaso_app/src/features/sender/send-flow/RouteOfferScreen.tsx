import { useEffect, useState } from "react";
import { View, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
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

function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <View style={dotStyles.row}>
      {Array.from({ length: total }).map((_, i) => (
        <View key={i} style={[dotStyles.dot, { width: i === current - 1 ? 18 : 6, backgroundColor: i < current ? T.forest : T.border }]} />
      ))}
      <Text style={dotStyles.counter}>{String(current).padStart(2, "0")}/{String(total).padStart(2, "0")}</Text>
    </View>
  );
}
const dotStyles = StyleSheet.create({
  row: { flexDirection: "row", gap: 6, alignItems: "center" },
  dot: { height: 6, borderRadius: 4 },
  counter: { fontSize: 10, letterSpacing: 1.5, color: T.inkMute, marginLeft: 4 },
});

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
    <View style={s.container}>
      {/* Full-bleed map */}
      <MapView
        style={s.map}
        region={mapRegion}
        scrollEnabled={false}
        zoomEnabled={false}
        pitchEnabled={false}
        rotateEnabled={false}
      >
        {hasCoords && (
          <>
            <Marker coordinate={originCoords!}>
              <View style={s.markerOrigin}><View style={s.markerOriginInner} /></View>
            </Marker>
            <Marker coordinate={destinationCoords!}>
              <View style={s.markerDest} />
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
      <View style={[s.mapControls, { top: insets.top + 12 }]}>
        <TouchableOpacity style={s.mapFloatBtn} onPress={onBack} hitSlop={8}>
          <MaterialCommunityIcons name="arrow-left" size={18} color={T.ink} />
        </TouchableOpacity>

        {/* Step pill */}
        <View style={s.stepPill}>
          <StepDots current={3} total={4} />
        </View>

        <TouchableOpacity style={s.mapFloatBtn} hitSlop={8}>
          <MaterialCommunityIcons name="navigation-outline" size={18} color={T.ink} />
        </TouchableOpacity>
      </View>

      {/* Distance / route float card */}
      <View style={[s.mapInfoCard, { top: MAP_HEIGHT - 70 }]}>
        <View style={s.mapInfoLeft}>
          <View style={s.mapInfoBlock}>
            <Text style={s.mapInfoLabel}>DISTANCIA</Text>
            <Text style={s.mapInfoValue}>
              {quote ? `${quote.distance_km.toFixed(1)} km` : "— km"}
            </Text>
          </View>
          <View style={s.mapInfoDivider} />
          <View style={s.mapInfoBlock}>
            <Text style={s.mapInfoLabel}>RUTA</Text>
            <Text style={s.mapInfoRouteName} numberOfLines={1}>{originLabel} → {destLabel}</Text>
          </View>
        </View>
        <View style={s.okChip}>
          <View style={s.okDot} />
          <Text style={s.okText}>OK</Text>
        </View>
      </View>

      {/* Content column */}
      <View style={s.layout}>
        {/* spacer = map height minus overlap */}
        <View style={{ height: MAP_HEIGHT - SHEET_OVERLAP }} />

        {/* Bottom sheet */}
        <View style={s.sheet}>
          {/* Drag handle */}
          <View style={s.dragHandle} />

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[s.sheetContent, { paddingBottom: insets.bottom + 90 }]}
          >
            <Text style={s.sheetStepSub}>PASO 03 · ELEGÍ EL VIAJE</Text>
            <Text style={s.sheetTitle}>¿Cómo lo enviamos?</Text>

            {/* Dedicada card */}
            <TouchableOpacity
              style={[s.offerCard, mode === "dedicada" && s.offerCardSelectedNeutral]}
              onPress={() => setMode("dedicada")}
              activeOpacity={0.8}
            >
              <View style={[s.radio, mode === "dedicada" && s.radioActiveNeutral]}>
                {mode === "dedicada" && <View style={s.radioDotNeutral} />}
              </View>
              <View style={{ flex: 1 }}>
                <View style={s.offerTitleRow}>
                  <Text style={s.offerTitle}>Sólo tu envío</Text>
                  <View style={s.dedicadaTag}><Text style={s.dedicadaTagText}>DEDICADA</Text></View>
                </View>
                <View style={s.offerMeta}>
                  <Text style={s.offerMetaText}>{quote ? `${quote.eta_dedicated_min} min` : "—"}</Text>
                  <Text style={s.offerMetaText}>· Directo</Text>
                </View>
              </View>
              {quoteLoading
                ? <ActivityIndicator size="small" color={T.forest} />
                : <Text style={s.offerPrice}>{fmtPrice(quote?.price_dedicated)}</Text>}
            </TouchableOpacity>

            {/* Colaborativa card */}
            <TouchableOpacity
              style={[s.offerCard, mode === "colaborativa" && s.offerCardSelectedForest]}
              onPress={() => setMode("colaborativa")}
              activeOpacity={0.8}
            >
              {/* decorative lime blob */}
              {mode === "colaborativa" && <View style={s.limeBlob} />}

              <View style={[s.radio, mode === "colaborativa" && s.radioActiveLime]}>
                {mode === "colaborativa" && <View style={s.radioDotLime} />}
              </View>
              <View style={{ flex: 1, position: "relative" }}>
                <View style={s.offerTitleRow}>
                  <Text style={[s.offerTitle, mode === "colaborativa" && { color: "#F4EFE3" }]}>Compartí el viaje</Text>
                  <View style={s.ecoTag}><Text style={s.ecoTagText}>ECO −43%</Text></View>
                </View>
                <View style={s.offerMeta}>
                  <Text style={[s.offerMetaText, mode === "colaborativa" && { color: "rgba(244,239,227,0.65)" }]}>
                    {quote ? `${quote.eta_collaborative_min} min` : "—"}
                  </Text>
                  <Text style={[s.offerCo2, mode === "colaborativa" && { color: T.lime }]}>
                    {quote ? `−${quote.co2_savings_estimate_kg.toFixed(1)} kg CO₂` : ""}
                  </Text>
                </View>
              </View>
              <View style={{ alignItems: "flex-end", position: "relative" }}>
                {quoteLoading
                  ? <ActivityIndicator size="small" color={mode === "colaborativa" ? T.lime : T.forest} />
                  : <>
                      <Text style={[s.offerPrice, mode === "colaborativa" && { color: "#F4EFE3" }]}>{fmtPrice(quote?.price_collaborative)}</Text>
                      <Text style={[s.offerPriceStrike, mode === "colaborativa" && { color: "rgba(244,239,227,0.4)" }]}>{fmtPrice(quote?.price_dedicated)}</Text>
                    </>}
              </View>
            </TouchableOpacity>

            {/* Eco strip */}
            <View style={s.ecoStrip}>
              <View style={s.ecoAvatars}>
                {[
                  { initials: "MA", bg: T.amber },
                  { initials: "FC", bg: T.violet },
                  { initials: "RP", bg: T.emerald },
                ].map((av, i) => (
                  <View key={i} style={[s.ecoAvatar, { backgroundColor: av.bg, marginLeft: i === 0 ? 0 : -8 }]}>
                    <Text style={s.ecoAvatarText}>{av.initials}</Text>
                  </View>
                ))}
              </View>
              <Text style={s.ecoStripText}>
                <Text style={s.ecoStripBold}>3 cadetes </Text>
                están haciendo esta ruta ahora
              </Text>
            </View>
          </ScrollView>
        </View>
      </View>

      {/* Sticky footer CTA */}
      <View style={[s.footerCTA, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity style={s.ctaBtn} onPress={() => onNext(mode, quote)} activeOpacity={0.88}>
          <Text style={s.ctaBtnText}>Continuar · Resumen</Text>
          <MaterialCommunityIcons name="arrow-right" size={18} color="#F4EFE3" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  layout: { flex: 1 },

  map: { position: "absolute", top: 0, left: 0, right: 0, height: MAP_HEIGHT },

  mapControls: {
    position: "absolute", left: 16, right: 16,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    zIndex: 10,
  },
  mapFloatBtn: {
    width: 40, height: 40, borderRadius: 14,
    borderWidth: 1, borderColor: T.border,
    backgroundColor: "rgba(244,239,227,0.95)",
    alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 3,
  },
  stepPill: {
    backgroundColor: "rgba(244,239,227,0.95)",
    borderWidth: 1, borderColor: T.border, borderRadius: 14,
    paddingHorizontal: 12, paddingVertical: 8,
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 3,
  },

  mapInfoCard: {
    position: "absolute", left: 16, right: 16, zIndex: 10,
    backgroundColor: "rgba(244,239,227,0.95)",
    borderWidth: 1, borderColor: T.border, borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 10,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 4,
  },
  mapInfoLeft: { flexDirection: "row", alignItems: "center", gap: 14, flex: 1 },
  mapInfoBlock: {},
  mapInfoLabel: { fontSize: 8.5, letterSpacing: 1.2, color: T.inkMute, textTransform: "uppercase" },
  mapInfoValue: { fontSize: 16, fontWeight: "700", color: T.ink, letterSpacing: -0.4 },
  mapInfoRouteName: { fontSize: 13, color: T.ink, fontWeight: "600", maxWidth: 140 },
  mapInfoDivider: { width: 1, height: 24, backgroundColor: T.borderSoft },
  okChip: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: T.mint, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  okDot: { width: 5, height: 5, borderRadius: 5, backgroundColor: T.emeraldDeep },
  okText: { fontSize: 9, letterSpacing: 1, color: T.forest, fontWeight: "700", textTransform: "uppercase" },

  markerOrigin: {
    width: 22, height: 22, borderRadius: 22,
    backgroundColor: "#F4EFE3", borderWidth: 3, borderColor: T.forest,
    alignItems: "center", justifyContent: "center",
  },
  markerOriginInner: { width: 6, height: 6, borderRadius: 6, backgroundColor: T.forest },
  markerDest: {
    width: 18, height: 18, borderRadius: 4,
    backgroundColor: T.emerald, transform: [{ rotate: "45deg" }],
  },

  sheet: {
    flex: 1,
    backgroundColor: T.bg,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    shadowColor: T.forest, shadowOffset: { width: 0, height: -12 }, shadowOpacity: 0.12, shadowRadius: 30,
    elevation: 12,
    paddingTop: 14,
  },
  dragHandle: { width: 38, height: 4, backgroundColor: T.border, borderRadius: 3, alignSelf: "center", marginBottom: 12 },
  sheetContent: { paddingHorizontal: 16, gap: 10 },
  sheetStepSub: { fontSize: 10, letterSpacing: 2.5, color: T.emeraldDeep, textTransform: "uppercase" },
  sheetTitle: { fontSize: 22, fontWeight: "700", color: T.ink, letterSpacing: -0.7, lineHeight: 24, marginBottom: 2 },

  offerCard: {
    backgroundColor: T.card, borderRadius: 16,
    borderWidth: 1.5, borderColor: T.border,
    padding: 12, paddingHorizontal: 14,
    flexDirection: "row", alignItems: "center", gap: 12,
    overflow: "hidden",
  },
  offerCardSelectedNeutral: { borderColor: T.forest },
  offerCardSelectedForest: {
    backgroundColor: T.forest, borderColor: T.forest,
    shadowColor: T.forest, shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.4, shadowRadius: 24, elevation: 5,
  },
  limeBlob: {
    position: "absolute", right: -10, top: -10, width: 130, height: 90,
    borderRadius: 60, backgroundColor: T.lime, opacity: 0.16,
  },

  radio: { width: 22, height: 22, borderRadius: 22, borderWidth: 2, borderColor: T.border, backgroundColor: "transparent", alignItems: "center", justifyContent: "center" },
  radioActiveNeutral: { borderColor: T.forest },
  radioActiveLime: { borderColor: T.lime },
  radioDotNeutral: { width: 10, height: 10, borderRadius: 10, backgroundColor: T.forest },
  radioDotLime: { width: 10, height: 10, borderRadius: 10, backgroundColor: T.lime },

  offerTitleRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 2 },
  offerTitle: { fontSize: 15, fontWeight: "700", color: T.ink, letterSpacing: -0.3 },
  dedicadaTag: { backgroundColor: T.bg, borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2 },
  dedicadaTagText: { fontSize: 8, letterSpacing: 1, color: T.inkMute, textTransform: "uppercase" },
  ecoTag: { backgroundColor: T.lime, borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2 },
  ecoTagText: { fontSize: 8, letterSpacing: 1, color: T.forest, fontWeight: "700", textTransform: "uppercase" },

  offerMeta: { flexDirection: "row", gap: 10, alignItems: "center" },
  offerMetaText: { fontSize: 11.5, color: T.inkMute },
  offerCo2: { fontSize: 11.5, color: T.emeraldDeep, fontWeight: "600" },

  offerPrice: { fontSize: 18, fontWeight: "700", color: T.ink, letterSpacing: -0.5 },
  offerPriceStrike: { fontSize: 10, color: T.inkFaint, textDecorationLine: "line-through" },

  ecoStrip: {
    backgroundColor: T.cardSoft, borderRadius: 12,
    borderWidth: 1, borderColor: T.border, borderStyle: "dashed",
    padding: 10, paddingHorizontal: 12,
    flexDirection: "row", alignItems: "center", gap: 10,
  },
  ecoAvatars: { flexDirection: "row" },
  ecoAvatar: {
    width: 22, height: 22, borderRadius: 22,
    borderWidth: 2, borderColor: T.bg,
    alignItems: "center", justifyContent: "center",
  },
  ecoAvatarText: { fontSize: 7, fontWeight: "700", color: "#F4EFE3" },
  ecoStripText: { flex: 1, fontSize: 11.5, color: T.inkSoft, lineHeight: 16 },
  ecoStripBold: { color: T.ink, fontWeight: "600" },

  footerCTA: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    paddingHorizontal: 16, paddingTop: 24,
    zIndex: 20,
  },
  ctaBtn: {
    backgroundColor: T.forest, borderRadius: 16, height: 54,
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
    shadowColor: T.forest, shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.45, shadowRadius: 24, elevation: 5,
  },
  ctaBtnText: { color: "#F4EFE3", fontWeight: "600", fontSize: 15 },
});
