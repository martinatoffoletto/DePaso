import { useState } from "react";
import { View, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { T } from "@/constants/tokens";

type OfferMode = "dedicada" | "colaborativa";

type OfferSelectionScreenProps = {
  origin: string;
  destination: string;
  packageLabel: string;
  initialMode?: OfferMode;
  onBack: () => void;
  onNext: (mode: OfferMode) => void;
};

function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <View style={dotStyles.row}>
      {Array.from({ length: total }).map((_, i) => {
        const done = i < current - 1;
        const active = i === current - 1;
        return (
          <View
            key={i}
            style={[
              dotStyles.dot,
              { width: active ? 18 : 6, backgroundColor: done || active ? T.forest : T.border },
            ]}
          />
        );
      })}
      <Text style={dotStyles.counter}>
        {String(current).padStart(2, "0")}/{String(total).padStart(2, "0")}
      </Text>
    </View>
  );
}

const dotStyles = StyleSheet.create({
  row: { flexDirection: "row", gap: 6, alignItems: "center" },
  dot: { height: 6, borderRadius: 4 },
  counter: { fontSize: 10, letterSpacing: 1.5, color: T.inkMute, marginLeft: 4 },
});

function MiniMapView({ origin, destination }: { origin: string; destination: string }) {
  return (
    <View style={mapStyles.container}>
      {[26, 52, 78, 104].map((y) => (
        <View key={y} style={[mapStyles.hLine, { top: y }]} />
      ))}
      {[48, 96, 160, 224, 288].map((x) => (
        <View key={x} style={[mapStyles.vLine, { left: x }]} />
      ))}
      <View style={mapStyles.avenue} />
      <View style={[mapStyles.parkBlock, { top: 12, left: 24, width: 48, height: 28 }]} />
      <View style={[mapStyles.parkBlock, { top: 68, right: 40, width: 42, height: 30 }]} />

      {/* Origin dot */}
      <View style={mapStyles.originDot} />
      {/* Destination diamond */}
      <View style={mapStyles.destDiamond} />

      <View style={mapStyles.badge}>
        <Text style={mapStyles.badgeText}>AMBA · CABA</Text>
      </View>
    </View>
  );
}

const mapStyles = StyleSheet.create({
  container: {
    height: 120, borderRadius: 18, borderWidth: 1, borderColor: T.border,
    backgroundColor: "#EFE9D6", overflow: "hidden", position: "relative",
  },
  hLine: { position: "absolute", left: 0, right: 0, height: 1, backgroundColor: "#E0D4B0" },
  vLine: { position: "absolute", top: 0, bottom: 0, width: 1, backgroundColor: "#E0D4B0" },
  avenue: { position: "absolute", left: 0, right: 0, top: 52, height: 6, backgroundColor: "#D8C99B" },
  parkBlock: { position: "absolute", borderRadius: 3, backgroundColor: "#D5E6C8" },
  originDot: {
    position: "absolute", bottom: 20, left: 36,
    width: 14, height: 14, borderRadius: 7,
    backgroundColor: "#F4EFE3", borderWidth: 3, borderColor: T.forest,
  },
  destDiamond: {
    position: "absolute", top: 22, right: 60,
    width: 13, height: 13, borderRadius: 2,
    backgroundColor: T.emerald,
    transform: [{ rotate: "45deg" }],
  },
  badge: {
    position: "absolute", top: 10, right: 10,
    backgroundColor: "rgba(244,239,227,0.92)",
    borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3,
  },
  badgeText: { fontSize: 9, letterSpacing: 1.2, color: T.ink },
});

export function OfferSelectionScreen({
  origin, destination, packageLabel, initialMode, onBack, onNext,
}: OfferSelectionScreenProps) {
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<OfferMode>(initialMode ?? "colaborativa");

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Step header */}
      <View style={styles.stepHeader}>
        <TouchableOpacity style={styles.headerBtn} onPress={onBack} hitSlop={10}>
          <MaterialCommunityIcons name="arrow-left" size={18} color={T.ink} />
        </TouchableOpacity>
        <StepDots current={3} total={4} />
        <View style={styles.headerBtn}>
          <MaterialCommunityIcons name="creation" size={16} color={T.ink} />
        </View>
      </View>

      <View style={styles.stepTitleBlock}>
        <Text style={styles.stepSub}>PASO 03 · OFERTA</Text>
        <Text style={styles.stepTitle}>Elegí cómo{"\n"}querés enviar</Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Mini map */}
        <MiniMapView origin={origin} destination={destination} />

        {/* Route card */}
        <View style={styles.routeCard}>
          <View style={styles.routeInner}>
            <View style={styles.routeLeft}>
              <View style={styles.originRing} />
              <View style={styles.routeDash} />
              <View style={styles.destDiamond} />
            </View>
            <View style={styles.routeAddrs}>
              <Text style={styles.routeTag}>RETIRO</Text>
              <Text style={styles.routeAddr} numberOfLines={1}>{origin}</Text>
              <View style={{ height: 8 }} />
              <Text style={styles.routeTag}>ENTREGA</Text>
              <Text style={styles.routeAddr} numberOfLines={1}>{destination}</Text>
            </View>
            <View style={styles.routeDistCol}>
              <Text style={styles.distNum}>6.4<Text style={styles.distUnit}>km</Text></Text>
              <Text style={styles.distLabel}>DISTANCIA</Text>
            </View>
          </View>
        </View>

        {/* Dedicada card */}
        <TouchableOpacity
          style={[styles.dedicadaCard, selected === "dedicada" && styles.dedicadaSelected]}
          onPress={() => setSelected("dedicada")}
          activeOpacity={0.82}
        >
          <View style={styles.offerCardTop}>
            <View>
              <Text style={styles.offerTag}>OPCIÓN A · DEDICADA</Text>
              <Text style={styles.offerTitle}>Sólo tu envío</Text>
              <Text style={styles.offerDesc}>El cadete va directo, sin paradas.</Text>
            </View>
            <View style={styles.priceCol}>
              <Text style={styles.priceNum}>$6.900</Text>
              <Text style={styles.priceSub}>ARS · INCL.</Text>
            </View>
          </View>
          <View style={styles.offerStats}>
            <View style={styles.offerStatItem}>
              <MaterialCommunityIcons name="clock-outline" size={14} color={T.inkSoft} />
              <Text style={styles.offerStatText}>28 min</Text>
            </View>
            <View style={styles.offerStatItem}>
              <MaterialCommunityIcons name="map-marker-path" size={14} color={T.inkSoft} />
              <Text style={styles.offerStatText}>Directo</Text>
            </View>
            <View style={styles.offerStatItem}>
              <MaterialCommunityIcons name="shield-outline" size={14} color={T.inkSoft} />
              <Text style={styles.offerStatText}>Asegurado</Text>
            </View>
          </View>
          {selected === "dedicada" && (
            <View style={styles.selectedCheck}>
              <MaterialCommunityIcons name="check" size={12} color="#fff" />
            </View>
          )}
        </TouchableOpacity>

        {/* Colaborativa card — featured */}
        <TouchableOpacity
          style={styles.colaborativaCard}
          onPress={() => setSelected("colaborativa")}
          activeOpacity={0.85}
        >
          {/* Lime accent circle bg */}
          <View style={styles.limeAccent} />

          <View style={styles.ecoRibbon}>
            <Text style={styles.ecoRibbonText}>ECO · RECOMENDADO</Text>
          </View>

          <Text style={styles.colabTag}>OPCIÓN B · COLABORATIVA</Text>
          <Text style={styles.colabTitle}>Compartí el viaje</Text>
          <Text style={styles.colabDesc}>
            Un cadete pasa cerca y suma tu paquete. Más barato y mucho menos CO₂.
          </Text>

          <View style={styles.colabPriceRow}>
            <Text style={styles.colabPrice}>$3.900</Text>
            <View style={{ paddingBottom: 4 }}>
              <Text style={styles.colabPriceOld}>$6.900</Text>
              <Text style={styles.colabSavings}>−43% MÁS BARATO</Text>
            </View>
          </View>

          <View style={styles.colabStats}>
            <View style={styles.colabStatBox}>
              <Text style={styles.colabStatLabel}>TIEMPO</Text>
              <Text style={styles.colabStatNum}>54 min</Text>
            </View>
            <View style={[styles.colabStatBox, styles.colabStatBoxLime]}>
              <Text style={[styles.colabStatLabel, { color: T.lime }]}>AHORRO CO₂</Text>
              <Text style={[styles.colabStatNum, { color: T.lime }]}>−1.8 kg</Text>
            </View>
          </View>

          {selected === "colaborativa" && (
            <View style={[styles.selectedCheck, { backgroundColor: T.lime }]}>
              <MaterialCommunityIcons name="check" size={12} color={T.forest} />
            </View>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Sticky CTA */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity style={styles.ctaBtn} onPress={() => onNext(selected)} activeOpacity={0.87}>
          <Text style={styles.ctaBtnText}>
            {selected === "colaborativa" ? "Continuar con Colaborativa" : "Continuar con Dedicada"}
          </Text>
          <MaterialCommunityIcons name="arrow-right" size={18} color="#F4EFE3" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },

  stepHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  headerBtn: {
    width: 38, height: 38, borderRadius: 12,
    borderWidth: 1, borderColor: T.border,
    backgroundColor: T.card,
    alignItems: "center", justifyContent: "center",
  },

  stepTitleBlock: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 14 },
  stepSub: {
    fontSize: 10, letterSpacing: 2.5,
    color: T.emeraldDeep, textTransform: "uppercase", marginBottom: 4,
  },
  stepTitle: {
    fontSize: 26, fontWeight: "700", color: T.ink,
    letterSpacing: -0.8, lineHeight: 30,
  },

  content: { paddingHorizontal: 16, gap: 10 },

  // Route card
  routeCard: {
    backgroundColor: T.card, borderRadius: 18,
    borderWidth: 1, borderColor: T.border, padding: 14,
  },
  routeInner: { flexDirection: "row", alignItems: "center", gap: 10 },
  routeLeft: { alignItems: "center", width: 12 },
  originRing: {
    width: 12, height: 12, borderRadius: 6,
    borderWidth: 2, borderColor: T.forest, backgroundColor: T.card,
  },
  routeDash: { width: 1.5, height: 16, backgroundColor: T.inkFaint, opacity: 0.5, marginVertical: 2 },
  destDiamond: {
    width: 10, height: 10, borderRadius: 2,
    backgroundColor: T.emerald, transform: [{ rotate: "45deg" }],
  },
  routeAddrs: { flex: 1 },
  routeTag: { fontSize: 9, letterSpacing: 1.5, color: T.inkMute, textTransform: "uppercase" },
  routeAddr: { fontSize: 13, fontWeight: "500", color: T.ink },
  routeDistCol: {
    borderLeftWidth: 1, borderLeftColor: T.borderSoft,
    paddingLeft: 12, marginLeft: 8, alignItems: "flex-end",
  },
  distNum: { fontSize: 18, fontWeight: "700", color: T.ink, letterSpacing: -0.5 },
  distUnit: { fontSize: 11, fontWeight: "500", color: T.inkMute },
  distLabel: { fontSize: 9, letterSpacing: 1.2, color: T.inkMute, textTransform: "uppercase", marginTop: 2 },

  // Dedicada card
  dedicadaCard: {
    backgroundColor: T.card, borderRadius: 20,
    borderWidth: 1, borderColor: T.border, padding: 16, position: "relative",
  },
  dedicadaSelected: { borderColor: T.forest },
  offerCardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 },
  offerTag: { fontSize: 9, letterSpacing: 1.5, color: T.inkMute, textTransform: "uppercase", marginBottom: 4 },
  offerTitle: { fontSize: 22, fontWeight: "700", color: T.ink, letterSpacing: -0.6, lineHeight: 24 },
  offerDesc: { fontSize: 12.5, color: T.inkMute, marginTop: 4 },
  priceCol: { alignItems: "flex-end" },
  priceNum: { fontSize: 22, fontWeight: "700", color: T.ink, letterSpacing: -0.8, lineHeight: 24 },
  priceSub: { fontSize: 9, letterSpacing: 1, color: T.inkMute, marginTop: 2 },
  offerStats: {
    flexDirection: "row", gap: 14,
    paddingTop: 10, borderTopWidth: 1, borderTopColor: T.borderSoft,
  },
  offerStatItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  offerStatText: { fontSize: 12, color: T.inkSoft, fontWeight: "500" },

  // Colaborativa card
  colaborativaCard: {
    backgroundColor: T.forest, borderRadius: 20,
    padding: 16, position: "relative", overflow: "hidden",
    shadowColor: T.forest,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 8,
  },
  limeAccent: {
    position: "absolute", top: -30, right: -30,
    width: 160, height: 160, borderRadius: 80,
    backgroundColor: T.lime, opacity: 0.14,
  },
  ecoRibbon: {
    position: "absolute", top: 12, right: 12,
    backgroundColor: T.lime, borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  ecoRibbonText: {
    fontSize: 9, letterSpacing: 1.5, fontWeight: "700",
    color: T.forest, textTransform: "uppercase",
  },
  colabTag: {
    fontSize: 9, letterSpacing: 1.5,
    color: "rgba(244,239,227,0.55)", textTransform: "uppercase", marginBottom: 4,
  },
  colabTitle: {
    fontSize: 26, fontWeight: "700", color: "#F4EFE3",
    letterSpacing: -0.8, lineHeight: 28, marginBottom: 6,
  },
  colabDesc: {
    fontSize: 13, color: "rgba(244,239,227,0.72)",
    marginBottom: 16, lineHeight: 18, maxWidth: "90%",
  },
  colabPriceRow: { flexDirection: "row", alignItems: "flex-end", gap: 10, marginBottom: 14 },
  colabPrice: {
    fontSize: 38, fontWeight: "700", color: "#F4EFE3",
    letterSpacing: -1.2, lineHeight: 38,
  },
  colabPriceOld: {
    fontSize: 11, color: "rgba(244,239,227,0.45)",
    textDecorationLine: "line-through",
  },
  colabSavings: {
    fontSize: 9, letterSpacing: 1.5,
    color: T.lime, fontWeight: "700", textTransform: "uppercase",
  },
  colabStats: { flexDirection: "row", gap: 10 },
  colabStatBox: {
    flex: 1, backgroundColor: "rgba(244,239,227,0.08)",
    borderRadius: 12, padding: 10,
    borderWidth: 1, borderColor: "rgba(244,239,227,0.1)",
  },
  colabStatBoxLime: {
    backgroundColor: "rgba(163,230,53,0.14)",
    borderColor: "rgba(163,230,53,0.3)",
  },
  colabStatLabel: {
    fontSize: 9, letterSpacing: 1, color: "rgba(244,239,227,0.5)",
    textTransform: "uppercase",
  },
  colabStatNum: {
    fontSize: 17, fontWeight: "700", color: "#F4EFE3",
    marginTop: 2, letterSpacing: -0.4,
  },

  selectedCheck: {
    position: "absolute", top: 10, left: 10,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: T.forest,
    alignItems: "center", justifyContent: "center",
  },

  // Footer CTA
  footer: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    paddingHorizontal: 16, paddingTop: 16,
    backgroundColor: T.bg,
    borderTopWidth: 1, borderTopColor: T.border,
  },
  ctaBtn: {
    backgroundColor: T.forest, borderRadius: 16,
    paddingVertical: 16, flexDirection: "row",
    alignItems: "center", justifyContent: "center", gap: 10,
    shadowColor: T.forest,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 6,
  },
  ctaBtnText: { color: "#F4EFE3", fontSize: 15, fontWeight: "600" },
});
