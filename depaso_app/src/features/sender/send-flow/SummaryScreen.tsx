import { useState } from "react";
import { View, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, ActivityIndicator } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { T } from "@/constants/tokens";
import type { Coords } from "./FlowNavigator";
import { shipmentsService } from "@/src/services/shipments";
import { DeliveryMode, AssignmentMode, PackageCategory } from "@/src/types";

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>["name"];

const SIZE_LABEL: Record<string, string> = {
  xs: "Sobre / Documento", s: "Caja chica", m: "Caja mediana",
  l: "Caja grande", xl: "Voluminoso / Flete",
};
const PRICE = { dedicada: 6900, colaborativa: 3900 };

function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <View style={dotStyles.row}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[dotStyles.dot, { width: i === current - 1 ? 18 : 6, backgroundColor: i < current ? T.forest : T.border }]}
        />
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

type SummaryScreenProps = {
  origin: string;
  destination: string;
  originCoords: Coords | null;
  destinationCoords: Coords | null;
  categoryId: string;
  weightKg: number;
  description?: string;
  photoUri?: string | null;
  mode: "dedicada" | "colaborativa";
  recipientName?: string;
  recipientPhone?: string;
  onBack: () => void;
  onConfirm: () => void;
};

function Row({ icon, label, value }: { icon: IconName; label: string; value: string }) {
  return (
    <View style={rowStyles.row}>
      <MaterialCommunityIcons name={icon} size={17} color={T.inkMute} />
      <Text style={rowStyles.label}>{label}</Text>
      <Text style={rowStyles.value} numberOfLines={2}>{value}</Text>
    </View>
  );
}
const rowStyles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "flex-start", gap: 10, paddingVertical: 10 },
  label: { fontSize: 13, color: T.inkMute, width: 80 },
  value: { flex: 1, fontSize: 14, color: T.ink, fontWeight: "500", textAlign: "right" },
});

export function SummaryScreen({
  origin, destination, originCoords, destinationCoords,
  categoryId, weightKg, description, photoUri, mode, recipientName, recipientPhone,
  onBack, onConfirm,
}: SummaryScreenProps) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const isCollaborative = mode === "colaborativa";
  const price = PRICE[mode];

  const handleConfirm = async () => {
    if (!originCoords || !destinationCoords) return;
    setLoading(true);
    try {
      await shipmentsService.createShipment({
        package_size: categoryId as PackageCategory,
        modality: mode === "dedicada" ? DeliveryMode.DEDICATED : DeliveryMode.COLLABORATIVE,
        assignment_mode: AssignmentMode.ON_DEMAND,
        origin_lat: originCoords.latitude,
        origin_lon: originCoords.longitude,
        destination_lat: destinationCoords.latitude,
        destination_lon: destinationCoords.longitude,
        weight_kg: weightKg,
        description: description || undefined,
      });
      onConfirm();
    } catch (err: any) {
      Alert.alert("Error", err?.response?.data?.detail ?? "No se pudo crear el envío. Intentá de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const mapRegion = originCoords && destinationCoords ? {
    latitude: (originCoords.latitude + destinationCoords.latitude) / 2,
    longitude: (originCoords.longitude + destinationCoords.longitude) / 2,
    latitudeDelta: Math.abs(originCoords.latitude - destinationCoords.latitude) * 2.2 + 0.02,
    longitudeDelta: Math.abs(originCoords.longitude - destinationCoords.longitude) * 2.2 + 0.02,
  } : undefined;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Step header */}
      <View style={styles.stepHeader}>
        <TouchableOpacity style={styles.headerBtn} onPress={onBack} hitSlop={10}>
          <MaterialCommunityIcons name="arrow-left" size={18} color={T.ink} />
        </TouchableOpacity>
        <StepDots current={4} total={4} />

        <View style={styles.headerBtn}>
          <MaterialCommunityIcons name="creation" size={16} color={T.ink} />
        </View>
      </View>

      <View style={styles.stepTitleBlock}>
        <Text style={styles.stepSub}>PASO 04 · RESUMEN</Text>
        <Text style={styles.stepTitle}>Confirmá{"\n"}tu envío</Text>
      </View>

      {/* Map */}
      {originCoords && destinationCoords && (
        <MapView
          style={styles.map}
          region={mapRegion}
          scrollEnabled={false}
          zoomEnabled={false}
          pitchEnabled={false}
          rotateEnabled={false}
        >
          <Marker coordinate={originCoords} pinColor={T.forest} />
          <Marker coordinate={destinationCoords} pinColor={T.emerald} />
          <Polyline
            coordinates={[originCoords, destinationCoords]}
            strokeColor={T.forest}
            strokeWidth={3}
            lineDashPattern={[8, 5]}
          />
        </MapView>
      )}

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Route card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>RUTA</Text>
          <View style={styles.routeBlock}>
            <View style={styles.routeDotsCol}>
              <View style={[styles.dot, { backgroundColor: T.emerald }]} />
              <View style={styles.dotLine} />
              <View style={[styles.dot, { backgroundColor: T.red, borderRadius: 3 }]} />
            </View>
            <View style={styles.routeTexts}>
              <Text style={styles.routeAddr} numberOfLines={2}>{origin}</Text>
              <View style={{ height: 12 }} />
              <Text style={styles.routeAddr} numberOfLines={2}>{destination}</Text>
            </View>
          </View>
          {(recipientName || recipientPhone) && (
            <Text style={styles.shipmentId}>
              Recibe: {[recipientName, recipientPhone].filter(Boolean).join(" · ")}
            </Text>
          )}
        </View>

        {/* Package details card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>DETALLES</Text>

          {photoUri && (
            <>
              <Image source={{ uri: photoUri }} style={styles.packagePhoto} resizeMode="cover" />
              <View style={styles.divider} />
            </>
          )}

          <Row icon="package-variant-closed" label="Paquete" value={`${SIZE_LABEL[categoryId] ?? categoryId} · ${weightKg} kg`} />

          {!!description && (
            <>
              <View style={styles.divider} />
              <Row icon="text-box-outline" label="Descripción" value={description} />
            </>
          )}

          <View style={styles.divider} />
          <Row
            icon={isCollaborative ? "account-group-outline" : "lightning-bolt"}
            label="Modalidad"
            value={isCollaborative ? "Colaborativa" : "Dedicada"}
          />
          <View style={styles.divider} />
          <Row icon="cash" label="Precio est." value={`$${price.toLocaleString("es-AR")} ARS`} />
        </View>

        {/* CO₂ hero card */}
        {isCollaborative && (
          <View style={styles.co2Card}>
            <View style={styles.co2IconBox}>
              <MaterialCommunityIcons name="leaf" size={20} color={T.forest} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.co2Title}>¡Ahorrás CO₂!</Text>
              <Text style={styles.co2Sub}>
                {"Este envío colaborativo evita hasta "}
                <Text style={styles.co2Highlight}>1.8 kg CO₂</Text>
                {" de emisiones"}
              </Text>
            </View>
          </View>
        )}

        {/* CTAs */}
        <TouchableOpacity style={[styles.confirmBtn, loading && { opacity: 0.7 }]} onPress={handleConfirm} activeOpacity={0.88} disabled={loading}>
          {loading
            ? <ActivityIndicator color="#fff" />
            : <>
                <MaterialCommunityIcons name="check-circle-outline" size={22} color="#fff" />
                <Text style={styles.confirmText}>Confirmar envío</Text>
              </>
          }
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelBtn} onPress={onBack} activeOpacity={0.7}>
          <Text style={styles.cancelText}>Volver y modificar</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },

  stepHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4,
  },
  headerBtn: {
    width: 38, height: 38, borderRadius: 12,
    borderWidth: 1, borderColor: T.border,
    backgroundColor: T.card, alignItems: "center", justifyContent: "center",
  },
  stepTitleBlock: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 10 },
  stepSub: { fontSize: 10, letterSpacing: 2.5, color: T.emeraldDeep, textTransform: "uppercase", marginBottom: 4 },
  stepTitle: { fontSize: 24, fontWeight: "700", color: T.ink, letterSpacing: -0.8, lineHeight: 28 },

  map: { height: 180 },
  packagePhoto: { width: "100%", height: 160, borderRadius: 10, marginBottom: 4 },

  content: { padding: 16, gap: 12 },

  card: {
    backgroundColor: T.card, borderRadius: 18,
    borderWidth: 1, borderColor: T.border, padding: 16,
  },
  cardTitle: {
    fontSize: 10, letterSpacing: 1.5, color: T.inkMute,
    textTransform: "uppercase", marginBottom: 12, fontWeight: "600",
  },

  routeBlock: { flexDirection: "row", gap: 12 },
  routeDotsCol: { alignItems: "center", gap: 2, paddingTop: 4 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  dotLine: { width: 2, flex: 1, backgroundColor: T.border, minHeight: 20 },
  routeTexts: { flex: 1 },
  routeAddr: { fontSize: 14, color: T.ink, fontWeight: "500" },
  shipmentId: { fontSize: 12, color: T.inkMute, marginTop: 10 },

  divider: { height: 1, backgroundColor: T.borderSoft },

  co2Card: {
    flexDirection: "row", gap: 12,
    backgroundColor: T.forest, borderRadius: 16, padding: 16,
    alignItems: "flex-start",
  },
  co2IconBox: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: T.lime, alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  co2Title: { fontSize: 14, fontWeight: "700", color: "#F4EFE3", marginBottom: 2 },
  co2Sub: { fontSize: 12, color: "rgba(244,239,227,0.75)", lineHeight: 17 },
  co2Highlight: { color: T.lime, fontWeight: "700" },

  confirmBtn: {
    flexDirection: "row", backgroundColor: T.forest,
    borderRadius: 14, paddingVertical: 16,
    alignItems: "center", justifyContent: "center", gap: 10,
    shadowColor: T.forest,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 5,
  },
  confirmText: { color: "#fff", fontWeight: "700", fontSize: 17 },
  cancelBtn: { alignItems: "center", paddingVertical: 10 },
  cancelText: { color: T.inkMute, fontSize: 14 },
});
