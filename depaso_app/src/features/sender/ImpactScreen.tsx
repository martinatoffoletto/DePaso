import { useCallback, useEffect, useState } from "react";
import { View, StyleSheet, ScrollView, RefreshControl, ActivityIndicator } from "react-native";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { co2Service } from "@/src/services";
import { ClientImpact } from "@/src/types";
import { T } from "@/constants/tokens";

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>["name"];

function EquivalenceCard({ icon, value, unit, label }: {
  icon: IconName; value: string; unit: string; label: string;
}) {
  return (
    <View style={s.eqCard}>
      <View style={s.eqIcon}>
        <MaterialCommunityIcons name={icon} size={20} color={T.forest} />
      </View>
      <Text style={s.eqValue}>
        {value}<Text style={s.eqUnit}> {unit}</Text>
      </Text>
      <Text style={s.eqLabel}>{label}</Text>
    </View>
  );
}

export default function ImpactScreen() {
  const insets = useSafeAreaInsets();
  const [impact, setImpact] = useState<ClientImpact | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    try {
      setError(false);
      setImpact(await co2Service.getMyImpact());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = () => { setRefreshing(true); load(); };

  if (loading) {
    return (
      <View style={[s.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator color={T.forest} size="large" />
      </View>
    );
  }

  const kg = impact?.total_co2_saved_kg ?? 0;
  const eq = impact?.equivalences;
  const collaborativeShare = impact && impact.shipments_delivered > 0
    ? impact.shipments_collaborative / impact.shipments_delivered
    : 0;

  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={T.forest} />}
      showsVerticalScrollIndicator={false}
    >
      <View style={[s.topBar, { paddingTop: insets.top + 6 }]}>
        <Text style={s.topTitle}>Impacto ambiental</Text>
      </View>

      {error && (
        <View style={s.errorBanner}>
          <MaterialCommunityIcons name="wifi-off" size={16} color={T.red} />
          <Text style={s.errorText}>No pudimos actualizar tus datos. Deslizá para reintentar.</Text>
        </View>
      )}

      {/* Hero: total CO2 saved */}
      <View style={s.heroCard}>
        <View style={s.heroBadge}>
          <MaterialCommunityIcons name="leaf" size={12} color={T.lime} />
          <Text style={s.heroBadgeText}>CO₂ EVITADO CON TUS ENVÍOS</Text>
        </View>
        <Text style={s.heroKg}>
          {kg.toFixed(2)}<Text style={s.heroUnit}> kg</Text>
        </Text>
        <Text style={s.heroSub}>
          Cada envío colaborativo aprovecha un viaje que ya iba a hacerse,
          en lugar de generar un viaje dedicado nuevo.
        </Text>
        <View style={s.heroStats}>
          <View style={[s.heroStatCol, s.heroStatBorder]}>
            <Text style={s.heroStatNum}>{impact?.shipments_delivered ?? 0}</Text>
            <Text style={s.heroStatLabel}>ENTREGADOS</Text>
          </View>
          <View style={[s.heroStatCol, s.heroStatBorder]}>
            <Text style={s.heroStatNum}>{impact?.shipments_collaborative ?? 0}</Text>
            <Text style={s.heroStatLabel}>COLABORATIVOS</Text>
          </View>
          <View style={s.heroStatCol}>
            <Text style={[s.heroStatNum, { color: T.lime }]}>{(collaborativeShare * 100).toFixed(0)}%</Text>
            <Text style={s.heroStatLabel}>ECO</Text>
          </View>
        </View>
      </View>

      {/* Equivalences */}
      <Text style={s.sectionTitle}>ESO EQUIVALE A…</Text>
      <View style={s.eqRow}>
        <EquivalenceCard
          icon="car-hatchback"
          value={(eq?.car_km ?? 0).toFixed(1)}
          unit="km"
          label="no recorridos en auto"
        />
        <EquivalenceCard
          icon="tree-outline"
          value={(eq?.tree_months ?? 0).toFixed(1)}
          unit="meses"
          label="de absorción de un árbol"
        />
      </View>
      <View style={[s.eqRow, { marginTop: 10 }]}>
        <EquivalenceCard
          icon="cellphone-charging"
          value={String(eq?.smartphone_charges ?? 0)}
          unit="cargas"
          label="completas de celular"
        />
        <View style={[s.eqCard, s.eqCardGhost]}>
          <MaterialCommunityIcons name="information-outline" size={18} color={T.inkMute} />
          <Text style={s.eqGhostText}>
            Calculado con factores IPCC al confirmar cada envío
          </Text>
        </View>
      </View>

      {/* How it works */}
      <Text style={s.sectionTitle}>CÓMO LO CALCULAMOS</Text>
      <View style={s.howCard}>
        <View style={s.howRow}>
          <View style={s.howIcon}>
            <MaterialCommunityIcons name="truck-fast-outline" size={16} color={T.inkSoft} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.howLabel}>Escenario sin DePaso</Text>
            <Text style={s.howValue}>Un viaje dedicado exclusivo para tu paquete</Text>
          </View>
        </View>
        <View style={s.howDivider} />
        <View style={s.howRow}>
          <View style={[s.howIcon, { backgroundColor: T.mint }]}>
            <MaterialCommunityIcons name="map-marker-path" size={16} color={T.forest} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.howLabel}>Escenario con DePaso</Text>
            <Text style={s.howValue}>Solo el desvío extra de un trayecto que ya existía</Text>
          </View>
        </View>
        <View style={s.howDivider} />
        <View style={s.howRow}>
          <View style={[s.howIcon, { backgroundColor: T.mint }]}>
            <MaterialCommunityIcons name="leaf" size={16} color={T.forest} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.howLabel}>Tu ahorro</Text>
            <Text style={s.howValue}>La diferencia entre ambos, sumada envío a envío</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 6 },
  topTitle: { fontSize: 22, fontWeight: "700", color: T.ink, letterSpacing: -0.6 },

  errorBanner: { flexDirection: "row", alignItems: "center", gap: 8, marginHorizontal: 16, marginTop: 8, backgroundColor: T.redBg, borderRadius: 12, padding: 12 },
  errorText: { flex: 1, fontSize: 12, color: T.red, fontWeight: "500" },

  heroCard: { margin: 16, marginTop: 14, borderRadius: 24, backgroundColor: T.forest, padding: 22, overflow: "hidden" },
  heroBadge: { flexDirection: "row", alignItems: "center", gap: 5, alignSelf: "flex-start", backgroundColor: "rgba(163,230,53,0.15)", borderWidth: 1, borderColor: "rgba(163,230,53,0.3)", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  heroBadgeText: { fontSize: 9, letterSpacing: 1.2, color: T.lime, fontWeight: "700" },
  heroKg: { fontSize: 48, fontWeight: "800", color: "#F4EFE3", letterSpacing: -1.5, marginTop: 12 },
  heroUnit: { fontSize: 20, fontWeight: "500", color: "rgba(244,239,227,0.7)" },
  heroSub: { fontSize: 12.5, lineHeight: 18, color: "rgba(244,239,227,0.7)", marginTop: 6 },
  heroStats: { flexDirection: "row", marginTop: 20 },
  heroStatCol: { flex: 1 },
  heroStatBorder: { borderRightWidth: 1, borderRightColor: "rgba(244,239,227,0.12)", paddingRight: 10, marginRight: 14 },
  heroStatNum: { fontSize: 20, fontWeight: "700", color: "#F4EFE3", letterSpacing: -0.5 },
  heroStatLabel: { fontSize: 9, letterSpacing: 1.3, color: "rgba(244,239,227,0.55)", marginTop: 2 },

  sectionTitle: { fontSize: 10, fontWeight: "700", letterSpacing: 2, color: T.inkMute, textTransform: "uppercase", marginHorizontal: 20, marginTop: 18, marginBottom: 8 },
  eqRow: { flexDirection: "row", gap: 10, marginHorizontal: 16 },
  eqCard: { flex: 1, backgroundColor: T.card, borderRadius: 18, borderWidth: 1, borderColor: T.border, padding: 16, gap: 6 },
  eqIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: T.mint, alignItems: "center", justifyContent: "center" },
  eqValue: { fontSize: 22, fontWeight: "700", color: T.ink, letterSpacing: -0.5, marginTop: 4 },
  eqUnit: { fontSize: 13, fontWeight: "500", color: T.inkMute },
  eqLabel: { fontSize: 11.5, color: T.inkMute },
  eqCardGhost: { backgroundColor: T.cardSoft, justifyContent: "center", alignItems: "flex-start" },
  eqGhostText: { fontSize: 11, lineHeight: 15, color: T.inkMute },

  howCard: { marginHorizontal: 16, backgroundColor: T.card, borderRadius: 18, borderWidth: 1, borderColor: T.border, overflow: "hidden" },
  howRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 13 },
  howIcon: { width: 32, height: 32, borderRadius: 9, backgroundColor: T.cardSoft, borderWidth: 1, borderColor: T.borderSoft, alignItems: "center", justifyContent: "center" },
  howLabel: { fontSize: 13, fontWeight: "600", color: T.ink },
  howValue: { fontSize: 11.5, color: T.inkMute, marginTop: 1 },
  howDivider: { height: 1, backgroundColor: T.borderSoft, marginLeft: 60 },
});
