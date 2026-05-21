import { useEffect, useState } from "react";
import { View, ActivityIndicator, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { shipmentsService } from "@/src/services/shipments";
import { matchingService } from "@/src/services";
import { AssignmentMode, CarrierScoreResponse, DeliveryMode, PackageCategory, Shipment } from "@/src/types";
import type { Coords } from "../FlowNavigator";

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>["name"];

const VEHICLE_LABEL: Record<string, string> = {
  pedestrian: "A pie",
  bike: "Bicicleta",
  motorcycle: "Moto",
  car: "Auto",
  van: "Camioneta",
  truck: "Camión",
};

const VEHICLE_ICON: Record<string, IconName> = {
  pedestrian: "walk",
  bike: "bicycle",
  motorcycle: "motorbike",
  car: "car-outline",
  van: "van-utility",
  truck: "truck-outline",
};

const PRICE: Record<string, number> = {
  dedicada: 6900,
  colaborativa: 3900,
};
const ETA: Record<string, number> = {
  dedicada: 28,
  colaborativa: 54,
};

type MatchingScreenProps = {
  mode: "dedicada" | "colaborativa";
  categoryId: string;
  weightKg: number;
  originCoords: Coords | null;
  destinationCoords: Coords | null;
  onBack: () => void;
  onConfirm: (carrier: CarrierScoreResponse, shipmentId: number) => void;
  onReset: () => void;
};

export function MatchingScreen({
  mode,
  categoryId,
  weightKg,
  originCoords,
  destinationCoords,
  onBack,
  onConfirm,
  onReset,
}: MatchingScreenProps) {
  const insets = useSafeAreaInsets();
  const [isLoading, setIsLoading] = useState(true);
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [matchedCarrier, setMatchedCarrier] = useState<CarrierScoreResponse | null>(null);
  const [noCarriers, setNoCarriers] = useState(false);
  const [connectionError, setConnectionError] = useState(false);

  useEffect(() => {
    run();
  }, []);

  async function run() {
    setIsLoading(true);
    setNoCarriers(false);
    setConnectionError(false);
    setMatchedCarrier(null);
    setShipment(null);

    let created: Shipment;
    try {
      created = await shipmentsService.createShipment({
        package_size: (categoryId as PackageCategory) ?? PackageCategory.M,
        modality: mode === "colaborativa" ? DeliveryMode.COLLABORATIVE : DeliveryMode.DEDICATED,
        assignment_mode: AssignmentMode.ON_DEMAND,
        origin_lat: originCoords?.latitude ?? -34.5888,
        origin_lon: originCoords?.longitude ?? -58.4305,
        destination_lat: destinationCoords?.latitude ?? -34.7241,
        destination_lon: destinationCoords?.longitude ?? -58.2526,
        weight_kg: weightKg,
      });
    } catch {
      setConnectionError(true);
      setIsLoading(false);
      return;
    }

    setShipment(created);

    try {
      const result = await matchingService.matchBest(created.id);
      const best = result.ranked_carriers[0] ?? null;
      if (!best) setNoCarriers(true);
      else setMatchedCarrier(best);
    } catch (err: any) {
      const status = err?.response?.status;
      // 422 = no carriers match (ValueError from service); 404 = shipment not found
      if (status === 422 || status === 404) {
        setNoCarriers(true);
      } else {
        setConnectionError(true);
      }
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#16A34A" />
        <Text variant="titleMedium" style={styles.loadingText}>
          Buscando el mejor conductor...
        </Text>
        <Text variant="bodySmall" style={styles.loadingSubText}>
          Analizando transportistas disponibles
        </Text>
      </View>
    );
  }

  const vehicleIcon: IconName =
    VEHICLE_ICON[matchedCarrier?.vehicle_type ?? ""] ?? "truck-outline";

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={onBack} style={styles.backButton} hitSlop={12}>
          <MaterialCommunityIcons name="chevron-left" size={28} color="#0F172A" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text variant="titleMedium" style={styles.headerTitle}>
            {connectionError ? "Error de conexión" : noCarriers ? "Sin conductores" : "Conductor asignado"}
          </Text>
          <Text variant="labelSmall" style={styles.headerStep}>
            PASO 4 DE 4
          </Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {connectionError ? (
          /* Connection error state */
          <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: "#FEF2F2" }]}>
              <MaterialCommunityIcons name="wifi-off" size={48} color="#EF4444" />
            </View>
            <Text variant="titleMedium" style={[styles.emptyTitle, { color: "#EF4444" }]}>
              Error de conexión
            </Text>
            <Text variant="bodyMedium" style={styles.emptySubtitle}>
              No se pudo conectar con el servidor. Verificá que el backend esté corriendo y volvé a intentar.
            </Text>
            <TouchableOpacity style={styles.retryButton} onPress={run} activeOpacity={0.85}>
              <MaterialCommunityIcons name="refresh" size={18} color="#fff" />
              <Text style={styles.retryButtonText}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        ) : noCarriers ? (
          /* No carriers state */
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <MaterialCommunityIcons name="truck-off-outline" size={48} color="#94A3B8" />
            </View>
            <Text variant="titleMedium" style={styles.emptyTitle}>
              Sin conductores disponibles
            </Text>
            <Text variant="bodyMedium" style={styles.emptySubtitle}>
              No hay transportistas activos con capacidad para tu paquete en este momento.
            </Text>
          </View>
        ) : (
          <>
            {/* Status badge */}
            <View style={styles.successBadge}>
              <MaterialCommunityIcons name="check-circle" size={20} color="#22C55E" />
              <Text variant="labelLarge" style={styles.successText}>
                Match encontrado
              </Text>
            </View>

            {/* Carrier card */}
            {matchedCarrier && (
              <View style={styles.carrierCard}>
                <View style={styles.carrierAvatar}>
                  <MaterialCommunityIcons name={vehicleIcon} size={32} color="#16A34A" />
                </View>
                <View style={styles.carrierInfo}>
                  <Text variant="titleMedium" style={styles.carrierName}>
                    {matchedCarrier.company_name}
                  </Text>
                  <Text variant="bodySmall" style={styles.carrierSub}>
                    {VEHICLE_LABEL[matchedCarrier.vehicle_type] ?? matchedCarrier.vehicle_type}
                    {" · "}
                    {matchedCarrier.license_plate}
                  </Text>
                </View>
                <View style={styles.carrierScore}>
                  <Text variant="titleMedium" style={styles.scoreNumber}>
                    {Math.round(matchedCarrier.total_score * 100)}
                  </Text>
                  <Text variant="labelSmall" style={styles.scoreLabel}>
                    score
                  </Text>
                </View>
              </View>
            )}

            {/* Score breakdown */}
            {matchedCarrier && (
              <View style={styles.scoreCard}>
                <Text variant="labelMedium" style={styles.scoreCardTitle}>
                  SCORING DEL ALGORITMO
                </Text>
                <ScoreRow
                  icon="map-marker-radius-outline"
                  label="Proximidad"
                  value={matchedCarrier.distance_score}
                />
                <ScoreRow
                  icon="cube-outline"
                  label="Compatibilidad de carga"
                  value={matchedCarrier.capacity_score}
                />
                <ScoreRow
                  icon="star-outline"
                  label="Reputación"
                  value={matchedCarrier.reputation_score}
                />
              </View>
            )}
          </>
        )}

        {/* Shipment summary */}
        {shipment && (
          <View style={styles.summaryCard}>
            <Text variant="labelMedium" style={styles.summaryTitle}>
              RESUMEN DEL ENVÍO
            </Text>

            <SummaryRow
              icon="package-variant-closed"
              label="Pedido"
              value={`#${shipment.id}`}
            />
            <SummaryRow
              icon={mode === "colaborativa" ? "account-group-outline" : "lightning-bolt"}
              label="Modalidad"
              value={mode === "colaborativa" ? "Colaborativa" : "Dedicada"}
            />
            <SummaryRow
              icon="scale-bathroom"
              label="Peso"
              value={`${shipment.weight_kg} kg`}
            />
            <SummaryRow
              icon="clock-outline"
              label="ETA estimado"
              value={`${ETA[mode]} min`}
            />
            <View style={styles.priceSeparator} />
            <View style={styles.priceRow}>
              <Text variant="titleMedium" style={styles.priceFinal}>
                Total estimado
              </Text>
              <Text variant="headlineSmall" style={styles.priceAmount}>
                ${PRICE[mode].toLocaleString("es-AR")} ARS
              </Text>
            </View>
          </View>
        )}

        {/* Actions */}
        {matchedCarrier && shipment && (
          <TouchableOpacity
            style={styles.confirmButton}
            onPress={() => onConfirm(matchedCarrier, shipment.id)}
            activeOpacity={0.88}
          >
            <MaterialCommunityIcons name="check-circle-outline" size={20} color="#fff" />
            <Text style={styles.confirmButtonText}>Ver resumen y confirmar</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.newButton} onPress={onReset} activeOpacity={0.85}>
          <MaterialCommunityIcons name="plus" size={18} color="#0F172A" />
          <Text style={styles.newButtonText}>Nuevo envío</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function ScoreRow({
  icon,
  label,
  value,
}: {
  icon: IconName;
  label: string;
  value: number;
}) {
  const pct = Math.round(value * 100);
  return (
    <View style={styles.scoreRow}>
      <MaterialCommunityIcons name={icon} size={16} color="#64748B" />
      <Text variant="bodySmall" style={styles.scoreRowLabel}>
        {label}
      </Text>
      <View style={styles.scoreBarBg}>
        <View style={[styles.scoreBarFill, { width: `${pct}%` }]} />
      </View>
      <Text variant="labelSmall" style={styles.scoreRowPct}>
        {pct}%
      </Text>
    </View>
  );
}

function SummaryRow({
  icon,
  label,
  value,
}: {
  icon: IconName;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.summaryRow}>
      <MaterialCommunityIcons name={icon} size={16} color="#64748B" />
      <Text variant="bodySmall" style={styles.summaryRowLabel}>
        {label}
      </Text>
      <Text variant="bodyMedium" style={styles.summaryRowValue}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  loading: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 40,
  },
  loadingText: { color: "#0F172A", fontWeight: "600" },
  loadingSubText: { color: "#94A3B8" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  backButton: { width: 40, alignItems: "flex-start" },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: { fontWeight: "700", color: "#0F172A" },
  headerStep: { color: "#94A3B8", letterSpacing: 1, marginTop: 2 },
  content: { padding: 20, gap: 14, paddingBottom: 40 },
  // Empty state
  emptyState: { alignItems: "center", paddingVertical: 40, gap: 12 },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: { fontWeight: "600", color: "#0F172A" },
  emptySubtitle: { color: "#64748B", textAlign: "center" },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#16A34A",
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginTop: 8,
  },
  retryButtonText: { color: "#fff", fontWeight: "600", fontSize: 15 },
  // Success
  successBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#F0FDF4",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  successText: { color: "#16A34A" },
  // Carrier card
  carrierCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 16,
    gap: 14,
  },
  carrierAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#F0FDF4",
    alignItems: "center",
    justifyContent: "center",
  },
  carrierInfo: { flex: 1 },
  carrierName: { fontWeight: "700", color: "#0F172A" },
  carrierSub: { color: "#64748B", marginTop: 2 },
  carrierScore: { alignItems: "center" },
  scoreNumber: { fontWeight: "800", color: "#16A34A" },
  scoreLabel: { color: "#94A3B8" },
  // Score breakdown
  scoreCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 16,
    gap: 10,
  },
  scoreCardTitle: { color: "#94A3B8", letterSpacing: 1, marginBottom: 4 },
  scoreRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  scoreRowLabel: { color: "#64748B", flex: 1 },
  scoreBarBg: {
    width: 80,
    height: 6,
    backgroundColor: "#F1F5F9",
    borderRadius: 3,
    overflow: "hidden",
  },
  scoreBarFill: { height: 6, backgroundColor: "#16A34A", borderRadius: 3 },
  scoreRowPct: { color: "#0F172A", fontWeight: "600", minWidth: 30, textAlign: "right" },
  // Summary
  summaryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 16,
    gap: 10,
  },
  summaryTitle: { color: "#94A3B8", letterSpacing: 1, marginBottom: 4 },
  summaryRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  summaryRowLabel: { color: "#64748B", flex: 1 },
  summaryRowValue: { color: "#0F172A", fontWeight: "600" },
  priceSeparator: { height: 1, backgroundColor: "#F1F5F9", marginVertical: 4 },
  priceRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  priceFinal: { color: "#0F172A", fontWeight: "600" },
  priceAmount: { fontWeight: "800", color: "#0F172A" },
  // New button
  confirmButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#16A34A",
    borderRadius: 14,
    paddingVertical: 16,
    marginTop: 4,
  },
  confirmButtonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  newButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    marginTop: 8,
  },
  newButtonText: { color: "#0F172A", fontWeight: "600", fontSize: 15 },
});
