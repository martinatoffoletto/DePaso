import { useCallback, useEffect, useState } from "react";
import {
  View, StyleSheet, ScrollView, RefreshControl,
  ActivityIndicator, TouchableOpacity, Alert,
} from "react-native";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { adminService } from "@/src/services/admin";
import { AdminDashboard, Carrier, ModerationAction } from "@/src/types";
import { T } from "@/constants/tokens";

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>["name"];

const VEHICLE_LABELS: Record<string, string> = {
  pedestrian: "A pie",
  bike: "Bicicleta",
  motorcycle: "Moto",
  car: "Auto",
  van: "Camioneta",
  truck: "Camión",
};

function MetricCard({ icon, value, label, accent = false }: {
  icon: IconName; value: string; label: string; accent?: boolean;
}) {
  return (
    <View style={s.metricCard}>
      <View style={[s.metricIcon, accent && { backgroundColor: T.mint }]}>
        <MaterialCommunityIcons name={icon} size={18} color={accent ? T.forest : T.inkSoft} />
      </View>
      <Text style={s.metricValue}>{value}</Text>
      <Text style={s.metricLabel}>{label}</Text>
    </View>
  );
}

function PendingCarrierCard({ carrier, onModerate, busy }: {
  carrier: Carrier;
  onModerate: (id: number, action: ModerationAction) => void;
  busy: boolean;
}) {
  return (
    <View style={s.carrierCard}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <View style={s.carrierIcon}>
          <MaterialCommunityIcons name="truck-outline" size={18} color={T.amber} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={s.carrierName} numberOfLines={1}>{carrier.company_name}</Text>
          <Text style={s.carrierDetail}>
            {VEHICLE_LABELS[carrier.vehicle_type] ?? carrier.vehicle_type} · {carrier.license_plate} · {carrier.capacity_kg} kg
          </Text>
        </View>
      </View>
      <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
        <TouchableOpacity
          style={[s.modBtn, s.modBtnVerify, busy && { opacity: 0.5 }]}
          disabled={busy}
          onPress={() => onModerate(carrier.id, "verify")}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="check-decagram-outline" size={15} color="#F4EFE3" />
          <Text style={s.modBtnVerifyText}>Verificar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.modBtn, s.modBtnSuspend, busy && { opacity: 0.5 }]}
          disabled={busy}
          onPress={() =>
            Alert.alert("Suspender cadete", `¿Suspender a "${carrier.company_name}"?`, [
              { text: "Cancelar", style: "cancel" },
              { text: "Suspender", style: "destructive", onPress: () => onModerate(carrier.id, "suspend") },
            ])
          }
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="cancel" size={15} color={T.red} />
          <Text style={s.modBtnSuspendText}>Suspender</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function AdminScreen() {
  const insets = useSafeAreaInsets();
  const [dashboard, setDashboard] = useState<AdminDashboard | null>(null);
  const [pending, setPending] = useState<Carrier[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const [moderatingId, setModeratingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      setError(false);
      const [dash, carriers] = await Promise.all([
        adminService.getDashboard(),
        adminService.getPendingCarriers(),
      ]);
      setDashboard(dash);
      setPending(carriers);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = () => { setRefreshing(true); load(); };

  const moderate = async (carrierId: number, action: ModerationAction) => {
    setModeratingId(carrierId);
    try {
      await adminService.moderateCarrier(carrierId, action);
      setPending((prev) => prev.filter((c) => c.id !== carrierId));
      const dash = await adminService.getDashboard();
      setDashboard(dash);
    } catch {
      Alert.alert("Error", "No se pudo aplicar la acción. Intentá de nuevo.");
    } finally {
      setModeratingId(null);
    }
  };

  if (loading) {
    return (
      <View style={[s.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator color={T.forest} size="large" />
      </View>
    );
  }

  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={T.forest} />}
      showsVerticalScrollIndicator={false}
    >
      <View style={[s.topBar, { paddingTop: insets.top + 6 }]}>
        <Text style={s.topTitle}>Panel de control</Text>
        <View style={s.adminBadge}>
          <MaterialCommunityIcons name="shield-account-outline" size={12} color={T.forest} />
          <Text style={s.adminBadgeText}>ADMIN</Text>
        </View>
      </View>

      {error && (
        <View style={s.errorBanner}>
          <MaterialCommunityIcons name="wifi-off" size={16} color={T.red} />
          <Text style={s.errorText}>No pudimos cargar los datos. Deslizá para reintentar.</Text>
        </View>
      )}

      {/* Operations */}
      <Text style={s.sectionTitle}>OPERACIÓN</Text>
      <View style={s.metricsRow}>
        <MetricCard icon="package-variant-closed" value={String(dashboard?.shipments_total ?? 0)} label="Envíos totales" />
        <MetricCard icon="truck-fast-outline" value={String(dashboard?.shipments_active ?? 0)} label="En curso" />
      </View>
      <View style={[s.metricsRow, { marginTop: 10 }]}>
        <MetricCard icon="check-circle-outline" value={String(dashboard?.shipments_delivered ?? 0)} label="Entregados" accent />
        <MetricCard icon="clock-outline" value={String(dashboard?.shipments_pending ?? 0)} label="Sin asignar" />
      </View>

      {/* Platform */}
      <Text style={s.sectionTitle}>PLATAFORMA</Text>
      <View style={s.metricsRow}>
        <MetricCard icon="account-group-outline" value={String(dashboard?.total_users ?? 0)} label="Usuarios" />
        <MetricCard icon="bike-fast" value={String(dashboard?.total_carriers ?? 0)} label="Cadetes" />
      </View>
      <View style={[s.metricsRow, { marginTop: 10 }]}>
        <MetricCard
          icon="leaf"
          value={`${(dashboard?.total_co2_saved_kg ?? 0).toFixed(1)} kg`}
          label="CO₂ ahorrado"
          accent
        />
        <MetricCard
          icon="handshake-outline"
          value={`${((dashboard?.matching_success_rate ?? 0) * 100).toFixed(0)}%`}
          label="Tasa de éxito"
        />
      </View>

      {/* Pending carriers */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginRight: 20 }}>
        <Text style={s.sectionTitle}>CADETES PENDIENTES DE VERIFICACIÓN</Text>
        {pending.length > 0 && (
          <View style={s.countPill}>
            <Text style={s.countPillText}>{pending.length}</Text>
          </View>
        )}
      </View>
      {pending.length === 0 ? (
        <View style={s.empty}>
          <MaterialCommunityIcons name="check-decagram-outline" size={42} color={T.border} />
          <Text style={s.emptyText}>No hay verificaciones pendientes</Text>
        </View>
      ) : (
        <View style={{ marginHorizontal: 16, gap: 10 }}>
          {pending.map((c) => (
            <PendingCarrierCard
              key={c.id}
              carrier={c}
              onModerate={moderate}
              busy={moderatingId === c.id}
            />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 6 },
  topTitle: { fontSize: 22, fontWeight: "700", color: T.ink, letterSpacing: -0.6 },
  adminBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: T.mint, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  adminBadgeText: { fontSize: 9, letterSpacing: 1.2, color: T.forest, fontWeight: "700" },

  errorBanner: { flexDirection: "row", alignItems: "center", gap: 8, marginHorizontal: 16, marginTop: 8, backgroundColor: T.redBg, borderRadius: 12, padding: 12 },
  errorText: { flex: 1, fontSize: 12, color: T.red, fontWeight: "500" },

  sectionTitle: { fontSize: 10, fontWeight: "700", letterSpacing: 2, color: T.inkMute, textTransform: "uppercase", marginHorizontal: 20, marginTop: 18, marginBottom: 8 },
  metricsRow: { flexDirection: "row", gap: 10, marginHorizontal: 16 },
  metricCard: { flex: 1, backgroundColor: T.card, borderRadius: 18, borderWidth: 1, borderColor: T.border, padding: 14, gap: 4 },
  metricIcon: { width: 34, height: 34, borderRadius: 10, backgroundColor: T.cardSoft, borderWidth: 1, borderColor: T.borderSoft, alignItems: "center", justifyContent: "center" },
  metricValue: { fontSize: 21, fontWeight: "700", color: T.ink, letterSpacing: -0.5, marginTop: 4 },
  metricLabel: { fontSize: 11, color: T.inkMute },

  countPill: { backgroundColor: T.amberBg, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, marginTop: 18, marginBottom: 8 },
  countPillText: { fontSize: 11, fontWeight: "700", color: T.amber },

  carrierCard: { backgroundColor: T.card, borderRadius: 16, borderWidth: 1, borderColor: T.border, padding: 14 },
  carrierIcon: { width: 38, height: 38, borderRadius: 10, backgroundColor: T.amberBg, alignItems: "center", justifyContent: "center" },
  carrierName: { fontSize: 14, fontWeight: "700", color: T.ink, letterSpacing: -0.2 },
  carrierDetail: { fontSize: 11.5, color: T.inkMute, marginTop: 2 },
  modBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderRadius: 11, paddingVertical: 10 },
  modBtnVerify: { backgroundColor: T.forest },
  modBtnVerifyText: { fontSize: 13, fontWeight: "700", color: "#F4EFE3" },
  modBtnSuspend: { borderWidth: 1, borderColor: T.border, backgroundColor: T.cardSoft },
  modBtnSuspendText: { fontSize: 13, fontWeight: "600", color: T.red },

  empty: { alignItems: "center", gap: 10, paddingVertical: 36 },
  emptyText: { fontSize: 13, color: T.inkMute, fontWeight: "500" },
});
