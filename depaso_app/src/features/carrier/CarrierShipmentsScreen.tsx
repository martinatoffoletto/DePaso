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
  [PackageCategory.XS]: "Sobre",
  [PackageCategory.S]:  "Chico",
  [PackageCategory.M]:  "Mediano",
  [PackageCategory.L]:  "Grande",
  [PackageCategory.XL]: "Voluminoso",
};

const ACTIVE: ShipmentStatus[] = [
  ShipmentStatus.ASSIGNED,
  ShipmentStatus.PICKUP_ARRIVED,
  ShipmentStatus.IN_TRANSIT,
];

// Next milestone per status (RF-CAR-05)
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

/** Publishes the carrier GPS position every 20 s while there are active shipments (RF-TRK-01). */
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
        if (!cancelled) {
          await trackingService.publishPosition(pos.coords.latitude, pos.coords.longitude);
        }
      } catch {
        // network/GPS hiccups are fine — next tick retries
      }
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

  return (
    <View style={s.card}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <Text style={s.cardId}>DP-{String(shipment.id).padStart(4, "0")}</Text>
        <View style={[s.modeTag, { backgroundColor: isCollab ? T.mint : T.amberBg }]}>
          <Text style={[s.modeTagText, { color: isCollab ? T.forest : T.amber }]}>
            {isCollab ? "COLABORATIVA" : "DEDICADA"}
          </Text>
        </View>
      </View>

      <View style={{ gap: 6, marginBottom: 12 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, borderWidth: 1.8, borderColor: T.forest, backgroundColor: T.card }} />
          <Text style={s.addr} numberOfLines={1}>{origAddr}</Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <View style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: T.emerald, transform: [{ rotate: "45deg" }] }} />
          <Text style={s.addr} numberOfLines={1}>{destAddr}</Text>
        </View>
      </View>

      <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
        <View style={s.chip}>
          <MaterialCommunityIcons name="package-variant" size={12} color={T.inkSoft} />
          <Text style={s.chipText}>{SIZE_LABEL[shipment.package_size]} · {shipment.weight_kg} kg</Text>
        </View>
        {shipment.estimated_price != null && (
          <View style={s.chip}>
            <MaterialCommunityIcons name="cash" size={12} color={T.inkSoft} />
            <Text style={s.chipText}>${shipment.estimated_price.toLocaleString("es-AR")}</Text>
          </View>
        )}
      </View>

      {action && (
        <TouchableOpacity style={s.advanceBtn} onPress={() => onAdvance(action.next)} disabled={advancing} activeOpacity={0.88}>
          {advancing
            ? <ActivityIndicator color={T.lime} size="small" />
            : <>
                <MaterialCommunityIcons name={action.icon} size={17} color={T.lime} />
                <Text style={s.advanceText}>{action.label}</Text>
              </>}
        </TouchableOpacity>
      )}

      {shipment.status === ShipmentStatus.ASSIGNED && (
        <TouchableOpacity style={s.bailBtn} onPress={onCancel} activeOpacity={0.8}>
          <Text style={s.bailText}>No puedo llevarlo (penaliza reputación)</Text>
        </TouchableOpacity>
      )}
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
    asRefresh ? setRefreshing(true) : setLoading(true);
    try {
      const [list, sum] = await Promise.all([
        shipmentsService.getAssignedShipments(),
        carriersService.getSummary(),
      ]);
      setShipments(list);
      setSummary(sum);
    } catch {
      // no carrier profile or network error — keep previous state
    } finally {
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
      } catch { /* status update works without coords */ }
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
      <View style={s.header}>
        <Text style={s.eyebrow}>MIS VIAJES</Text>
        <Text style={s.title}>Entregas</Text>
      </View>

      {loading ? (
        <View style={s.center}><ActivityIndicator size="large" color={T.forest} /></View>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 14, gap: 10, paddingBottom: insets.bottom + 32 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={T.forest} />}
          showsVerticalScrollIndicator={false}
        >
          {/* Earnings summary (RF-CAR-06) */}
          {summary && (
            <View style={s.summaryRow}>
              {[
                { label: "ENTREGAS", value: String(summary.deliveries_completed) },
                { label: "GANANCIAS", value: `$${Math.round(summary.total_earnings).toLocaleString("es-AR")}` },
                { label: "REPUTACIÓN", value: `${summary.reputation.toFixed(1)}★` },
                { label: "CO₂ AHORRADO", value: `${summary.total_co2_saved_kg.toFixed(1)} kg` },
              ].map((it, i) => (
                <View key={i} style={s.summaryCard}>
                  <Text style={s.summaryValue}>{it.value}</Text>
                  <Text style={s.summaryLabel}>{it.label}</Text>
                </View>
              ))}
            </View>
          )}

          {active.length > 0 && <Text style={s.sectionLabel}>EN CURSO · TRANSMITIENDO UBICACIÓN</Text>}
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
              <MaterialCommunityIcons name="moped-outline" size={56} color={T.border} />
              <Text style={s.emptyTitle}>Sin entregas activas</Text>
              <Text style={s.emptySub}>Aceptá pedidos desde la pestaña Pedidos.</Text>
            </View>
          )}

          {past.length > 0 && (
            <>
              <Text style={[s.sectionLabel, { marginTop: 8 }]}>HISTORIAL</Text>
              {past.map(sh => (
                <View key={sh.id} style={s.pastRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.cardId}>DP-{String(sh.id).padStart(4, "0")}</Text>
                    <Text style={s.pastMeta}>
                      {SIZE_LABEL[sh.package_size]} · {sh.status === ShipmentStatus.DELIVERED ? "Entregado" : "Cancelado"}
                    </Text>
                  </View>
                  {sh.estimated_price != null && sh.status === ShipmentStatus.DELIVERED && (
                    <Text style={s.pastPrice}>+${sh.estimated_price.toLocaleString("es-AR")}</Text>
                  )}
                </View>
              ))}
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  header: { paddingHorizontal: 20, paddingTop: 6 },
  eyebrow: { fontSize: 10, letterSpacing: 2.5, color: T.inkMute, textTransform: "uppercase" },
  title: { fontSize: 26, fontWeight: "700", color: T.ink, letterSpacing: -0.8, marginTop: 4 },
  center: { alignItems: "center", justifyContent: "center", gap: 10, padding: 40 },
  emptyTitle: { fontSize: 15, color: T.inkMute, fontWeight: "600" },
  emptySub: { fontSize: 13, color: T.inkMute, textAlign: "center" },
  sectionLabel: { fontSize: 10, letterSpacing: 2, color: T.inkMute, textTransform: "uppercase", fontWeight: "600", paddingHorizontal: 4 },

  summaryRow: { flexDirection: "row", gap: 8 },
  summaryCard: { flex: 1, backgroundColor: T.card, borderRadius: 14, borderWidth: 1, borderColor: T.border, padding: 10, alignItems: "center" },
  summaryValue: { fontSize: 15, fontWeight: "700", color: T.ink, letterSpacing: -0.4 },
  summaryLabel: { fontSize: 7.5, letterSpacing: 0.8, color: T.inkMute, textTransform: "uppercase", marginTop: 2, textAlign: "center" },

  card: { backgroundColor: T.card, borderRadius: 18, borderWidth: 1, borderColor: T.border, padding: 14 },
  cardId: { fontSize: 10, letterSpacing: 1.5, color: T.ink, fontWeight: "700" },
  modeTag: { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  modeTagText: { fontSize: 9, letterSpacing: 1, fontWeight: "700", textTransform: "uppercase" },
  addr: { flex: 1, fontSize: 13, color: T.ink, fontWeight: "500" },
  chip: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: T.cardSoft, borderWidth: 1, borderColor: T.borderSoft, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  chipText: { fontSize: 11, color: T.inkSoft, fontWeight: "500" },

  advanceBtn: { backgroundColor: T.forest, borderRadius: 14, height: 48, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  advanceText: { color: "#F4EFE3", fontWeight: "600", fontSize: 14 },
  bailBtn: { alignItems: "center", paddingTop: 10 },
  bailText: { fontSize: 12, color: T.red, fontWeight: "500" },

  pastRow: { flexDirection: "row", alignItems: "center", backgroundColor: T.card, borderRadius: 14, borderWidth: 1, borderColor: T.borderSoft, padding: 12 },
  pastMeta: { fontSize: 12, color: T.inkMute, marginTop: 2 },
  pastPrice: { fontSize: 14, fontWeight: "700", color: T.emeraldDeep },
});
