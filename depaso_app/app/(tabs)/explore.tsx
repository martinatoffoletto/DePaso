import { useEffect, useState } from "react";
import { View, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from "react-native";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { shipmentsService } from "@/src/services/shipments";
import { Shipment, ShipmentStatus, DeliveryMode, PackageCategory } from "@/src/types";

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>["name"];

const STATUS_CONFIG: Record<
  ShipmentStatus,
  { label: string; color: string; bg: string; icon: IconName }
> = {
  [ShipmentStatus.PENDING]:    { label: "Pendiente",  color: "#92400E", bg: "#FEF3C7", icon: "clock-outline" },
  [ShipmentStatus.ASSIGNED]:   { label: "Asignado",   color: "#1D4ED8", bg: "#DBEAFE", icon: "account-check-outline" },
  [ShipmentStatus.IN_TRANSIT]: { label: "En camino",  color: "#15803D", bg: "#DCFCE7", icon: "truck-fast-outline" },
  [ShipmentStatus.DELIVERED]:  { label: "Entregado",  color: "#64748B", bg: "#F1F5F9", icon: "check-circle-outline" },
  [ShipmentStatus.CANCELLED]:  { label: "Cancelado",  color: "#DC2626", bg: "#FEE2E2", icon: "close-circle-outline" },
};

const SIZE_LABEL: Record<PackageCategory, string> = {
  [PackageCategory.XS]: "Sobre",
  [PackageCategory.S]:  "Caja chica",
  [PackageCategory.M]:  "Caja mediana",
  [PackageCategory.L]:  "Caja grande",
  [PackageCategory.XL]: "Voluminoso",
};

const ACTIVE_STATUSES = [ShipmentStatus.PENDING, ShipmentStatus.ASSIGNED, ShipmentStatus.IN_TRANSIT];

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMs / 3600000);
  const diffD = Math.floor(diffMs / 86400000);
  if (diffMin < 60) return `Hace ${diffMin} min`;
  if (diffH < 24)   return `Hace ${diffH} h`;
  if (diffD < 7)    return `Hace ${diffD} días`;
  return d.toLocaleDateString("es-AR", { day: "numeric", month: "short" });
}

function ShipmentCard({ item }: { item: Shipment }) {
  const st = STATUS_CONFIG[item.status] ?? STATUS_CONFIG[ShipmentStatus.PENDING];
  const isCollaborative = item.modality === DeliveryMode.COLLABORATIVE;
  const isActive = ACTIVE_STATUSES.includes(item.status);

  return (
    <View style={[styles.card, isActive && styles.cardActive]}>
      {/* Status + modality */}
      <View style={styles.cardTop}>
        <View style={[styles.statusPill, { backgroundColor: st.bg }]}>
          <MaterialCommunityIcons name={st.icon} size={13} color={st.color} />
          <Text style={[styles.statusText, { color: st.color }]}>{st.label}</Text>
        </View>
        <View style={styles.modalityPill}>
          <MaterialCommunityIcons
            name={isCollaborative ? "account-group-outline" : "lightning-bolt"}
            size={13}
            color={isCollaborative ? "#16A34A" : "#F59E0B"}
          />
          <Text style={[styles.modalityText, { color: isCollaborative ? "#16A34A" : "#92400E" }]}>
            {isCollaborative ? "Colaborativa" : "Dedicada"}
          </Text>
        </View>
      </View>

      {/* Route visual */}
      <View style={styles.routeRow}>
        <View style={styles.routeDotsCol}>
          <View style={[styles.routeDot, { backgroundColor: "#16A34A" }]} />
          <View style={styles.routeDotLine} />
          <View style={[styles.routeDot, { backgroundColor: "#EF4444", borderRadius: 2 }]} />
        </View>
        <View style={styles.routeLabels}>
          <Text variant="bodySmall" style={styles.routeCoord} numberOfLines={1}>
            {item.origin_lat.toFixed(4)}, {item.origin_lon.toFixed(4)}
          </Text>
          <Text variant="bodySmall" style={styles.routeCoord} numberOfLines={1}>
            {item.destination_lat.toFixed(4)}, {item.destination_lon.toFixed(4)}
          </Text>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.cardFooter}>
        <View style={styles.cardMeta}>
          <MaterialCommunityIcons name="package-variant-closed" size={13} color="#94A3B8" />
          <Text variant="labelSmall" style={styles.metaText}>
            {SIZE_LABEL[item.package_size]} · {item.weight_kg} kg
          </Text>
        </View>
        <View style={styles.cardRight}>
          {item.estimated_price != null && (
            <Text variant="labelLarge" style={styles.price}>
              ${item.estimated_price.toLocaleString("es-AR")}
            </Text>
          )}
          <Text variant="labelSmall" style={styles.dateText}>
            {formatDate(item.created_at)}
          </Text>
        </View>
      </View>

      {/* CO2 badge — solo colaborativos entregados */}
      {item.co2_savings_kg != null && item.co2_savings_kg > 0 && item.status === ShipmentStatus.DELIVERED && (
        <View style={styles.co2Row}>
          <MaterialCommunityIcons name="leaf" size={13} color="#16A34A" />
          <Text style={styles.co2Text}>Ahorraste {item.co2_savings_kg} kg de CO₂</Text>
        </View>
      )}
    </View>
  );
}

export default function MisEnviosScreen() {
  const insets = useSafeAreaInsets();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  async function load() {
    setLoading(true);
    setError(false);
    try {
      const data = await shipmentsService.getMyShipments(0, 50);
      // Ordenar: activos primero, luego por fecha desc
      const sorted = [...data].sort((a, b) => {
        const aActive = ACTIVE_STATUSES.includes(a.status) ? 1 : 0;
        const bActive = ACTIVE_STATUSES.includes(b.status) ? 1 : 0;
        if (aActive !== bActive) return bActive - aActive;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
      setShipments(sorted);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const active = shipments.filter(s => ACTIVE_STATUSES.includes(s.status));
  const history = shipments.filter(s => !ACTIVE_STATUSES.includes(s.status));

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text variant="headlineSmall" style={styles.title}>Mis envíos</Text>
        {!loading && (
          <TouchableOpacity onPress={load} hitSlop={12}>
            <MaterialCommunityIcons name="refresh" size={22} color="#64748B" />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#16A34A" />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <MaterialCommunityIcons name="wifi-off" size={48} color="#CBD5E1" />
          <Text variant="bodyMedium" style={styles.emptyTitle}>Sin conexión</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={load}>
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : shipments.length === 0 ? (
        <View style={styles.center}>
          <MaterialCommunityIcons name="truck-delivery-outline" size={64} color="#CBD5E1" />
          <Text variant="titleMedium" style={styles.emptyTitle}>Sin envíos todavía</Text>
          <Text variant="bodyMedium" style={styles.emptySubtitle}>
            Tus envíos activos e historial aparecerán acá
          </Text>
        </View>
      ) : (
        <FlatList
          data={[
            ...(active.length > 0 ? [{ type: "section", title: "ACTIVOS", key: "s1" }] : []),
            ...active.map(s => ({ type: "item", data: s, key: `s-${s.id}` })),
            ...(history.length > 0 ? [{ type: "section", title: "HISTORIAL", key: "s2" }] : []),
            ...history.map(s => ({ type: "item", data: s, key: `h-${s.id}` })),
          ]}
          keyExtractor={(item: any) => item.key}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }: any) => {
            if (item.type === "section") {
              return (
                <Text variant="labelMedium" style={styles.sectionLabel}>
                  {item.title}
                </Text>
              );
            }
            return <ShipmentCard item={item.data} />;
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
  },
  title: { fontWeight: "700", color: "#0F172A" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 40 },
  emptyTitle: { color: "#64748B", fontWeight: "600" },
  emptySubtitle: { color: "#94A3B8", textAlign: "center" },
  retryBtn: {
    marginTop: 4,
    backgroundColor: "#16A34A",
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  retryText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  list: { padding: 16, gap: 10, paddingBottom: 40 },
  sectionLabel: {
    color: "#94A3B8",
    letterSpacing: 1,
    marginTop: 8,
    marginBottom: 4,
    marginLeft: 4,
  },
  // Card
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 16,
    gap: 12,
  },
  cardActive: {
    borderColor: "#BBF7D0",
    backgroundColor: "#F8FFF9",
  },
  cardTop: { flexDirection: "row", gap: 8 },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusText: { fontSize: 12, fontWeight: "600" },
  modalityPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  modalityText: { fontSize: 12, fontWeight: "600" },
  routeRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  routeDotsCol: { alignItems: "center", gap: 2, width: 10 },
  routeDot: { width: 8, height: 8, borderRadius: 4 },
  routeDotLine: { width: 2, height: 16, backgroundColor: "#E2E8F0" },
  routeLabels: { flex: 1, gap: 10 },
  routeCoord: { color: "#475569", fontFamily: "monospace" },
  cardFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  cardMeta: { flexDirection: "row", alignItems: "center", gap: 5 },
  metaText: { color: "#94A3B8" },
  cardRight: { alignItems: "flex-end", gap: 2 },
  price: { fontWeight: "700", color: "#0F172A" },
  dateText: { color: "#94A3B8" },
  co2Row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#F0FDF4",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  co2Text: { color: "#15803D", fontSize: 12, fontWeight: "500" },
});
