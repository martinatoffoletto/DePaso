import { useCallback, useEffect, useRef, useState } from "react";
import { View, ScrollView, TouchableOpacity, ActivityIndicator, Alert, RefreshControl, StyleSheet } from "react-native";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import * as Location from "expo-location";
import { carriersService, trackingService } from "@/src/services/carriers";
import { shipmentsService } from "@/src/services/shipments";
import { CarrierSummary, DeliveryMode, PackageCategory, Shipment, ShipmentStatus } from "@/src/types";
import { reverseGeocode } from "@/src/utils/geocoding";
import { T } from "@/constants/tokens";

const SIZE_LABEL: Record<PackageCategory, string> = {
  [PackageCategory.S]:  "Pequeño",
  [PackageCategory.M]:  "Mediano",
  [PackageCategory.L]:  "Grande",
  [PackageCategory.XL]: "Flete",
};

const ACTIVE: ShipmentStatus[] = [
  ShipmentStatus.ASSIGNED,
  ShipmentStatus.PICKUP_ARRIVED,
  ShipmentStatus.IN_TRANSIT,
];

const STATUS_LABEL: Partial<Record<ShipmentStatus, { text: string; color: string; bg: string }>> = {
  [ShipmentStatus.ASSIGNED]:       { text: "ASIGNADO",  color: T.amber,       bg: T.amberBg },
  [ShipmentStatus.PICKUP_ARRIVED]: { text: "EN RETIRO", color: T.emeraldDeep, bg: T.mint },
  [ShipmentStatus.IN_TRANSIT]:     { text: "EN CAMINO", color: T.forest,      bg: T.mint },
};

const NEXT_ACTION: Partial<Record<ShipmentStatus, { next: ShipmentStatus; label: string; icon: any }>> = {
  [ShipmentStatus.ASSIGNED]:       { next: ShipmentStatus.PICKUP_ARRIVED, label: "Llegué al origen",  icon: "map-marker-check-outline" },
  [ShipmentStatus.PICKUP_ARRIVED]: { next: ShipmentStatus.IN_TRANSIT,     label: "Retiré el paquete", icon: "package-up" },
  [ShipmentStatus.IN_TRANSIT]:     { next: ShipmentStatus.DELIVERED,      label: "Entregué",          icon: "check-decagram-outline" },
};

function useAddress(lat: number, lon: number): string {
  const [addr, setAddr] = useState(`${lat.toFixed(3)}, ${lon.toFixed(3)}`);
  useEffect(() => {
    let alive = true;
    reverseGeocode(lat, lon).then(r => { if (alive) setAddr(r); });
    return () => { alive = false; };
  }, [lat, lon]);
  return addr;
}

function useGpsPublisher(active: boolean) {
  const watcher = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (!active) return;
    let cancelled = false;

    async function publishOnce() {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted" || cancelled) return;
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        if (!cancelled) await trackingService.publishPosition(pos.coords.latitude, pos.coords.longitude);
      } catch {}
    }

    publishOnce();
    watcher.current = setInterval(publishOnce, 20_000);
    return () => {
      cancelled = true;
      if (watcher.current) clearInterval(watcher.current);
    };
  }, [active]);
}

function ActiveJobCard({ shipment, onAdvance, advancing, onCancel }: {
  shipment: Shipment; onAdvance: (next: ShipmentStatus) => void; advancing: boolean; onCancel: () => void;
}) {
  const origAddr = useAddress(shipment.origin_lat, shipment.origin_lon);
  const destAddr = useAddress(shipment.destination_lat, shipment.destination_lon);
  const action = NEXT_ACTION[shipment.status];
  const isCollab = shipment.modality === DeliveryMode.COLLABORATIVE;
  const statusInfo = STATUS_LABEL[shipment.status];

  return (
    <View style={s.card}>
      <View style={[s.stripe, { backgroundColor: isCollab ? T.emerald : T.amber }]} />
      <View style={s.cardInner}>
        {/* Header */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Text style={s.cardId}>DP-{String(shipment.id).padStart(4, "0")}</Text>
            {statusInfo && (
              <View style={{ borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3, backgroundColor: statusInfo.bg }}>
                <Text style={{ fontSize: 9, letterSpacing: 1, fontWeight: "700", color: statusInfo.color, textTransform: "uppercase" }}>
                  {statusInfo.text}
                </Text>
              </View>
            )}
          </View>
          {shipment.estimated_price != null && (
            <Text style={s.price}>${shipment.estimated_price.toLocaleString("es-AR")}</Text>
          )}
        </View>

        {/* Route */}
        <View style={{ gap: 8, marginBottom: 12 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <View style={{ width: 9, height: 9, borderRadius: 5, borderWidth: 2, borderColor: T.forest, backgroundColor: T.card }} />
            <Text style={s.addr} numberOfLines={1}>{origAddr}</Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <View style={{ width: 9, height: 9, borderRadius: 3, backgroundColor: T.emerald, transform: [{ rotate: "45deg" }] }} />
            <Text style={s.addr} numberOfLines={1}>{destAddr}</Text>
          </View>
        </View>

        {/* Chips */}
        <View style={{ flexDirection: "row", gap: 6, marginBottom: 14 }}>
          <View style={s.chip}>
            <MaterialCommunityIcons name="package-variant" size={12} color={T.inkSoft} />
            <Text style={s.chipText}>{SIZE_LABEL[shipment.package_size]} · {shipment.weight_kg} kg</Text>
          </View>
          <View style={s.chip}>
            <MaterialCommunityIcons name={isCollab ? "account-group-outline" : "lightning-bolt"} size={12} color={T.inkSoft} />
            <Text style={s.chipText}>{isCollab ? "Colaborativa" : "Dedicada"}</Text>
          </View>
        </View>

        {/* Advance */}
        {action && (
          <TouchableOpacity style={s.advanceBtn} onPress={() => onAdvance(action.next)} disabled={advancing} activeOpacity={0.88}>
            {advancing
              ? <ActivityIndicator color="#F4EFE3" size="small" />
              : <>
                  <MaterialCommunityIcons name={action.icon} size={17} color="#F4EFE3" />
                  <Text style={s.advanceText}>{action.label}</Text>
                </>}
          </TouchableOpacity>
        )}

        {shipment.status === ShipmentStatus.ASSIGNED && (
          <TouchableOpacity style={s.bailBtn} onPress={onCancel} activeOpacity={0.8}>
            <Text style={s.bailText}>No puedo llevarlo · penaliza reputación</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

export default function CarrierShipmentsScreen() {
  const insets = useSafeAreaInsets();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [summary, setSummary] = useState<CarrierSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [advancingId, setAdvancingId] = useState<number | null>(null);

  const active = shipments.filter(sh => ACTIVE.includes(sh.status));
  const past = shipments.filter(sh => !ACTIVE.includes(sh.status) && sh.status !== ShipmentStatus.PENDING);

  useGpsPublisher(active.length > 0);

  async function load(asRefresh = false) {
    if (asRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const [list, sum] = await Promise.all([
        shipmentsService.getAssignedShipments(),
        carriersService.getSummary(),
      ]);
      setShipments(list);
      setSummary(sum);
    } catch {}
    finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useFocusEffect(useCallback(() => { load(); }, []));

  async function advance(shipment: Shipment, next: ShipmentStatus) {
    setAdvancingId(shipment.id);
    try {
      let coords: { lat: number; lon: number } | undefined;
      try {
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        coords = { lat: pos.coords.latitude, lon: pos.coords.longitude };
      } catch {}
      await shipmentsService.updateStatus(shipment.id, next, coords);
      load();
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      Alert.alert("Error", typeof detail === "string" ? detail : "No se pudo actualizar el estado.");
    } finally {
      setAdvancingId(null);
    }
  }

  function bail(shipment: Shipment) {
    Alert.alert(
      "Cancelar pedido",
      "Cancelar después de aceptar penaliza tu reputación. ¿Continuar?",
      [
        { text: "No, volver", style: "cancel" },
        {
          text: "Sí, cancelar", style: "destructive",
          onPress: async () => {
            try {
              await shipmentsService.carrierCancel(shipment.id);
              load();
            } catch {
              Alert.alert("Error", "No se pudo cancelar.");
            }
          },
        },
      ],
    );
  }

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      {/* ── Forest hero with stats ── */}
      <View style={s.hero}>
        <View style={{ marginBottom: 16 }}>
          <Text style={s.heroEyebrow}>MIS VIAJES</Text>
          <Text style={s.heroTitle}>Entregas</Text>
        </View>

        {summary && (
          <View style={s.statsRow}>
            {[
              { label: "Entregas",    value: String(summary.deliveries_completed), icon: "package-check-outline" as const },
              { label: "Ganancias",   value: `$${Math.round(summary.total_earnings / 1000).toFixed(1)}k`, icon: "cash-multiple" as const },
              { label: "Reputación",  value: summary.reputation.toFixed(1),                               icon: "star-outline" as const },
              { label: "CO₂",         value: `${summary.total_co2_saved_kg.toFixed(0)} kg`,               icon: "leaf-outline" as const },
            ].map((it, i) => (
              <View key={i} style={s.statCard}>
                <MaterialCommunityIcons name={it.icon} size={14} color="rgba(244,239,227,0.5)" />
                <Text style={s.statValue}>{it.value}</Text>
                <Text style={s.statLabel}>{it.label}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {loading ? (
        <View style={s.center}><ActivityIndicator size="large" color={T.forest} /></View>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, gap: 10, paddingBottom: insets.bottom + 32 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={T.forest} />}
          showsVerticalScrollIndicator={false}
        >
          {active.length > 0 && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 2, marginBottom: 2 }}>
              <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: T.emerald }} />
              <Text style={s.sectionLabel}>EN CURSO · TRANSMITIENDO UBICACIÓN</Text>
            </View>
          )}
          {active.map(sh => (
            <ActiveJobCard
              key={sh.id}
              shipment={sh}
              advancing={advancingId === sh.id}
              onAdvance={(next) => advance(sh, next)}
              onCancel={() => bail(sh)}
            />
          ))}

          {active.length === 0 && (
            <View style={s.center}>
              <View style={{ width: 72, height: 72, borderRadius: 22, backgroundColor: T.cardSoft, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: T.border, marginBottom: 4 }}>
                <MaterialCommunityIcons name="moped-outline" size={34} color={T.inkMute} />
              </View>
              <Text style={s.emptyTitle}>Sin entregas activas</Text>
              <Text style={s.emptySub}>Aceptá pedidos desde la pestaña Pedidos.</Text>
            </View>
          )}

          {past.length > 0 && (
            <>
              <Text style={[s.sectionLabel, { marginTop: 10, paddingHorizontal: 2 }]}>HISTORIAL</Text>
              {past.map(sh => {
                const delivered = sh.status === ShipmentStatus.DELIVERED;
                return (
                  <View key={sh.id} style={s.pastRow}>
                    <View style={[s.pastDot, { backgroundColor: delivered ? T.emerald : T.red }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={s.cardId}>DP-{String(sh.id).padStart(4, "0")}</Text>
                      <Text style={s.pastMeta}>{SIZE_LABEL[sh.package_size]} · {delivered ? "Entregado" : "Cancelado"}</Text>
                    </View>
                    {sh.estimated_price != null && delivered && (
                      <Text style={s.pastPrice}>+${sh.estimated_price.toLocaleString("es-AR")}</Text>
                    )}
                  </View>
                );
              })}
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },

  hero: { backgroundColor: T.forest, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 18 },
  heroEyebrow: { fontSize: 9.5, letterSpacing: 2.5, color: "rgba(244,239,227,0.45)", textTransform: "uppercase", fontWeight: "700" },
  heroTitle: { fontSize: 26, fontWeight: "800", color: "#F4EFE3", letterSpacing: -0.8, marginTop: 3 },

  statsRow: { flexDirection: "row", gap: 8 },
  statCard: { flex: 1, backgroundColor: "rgba(244,239,227,0.08)", borderRadius: 14, padding: 10, alignItems: "center", gap: 4, borderWidth: 1, borderColor: "rgba(244,239,227,0.1)" },
  statValue: { fontSize: 14, fontWeight: "800", color: "#F4EFE3", letterSpacing: -0.4 },
  statLabel: { fontSize: 8.5, letterSpacing: 0.5, color: "rgba(244,239,227,0.45)", textTransform: "uppercase", textAlign: "center" },

  center: { alignItems: "center", justifyContent: "center", gap: 10, padding: 40 },
  emptyTitle: { fontSize: 16, color: T.ink, fontWeight: "700", letterSpacing: -0.3, textAlign: "center" },
  emptySub: { fontSize: 13, color: T.inkMute, textAlign: "center" },

  sectionLabel: { fontSize: 9.5, letterSpacing: 2, color: T.inkMute, textTransform: "uppercase", fontWeight: "700" },

  card: { backgroundColor: T.card, borderRadius: 18, borderWidth: 1, borderColor: T.border, flexDirection: "row", overflow: "hidden" },
  stripe: { width: 4 },
  cardInner: { flex: 1, padding: 14 },

  cardId: { fontSize: 10, letterSpacing: 1.5, color: T.inkMute, fontWeight: "700" },
  price: { fontSize: 17, fontWeight: "800", color: T.ink, letterSpacing: -0.4 },
  addr: { flex: 1, fontSize: 13.5, color: T.ink, fontWeight: "500" },

  chip: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: T.cardSoft, borderWidth: 1, borderColor: T.borderSoft, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  chipText: { fontSize: 11, color: T.inkSoft, fontWeight: "500" },

  advanceBtn: { backgroundColor: T.forest, borderRadius: 14, height: 48, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  advanceText: { color: "#F4EFE3", fontWeight: "700", fontSize: 14 },
  bailBtn: { alignItems: "center", paddingTop: 12 },
  bailText: { fontSize: 12, color: T.red, fontWeight: "500" },

  pastRow: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: T.card, borderRadius: 14, borderWidth: 1, borderColor: T.borderSoft, padding: 14 },
  pastDot: { width: 9, height: 9, borderRadius: 5, flexShrink: 0 },
  pastMeta: { fontSize: 12, color: T.inkMute, marginTop: 2 },
  pastPrice: { fontSize: 14, fontWeight: "700", color: T.emeraldDeep },
});
