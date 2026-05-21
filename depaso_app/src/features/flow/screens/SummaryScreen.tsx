import { View, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { Coords } from "../FlowNavigator";
import type { CarrierScoreResponse } from "@/src/types";

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>["name"];

const VEHICLE_ICON: Record<string, IconName> = {
  pedestrian: "walk", bike: "bicycle", motorcycle: "motorbike",
  car: "car-outline", van: "van-utility", truck: "truck-outline",
};
const VEHICLE_LABEL: Record<string, string> = {
  pedestrian: "A pie", bike: "Bicicleta", motorcycle: "Moto",
  car: "Auto", van: "Camioneta", truck: "Camión",
};
const SIZE_LABEL: Record<string, string> = {
  xs: "Sobre / Documento", s: "Caja chica", m: "Caja mediana",
  l: "Caja grande", xl: "Voluminoso / Flete",
};
const PRICE = { dedicada: 6900, colaborativa: 3900 };

type SummaryScreenProps = {
  origin: string;
  destination: string;
  originCoords: Coords | null;
  destinationCoords: Coords | null;
  categoryId: string;
  weightKg: number;
  mode: "dedicada" | "colaborativa";
  carrier: CarrierScoreResponse | null;
  shipmentId: number | null;
  onBack: () => void;
  onConfirm: () => void;
};

function Row({ icon, label, value }: { icon: IconName; label: string; value: string }) {
  return (
    <View style={rowStyles.row}>
      <MaterialCommunityIcons name={icon} size={18} color="#64748B" />
      <Text variant="bodySmall" style={rowStyles.label}>{label}</Text>
      <Text variant="bodyMedium" style={rowStyles.value} numberOfLines={2}>{value}</Text>
    </View>
  );
}
const rowStyles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "flex-start", gap: 10, paddingVertical: 10 },
  label: { color: "#94A3B8", width: 80 },
  value: { flex: 1, color: "#0F172A", fontWeight: "500", textAlign: "right" },
});

export function SummaryScreen({
  origin, destination, originCoords, destinationCoords,
  categoryId, weightKg, mode, carrier, shipmentId,
  onBack, onConfirm,
}: SummaryScreenProps) {
  const insets = useSafeAreaInsets();
  const isCollaborative = mode === "colaborativa";
  const price = PRICE[mode];
  const vehicleIcon: IconName = VEHICLE_ICON[carrier?.vehicle_type ?? ""] ?? "truck-outline";

  const mapRegion = originCoords && destinationCoords ? {
    latitude: (originCoords.latitude + destinationCoords.latitude) / 2,
    longitude: (originCoords.longitude + destinationCoords.longitude) / 2,
    latitudeDelta: Math.abs(originCoords.latitude - destinationCoords.latitude) * 2.2 + 0.02,
    longitudeDelta: Math.abs(originCoords.longitude - destinationCoords.longitude) * 2.2 + 0.02,
  } : undefined;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn} hitSlop={12}>
          <MaterialCommunityIcons name="chevron-left" size={28} color="#0F172A" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text variant="titleMedium" style={styles.headerTitle}>Resumen del envío</Text>
          <Text variant="labelSmall" style={styles.headerStep}>PASO 5 DE 5</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Mapa */}
      {originCoords && destinationCoords && (
        <MapView
          style={styles.map}
          region={mapRegion}
          scrollEnabled={false}
          zoomEnabled={false}
          pitchEnabled={false}
          rotateEnabled={false}
        >
          <Marker coordinate={originCoords} pinColor="#16A34A" />
          <Marker coordinate={destinationCoords} pinColor="#EF4444" />
          <Polyline
            coordinates={[originCoords, destinationCoords]}
            strokeColor="#16A34A"
            strokeWidth={3}
            lineDashPattern={[8, 5]}
          />
        </MapView>
      )}

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]} showsVerticalScrollIndicator={false}>

        {/* Ruta */}
        <View style={styles.card}>
          <Text variant="labelMedium" style={styles.cardTitle}>RUTA</Text>
          <View style={styles.routeBlock}>
            <View style={styles.routeDotsCol}>
              <View style={[styles.dot, { backgroundColor: "#16A34A" }]} />
              <View style={styles.dotLine} />
              <View style={[styles.dot, { backgroundColor: "#EF4444", borderRadius: 3 }]} />
            </View>
            <View style={styles.routeTexts}>
              <Text variant="bodyMedium" style={styles.routeAddr} numberOfLines={2}>{origin}</Text>
              <View style={{ height: 12 }} />
              <Text variant="bodyMedium" style={styles.routeAddr} numberOfLines={2}>{destination}</Text>
            </View>
          </View>
          {shipmentId && (
            <Text variant="labelSmall" style={styles.shipmentId}>Pedido #{shipmentId}</Text>
          )}
        </View>

        {/* Paquete + Modalidad */}
        <View style={styles.card}>
          <Text variant="labelMedium" style={styles.cardTitle}>DETALLES</Text>
          <Row icon="package-variant-closed" label="Paquete" value={`${SIZE_LABEL[categoryId] ?? categoryId} · ${weightKg} kg`} />
          <View style={styles.divider} />
          <Row
            icon={isCollaborative ? "account-group-outline" : "lightning-bolt"}
            label="Modalidad"
            value={isCollaborative ? "Colaborativa" : "Dedicada"}
          />
          <View style={styles.divider} />
          <Row icon="cash" label="Precio est." value={`$${price.toLocaleString("es-AR")} ARS`} />
        </View>

        {/* Conductor */}
        {carrier && (
          <View style={styles.card}>
            <Text variant="labelMedium" style={styles.cardTitle}>CONDUCTOR ASIGNADO</Text>
            <View style={styles.carrierRow}>
              <View style={styles.carrierAvatar}>
                <MaterialCommunityIcons name={vehicleIcon} size={28} color="#16A34A" />
              </View>
              <View style={styles.carrierInfo}>
                <Text variant="titleSmall" style={styles.carrierName}>{carrier.company_name}</Text>
                <Text variant="bodySmall" style={styles.carrierSub}>
                  {VEHICLE_LABEL[carrier.vehicle_type] ?? carrier.vehicle_type} · {carrier.license_plate}
                </Text>
              </View>
              <View style={styles.scoreChip}>
                <Text style={styles.scoreNum}>{Math.round(carrier.total_score * 100)}</Text>
                <Text style={styles.scoreLabel}>pts</Text>
              </View>
            </View>
          </View>
        )}

        {/* CO2 badge */}
        {isCollaborative && (
          <View style={styles.co2Banner}>
            <MaterialCommunityIcons name="leaf" size={20} color="#16A34A" />
            <View style={{ flex: 1 }}>
              <Text variant="labelLarge" style={styles.co2Title}>¡Ahorrás CO₂!</Text>
              <Text variant="bodySmall" style={styles.co2Sub}>
                Este envío colaborativo evita hasta 1.8 kg de emisiones de CO₂
              </Text>
            </View>
          </View>
        )}

        {/* CTA */}
        <TouchableOpacity style={styles.confirmBtn} onPress={onConfirm} activeOpacity={0.88}>
          <MaterialCommunityIcons name="check-circle-outline" size={22} color="#fff" />
          <Text style={styles.confirmText}>Confirmar envío</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelBtn} onPress={onBack} activeOpacity={0.7}>
          <Text style={styles.cancelText}>Volver y modificar</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  header: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#E2E8F0", paddingHorizontal: 12, paddingBottom: 12 },
  backBtn: { width: 40 },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: { fontWeight: "700", color: "#0F172A" },
  headerStep: { color: "#94A3B8", letterSpacing: 1 },

  map: { height: 200 },

  content: { padding: 16, gap: 12 },

  card: { backgroundColor: "#fff", borderRadius: 16, borderWidth: 1, borderColor: "#E2E8F0", padding: 16 },
  cardTitle: { color: "#94A3B8", letterSpacing: 1, marginBottom: 12 },

  routeBlock: { flexDirection: "row", gap: 12 },
  routeDotsCol: { alignItems: "center", gap: 2, paddingTop: 4 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  dotLine: { width: 2, flex: 1, backgroundColor: "#E2E8F0", minHeight: 20 },
  routeTexts: { flex: 1 },
  routeAddr: { color: "#0F172A", fontWeight: "500" },
  shipmentId: { color: "#94A3B8", marginTop: 10 },

  divider: { height: 1, backgroundColor: "#F1F5F9" },

  carrierRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  carrierAvatar: { width: 52, height: 52, borderRadius: 14, backgroundColor: "#F0FDF4", alignItems: "center", justifyContent: "center" },
  carrierInfo: { flex: 1 },
  carrierName: { fontWeight: "700", color: "#0F172A" },
  carrierSub: { color: "#64748B", marginTop: 2 },
  scoreChip: { alignItems: "center", backgroundColor: "#F0FDF4", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6 },
  scoreNum: { fontWeight: "800", fontSize: 18, color: "#16A34A" },
  scoreLabel: { fontSize: 11, color: "#16A34A" },

  co2Banner: { flexDirection: "row", gap: 12, backgroundColor: "#F0FDF4", borderRadius: 14, padding: 14, borderWidth: 1, borderColor: "#BBF7D0", alignItems: "flex-start" },
  co2Title: { fontWeight: "700", color: "#15803D" },
  co2Sub: { color: "#16A34A", marginTop: 2 },

  confirmBtn: { flexDirection: "row", backgroundColor: "#16A34A", borderRadius: 14, paddingVertical: 16, alignItems: "center", justifyContent: "center", gap: 10 },
  confirmText: { color: "#fff", fontWeight: "700", fontSize: 17 },
  cancelBtn: { alignItems: "center", paddingVertical: 10 },
  cancelText: { color: "#94A3B8", fontSize: 14 },
});
