import { useCallback, useEffect, useState } from "react";
import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Modal, Linking, Alert, Image } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { shipmentsService } from "@/src/services/shipments";
import { trackingService } from "@/src/services/carriers";
import { Shipment, ShipmentStatus, PackageCategory, DeliveryMode, TrackedPosition } from "@/src/types";
import { T } from "@/constants/tokens";
import { reverseGeocode } from "@/src/utils/geocoding";

function useAddress(lat: number, lon: number): string {
  const [addr, setAddr] = useState(`${lat.toFixed(3)}, ${lon.toFixed(3)}`);
  useEffect(() => {
    let alive = true;
    reverseGeocode(lat, lon).then(r => { if (alive) setAddr(r); });
    return () => { alive = false; };
  }, [lat, lon]);
  return addr;
}

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>["name"];
type Tab = "active" | "delivered" | "cancelled";

const ACTIVE_STATUSES = [
  ShipmentStatus.PENDING,
  ShipmentStatus.ASSIGNED,
  ShipmentStatus.PICKUP_ARRIVED,
  ShipmentStatus.IN_TRANSIT,
];

// Timeline driven by the real shipment status
const STATUS_ORDER = [
  ShipmentStatus.ASSIGNED,
  ShipmentStatus.PICKUP_ARRIVED,
  ShipmentStatus.IN_TRANSIT,
  ShipmentStatus.DELIVERED,
];
const STEP_LABELS = ["Asignado", "Retiro", "En viaje", "Entrega"];

function timelineSteps(status: ShipmentStatus) {
  const idx = STATUS_ORDER.indexOf(status);
  return STEP_LABELS.map((label, i) => ({
    label,
    done: idx > i || status === ShipmentStatus.DELIVERED,
    active: idx === i && status !== ShipmentStatus.DELIVERED,
  }));
}

const SIZE_LABEL: Record<PackageCategory, string> = {
  [PackageCategory.XS]: "Sobre",
  [PackageCategory.S]:  "Chico",
  [PackageCategory.M]:  "Mediano",
  [PackageCategory.L]:  "Grande",
  [PackageCategory.XL]: "Voluminoso",
};

const CADETE_COLORS = [T.amber, T.violet, T.emerald, T.sky];

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("es-AR", { day: "numeric", month: "short" }).toUpperCase();
}

function thumbIcon(cat: PackageCategory): IconName {
  if (cat === PackageCategory.XS) return "email-outline";
  if (cat === PackageCategory.L || cat === PackageCategory.XL) return "cube-outline";
  return "package-variant";
}

function PackageThumb({ category, size = 56 }: { category?: PackageCategory; size?: number }) {
  return (
    <View style={{ width: size, height: size, borderRadius: 12, backgroundColor: T.cardSoft, borderWidth: 1, borderColor: T.borderSoft, alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <MaterialCommunityIcons
        name={category ? thumbIcon(category) : "package-variant"}
        size={Math.round(size * 0.45)}
        color="rgba(11,59,46,0.28)"
      />
    </View>
  );
}

function AvatarBubble({ initials, color, size = 32 }: { initials: string; color: string; size?: number }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size, backgroundColor: color, alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <Text style={{ fontSize: Math.round(size * 0.38), fontWeight: "700", color: "#F4EFE3" }}>{initials}</Text>
    </View>
  );
}

function MiniRouteLine({ origin, destination }: { origin: string; destination: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flex: 1, overflow: "hidden" }}>
        <View style={{ width: 8, height: 8, borderRadius: 4, borderWidth: 1.8, borderColor: T.forest, backgroundColor: T.card, flexShrink: 0 }} />
        <Text style={{ fontSize: 12.5, color: T.ink, fontWeight: "500" }} numberOfLines={1}>{origin}</Text>
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 2, paddingHorizontal: 8 }}>
        {[0.4, 0.7, 1.0].map((op, i) => (
          <View key={i} style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: T.inkFaint, opacity: op }} />
        ))}
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flex: 1, justifyContent: "flex-end", overflow: "hidden" }}>
        <Text style={{ fontSize: 12.5, color: T.ink, fontWeight: "500" }} numberOfLines={1}>{destination}</Text>
        <View style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: T.emerald, transform: [{ rotate: "45deg" }], flexShrink: 0 }} />
      </View>
    </View>
  );
}

const MOCK_PHONE = "+541156789012";

function liveMapRegion(s: Shipment) {
  const lat1 = s.origin_lat, lat2 = s.destination_lat;
  const lon1 = s.origin_lon, lon2 = s.destination_lon;
  return {
    latitude: (lat1 + lat2) / 2,
    longitude: (lon1 + lon2) / 2,
    latitudeDelta: Math.abs(lat1 - lat2) * 2.5 + 0.02,
    longitudeDelta: Math.abs(lon1 - lon2) * 2.5 + 0.02,
  };
}

function LiveShipmentCard({ shipment, onPress }: { shipment: Shipment; onPress: () => void }) {
  const isCollab = shipment.modality === DeliveryMode.COLLABORATIVE;
  const sizeLabel = SIZE_LABEL[shipment.package_size] ?? "Paquete";
  const steps = timelineSteps(shipment.status);
  const origAddr = useAddress(shipment.origin_lat, shipment.origin_lon);
  const destAddr = useAddress(shipment.destination_lat, shipment.destination_lon);
  const originCoord = { latitude: shipment.origin_lat, longitude: shipment.origin_lon };
  const destCoord   = { latitude: shipment.destination_lat, longitude: shipment.destination_lon };

  return (
    <TouchableOpacity style={s.liveCard} onPress={onPress} activeOpacity={0.95}>
      {/* Real map strip */}
      <View style={{ overflow: "hidden" }}>
        <MapView
          style={{ height: 130 }}
          region={liveMapRegion(shipment)}
          scrollEnabled={false} zoomEnabled={false} pitchEnabled={false} rotateEnabled={false}
          pointerEvents="none"
        >
          <Marker coordinate={originCoord} pinColor={T.forest} />
          <Marker coordinate={destCoord} pinColor={T.emerald} />
          <Polyline coordinates={[originCoord, destCoord]} strokeColor={T.forest} strokeWidth={3} lineDashPattern={[8, 5]} />
        </MapView>
        {/* EN CURSO pill */}
        <View style={{ position: "absolute", top: 12, left: 12, flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: T.forest, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 8 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: T.lime }} />
          <Text style={{ fontSize: 9.5, letterSpacing: 1.2, fontWeight: "700", color: T.lime, textTransform: "uppercase" }}>EN CURSO</Text>
        </View>
        {/* ID pill */}
        <View style={{ position: "absolute", top: 12, right: 12, backgroundColor: "rgba(244,239,227,0.95)", borderWidth: 1, borderColor: T.border, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 8 }}>
          <Text style={{ fontSize: 9.5, letterSpacing: 1, color: T.ink, fontWeight: "700" }}>DP-{String(shipment.id).padStart(4, "0")}</Text>
        </View>
        {/* ETA + weight */}
        <View style={{ position: "absolute", bottom: 10, left: 12, right: 12, flexDirection: "row", justifyContent: "space-between" }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(244,239,227,0.95)", borderWidth: 1, borderColor: T.border, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 8 }}>
            <MaterialCommunityIcons name="clock-outline" size={12} color={T.forest} />
            <Text style={{ fontSize: 12, fontWeight: "600", color: T.ink }}>En camino</Text>
          </View>
          <View style={{ backgroundColor: "rgba(244,239,227,0.95)", borderWidth: 1, borderColor: T.border, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 8 }}>
            <Text style={{ fontSize: 9.5, letterSpacing: 1, color: T.inkSoft, fontWeight: "700", textTransform: "uppercase" }}>{shipment.weight_kg} KG</Text>
          </View>
        </View>
      </View>

      {/* Progress timeline */}
      <View style={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: T.borderSoft }}>
        <View style={{ flexDirection: "row", alignItems: "flex-start", position: "relative" }}>
          <View style={{ position: "absolute", top: 6, left: 22, right: 22, height: 2, backgroundColor: T.border, borderRadius: 2 }} />
          <View style={{ position: "absolute", top: 6, left: 22, width: `${Math.max(0, steps.filter(st => st.done).length * 30)}%`, height: 2, backgroundColor: T.emerald, borderRadius: 2 }} />
          {steps.map((step, i) => (
            <View key={i} style={{ flex: 1, alignItems: "center", gap: 4 }}>
              <View style={{ width: step.active ? 14 : 10, height: step.active ? 14 : 10, borderRadius: 7, backgroundColor: step.done ? T.emerald : step.active ? T.card : T.bg, borderWidth: step.active ? 2.5 : step.done ? 0 : 2, borderColor: step.active ? T.emerald : T.border, alignItems: "center", justifyContent: "center" }}>
                {step.done && <MaterialCommunityIcons name="check" size={6} color="#F4EFE3" />}
              </View>
              <Text style={{ fontSize: 10.5, color: step.active ? T.ink : step.done ? T.inkSoft : T.inkFaint, fontWeight: step.active ? "700" : step.done ? "500" : "400", textAlign: "center" }} numberOfLines={1}>{step.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Package row */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: T.borderSoft }}>
        <PackageThumb category={shipment.package_size} size={48} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 15.5, fontWeight: "700", color: T.ink, letterSpacing: -0.3 }}>{sizeLabel} · {shipment.weight_kg} kg</Text>
          <Text style={{ fontSize: 11.5, color: T.inkMute, marginTop: 2 }} numberOfLines={1}>{origAddr} → {destAddr}</Text>
        </View>
        {isCollab && (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: T.mint, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 }}>
            <MaterialCommunityIcons name="leaf" size={10} color={T.forest} />
            <Text style={{ fontSize: 9, letterSpacing: 1, color: T.forest, fontWeight: "700", textTransform: "uppercase" }}>COLAB</Text>
          </View>
        )}
      </View>

      {/* Cadete + tap hint */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 14 }}>
        <AvatarBubble initials="CA" color={T.amber} size={40} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 8.5, letterSpacing: 1.2, color: T.inkMute, textTransform: "uppercase" }}>TU CADETE</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 1 }}>
            <Text style={{ fontSize: 14, color: T.ink, fontWeight: "600" }}>Cadete asignado</Text>
            <MaterialCommunityIcons name="star" size={11} color={T.amber} />
            <Text style={{ fontSize: 10, color: T.inkSoft, fontWeight: "700" }}>5.0</Text>
          </View>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: T.cardSoft, borderWidth: 1, borderColor: T.border, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 10 }}>
          <Text style={{ fontSize: 11.5, color: T.inkSoft, fontWeight: "600" }}>Ver detalles</Text>
          <MaterialCommunityIcons name="chevron-right" size={14} color={T.inkSoft} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

function ShipmentDetailModal({ shipment, onClose, onCancel }: { shipment: Shipment; onClose: () => void; onCancel: () => void }) {
  const insets = useSafeAreaInsets();
  const origAddr = useAddress(shipment.origin_lat, shipment.origin_lon);
  const destAddr = useAddress(shipment.destination_lat, shipment.destination_lon);
  const isCollab = shipment.modality === DeliveryMode.COLLABORATIVE;
  const sizeLabel = SIZE_LABEL[shipment.package_size] ?? "Paquete";
  const originCoord = { latitude: shipment.origin_lat, longitude: shipment.origin_lon };
  const destCoord   = { latitude: shipment.destination_lat, longitude: shipment.destination_lon };
  // Cancelling is only allowed before pickup (RF-SHP-07)
  const canCancel = [ShipmentStatus.PENDING, ShipmentStatus.ASSIGNED, ShipmentStatus.PICKUP_ARRIVED].includes(shipment.status);
  const [cancelLoading, setCancelLoading] = useState(false);
  const steps = timelineSteps(shipment.status);

  // Live carrier position — polling every 15 s while the shipment is trackable (RF-TRK-02)
  const [carrierPos, setCarrierPos] = useState<TrackedPosition | null>(null);
  const trackable = shipment.carrier_id != null && ACTIVE_STATUSES.includes(shipment.status);
  useEffect(() => {
    if (!trackable) return;
    let alive = true;
    const poll = () =>
      trackingService.getShipmentLocation(shipment.id)
        .then(p => { if (alive && p) setCarrierPos(p); })
        .catch(() => {});
    poll();
    const interval = setInterval(poll, 15_000);
    return () => { alive = false; clearInterval(interval); };
  }, [shipment.id, trackable]);

  function callCarrier() { Linking.openURL(`tel:${MOCK_PHONE}`); }
  function messageCarrier() {
    const phone = MOCK_PHONE.replace(/\D/g, "");
    Alert.alert("Enviar mensaje", "¿Por qué servicio?", [
      { text: "Mensaje de texto", onPress: () => Linking.openURL(`sms:${MOCK_PHONE}`) },
      { text: "WhatsApp",         onPress: () => Linking.openURL(`https://wa.me/${phone}`) },
      { text: "Telegram",         onPress: () => Linking.openURL(`https://t.me/+${phone}`) },
      { text: "Cancelar", style: "cancel" },
    ]);
  }

  function confirmCancel() {
    Alert.alert(
      "Cancelar envío",
      "¿Estás segura que querés cancelar este envío? Esta acción no se puede deshacer.",
      [
        { text: "No, volver", style: "cancel" },
        {
          text: "Sí, cancelar",
          style: "destructive",
          onPress: async () => {
            setCancelLoading(true);
            try {
              await shipmentsService.cancelShipment(shipment.id);
              onCancel();
            } catch {
              Alert.alert("Error", "No se pudo cancelar el envío. Intentá de nuevo.");
            } finally {
              setCancelLoading(false);
            }
          },
        },
      ]
    );
  }

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: T.bg }}>
        {/* Full map */}
        <MapView style={{ height: 300 }} region={liveMapRegion(shipment)}>
          <Marker coordinate={originCoord} pinColor={T.forest} />
          <Marker coordinate={destCoord} pinColor={T.emerald} />
          <Polyline coordinates={[originCoord, destCoord]} strokeColor={T.forest} strokeWidth={3} lineDashPattern={[8, 5]} />
          {carrierPos && (
            <Marker coordinate={{ latitude: carrierPos.lat, longitude: carrierPos.lon }}>
              <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: T.forest, borderWidth: 2.5, borderColor: T.lime, alignItems: "center", justifyContent: "center" }}>
                <MaterialCommunityIcons name="moped" size={15} color={T.lime} />
              </View>
            </Marker>
          )}
        </MapView>

        {/* Map overlays */}
        <TouchableOpacity
          onPress={onClose}
          hitSlop={10}
          style={{ position: "absolute", top: insets.top + 12, right: 16, width: 34, height: 34, borderRadius: 17, backgroundColor: "rgba(0,0,0,0.45)", alignItems: "center", justifyContent: "center" }}
        >
          <MaterialCommunityIcons name="close" size={18} color="#fff" />
        </TouchableOpacity>
        <View style={{ position: "absolute", top: insets.top + 12, left: 16, backgroundColor: "rgba(244,239,227,0.95)", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 }}>
          <Text style={{ fontSize: 10, letterSpacing: 1.5, fontWeight: "700", color: T.ink }}>DP-{String(shipment.id).padStart(4, "0")}</Text>
        </View>

        <ScrollView
          contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: insets.bottom + 24 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Route */}
          <View style={dm.card}>
            <Text style={dm.cardTitle}>RUTA</Text>
            <View style={{ flexDirection: "row", gap: 12 }}>
              <View style={{ alignItems: "center", gap: 3, paddingTop: 3 }}>
                <View style={{ width: 10, height: 10, borderRadius: 5, borderWidth: 2.5, borderColor: T.forest, backgroundColor: T.card }} />
                <View style={{ width: 2, flex: 1, backgroundColor: T.border, minHeight: 20 }} />
                <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: T.emerald, transform: [{ rotate: "45deg" }] }} />
              </View>
              <View style={{ flex: 1, gap: 16 }}>
                <Text style={{ fontSize: 14, color: T.ink, fontWeight: "500" }} numberOfLines={2}>{origAddr}</Text>
                <Text style={{ fontSize: 14, color: T.ink, fontWeight: "500" }} numberOfLines={2}>{destAddr}</Text>
              </View>
            </View>
          </View>

          {/* Package */}
          <View style={dm.card}>
            <Text style={dm.cardTitle}>PAQUETE</Text>

            {/* Photo */}
            {!!shipment.photo_url && (
              <Image
                source={{ uri: shipment.photo_url }}
                style={{ width: "100%", height: 180, borderRadius: 12, marginBottom: 14 }}
                resizeMode="cover"
              />
            )}

            {/* Size + weight */}
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <PackageThumb category={shipment.package_size} size={52} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 17, fontWeight: "700", color: T.ink, letterSpacing: -0.4 }}>{sizeLabel}</Text>
                <Text style={{ fontSize: 13, color: T.inkMute, marginTop: 2 }}>{shipment.weight_kg} kg</Text>
              </View>
            </View>

            {/* Description */}
            {!!shipment.description && (
              <>
                <View style={dm.divider} />
                <View style={{ flexDirection: "row", gap: 10, paddingVertical: 12 }}>
                  <MaterialCommunityIcons name="text-box-outline" size={16} color={T.inkMute} style={{ marginTop: 1 }} />
                  <Text style={{ flex: 1, fontSize: 14, color: T.ink, lineHeight: 20 }}>{shipment.description}</Text>
                </View>
              </>
            )}

            <View style={dm.divider} />

            {/* Modality */}
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 12 }}>
              <MaterialCommunityIcons
                name={isCollab ? "account-group-outline" : "lightning-bolt"}
                size={16} color={isCollab ? T.forest : T.amber}
              />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 10, letterSpacing: 1, color: T.inkMute, textTransform: "uppercase" }}>TIPO DE VIAJE</Text>
                <Text style={{ fontSize: 14, color: T.ink, fontWeight: "600", marginTop: 1 }}>
                  {isCollab ? "Colaborativa" : "Dedicada"}
                  {isCollab ? " · Compartido con otros envíos" : " · Viaje exclusivo"}
                </Text>
              </View>
              {isCollab && (
                <View style={{ backgroundColor: T.mint, borderRadius: 8, paddingHorizontal: 7, paddingVertical: 4 }}>
                  <MaterialCommunityIcons name="leaf" size={14} color={T.forest} />
                </View>
              )}
            </View>

            {/* Price */}
            {shipment.estimated_price != null && (
              <>
                <View style={dm.divider} />
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 12 }}>
                  <MaterialCommunityIcons name="cash" size={16} color={T.inkMute} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 10, letterSpacing: 1, color: T.inkMute, textTransform: "uppercase" }}>COSTO</Text>
                    <Text style={{ fontSize: 18, fontWeight: "700", color: T.ink, letterSpacing: -0.5, marginTop: 1 }}>
                      ${shipment.estimated_price.toLocaleString("es-AR")}
                      <Text style={{ fontSize: 11, fontWeight: "400", color: T.inkMute }}> ARS</Text>
                    </Text>
                  </View>
                </View>
              </>
            )}

            {/* CO2 */}
            {isCollab && (shipment.co2_savings_kg ?? 0) > 0 && (
              <>
                <View style={dm.divider} />
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 12 }}>
                  <MaterialCommunityIcons name="leaf" size={16} color={T.forest} />
                  <Text style={{ fontSize: 13, color: T.forest, fontWeight: "600" }}>
                    Ahorraste {shipment.co2_savings_kg} kg de CO₂
                  </Text>
                </View>
              </>
            )}
          </View>

          {/* Cadete + contacto */}
          <View style={dm.card}>
            <Text style={dm.cardTitle}>
              {shipment.status === ShipmentStatus.DELIVERED ? "ENTREGADO POR" : shipment.status === ShipmentStatus.CANCELLED ? "CADETE" : "TU CADETE"}
            </Text>

            {shipment.status === ShipmentStatus.PENDING && !shipment.carrier_id ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: T.cardSoft, borderWidth: 1, borderColor: T.borderSoft, alignItems: "center", justifyContent: "center" }}>
                  <MaterialCommunityIcons name="clock-outline" size={20} color={T.inkMute} />
                </View>
                <View>
                  <Text style={{ fontSize: 14, fontWeight: "600", color: T.ink }}>Buscando cadete...</Text>
                  <Text style={{ fontSize: 12, color: T.inkMute, marginTop: 2 }}>Te avisamos cuando se asigne</Text>
                </View>
              </View>
            ) : (
              <>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 14 }}>
                  <AvatarBubble initials="CA" color={T.amber} size={46} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontWeight: "600", color: T.ink }}>Cadete asignado</Text>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 3 }}>
                      <MaterialCommunityIcons name="star" size={12} color={T.amber} />
                      <Text style={{ fontSize: 11, color: T.inkSoft, fontWeight: "600" }}>5.0 · 38 viajes</Text>
                    </View>
                  </View>
                </View>
                {ACTIVE_STATUSES.includes(shipment.status) && (
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    <TouchableOpacity style={[dm.contactBtn, { flex: 1 }]} onPress={callCarrier} activeOpacity={0.8}>
                      <MaterialCommunityIcons name="phone-outline" size={17} color={T.forest} />
                      <Text style={dm.contactBtnText}>Llamar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[dm.contactBtn, { flex: 1 }]} onPress={messageCarrier} activeOpacity={0.8}>
                      <MaterialCommunityIcons name="message-outline" size={17} color={T.forest} />
                      <Text style={dm.contactBtnText}>Mensaje</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}
          </View>

          {/* Estado / timeline */}
          <View style={dm.card}>
            <Text style={dm.cardTitle}>ESTADO DEL ENVÍO</Text>
            <View style={{ flexDirection: "row", alignItems: "flex-start", position: "relative" }}>
              <View style={{ position: "absolute", top: 7, left: 22, right: 22, height: 2, backgroundColor: T.border, borderRadius: 2 }} />
              <View style={{ position: "absolute", top: 7, left: 22, width: `${Math.max(0, steps.filter(st => st.done).length * 30)}%`, height: 2, backgroundColor: T.emerald, borderRadius: 2 }} />
              {steps.map((step, i) => (
                <View key={i} style={{ flex: 1, alignItems: "center", gap: 6 }}>
                  <View style={{ width: step.active ? 16 : 12, height: step.active ? 16 : 12, borderRadius: 8, backgroundColor: step.done ? T.emerald : step.active ? T.card : T.bg, borderWidth: step.active ? 2.5 : step.done ? 0 : 2, borderColor: step.active ? T.emerald : T.border, alignItems: "center", justifyContent: "center" }}>
                    {step.done && <MaterialCommunityIcons name="check" size={7} color="#F4EFE3" />}
                  </View>
                  <Text style={{ fontSize: 11, color: step.active ? T.ink : step.done ? T.inkSoft : T.inkFaint, fontWeight: step.active ? "700" : "400", textAlign: "center" }}>{step.label}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Cancelar envío */}
          {canCancel && (
            <TouchableOpacity
              style={dm.cancelBtn}
              onPress={confirmCancel}
              activeOpacity={0.8}
              disabled={cancelLoading}
            >
              {cancelLoading
                ? <ActivityIndicator size="small" color={T.red} />
                : <>
                    <MaterialCommunityIcons name="close-circle-outline" size={18} color={T.red} />
                    <Text style={dm.cancelBtnText}>Cancelar envío</Text>
                  </>
              }
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const dm = StyleSheet.create({
  card: { backgroundColor: T.card, borderRadius: 18, borderWidth: 1, borderColor: T.border, padding: 16 },
  cardTitle: { fontSize: 10, letterSpacing: 1.5, color: T.inkMute, textTransform: "uppercase", marginBottom: 12, fontWeight: "600" },
  divider: { height: 1, backgroundColor: T.borderSoft },
  contactBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: T.cardSoft, borderWidth: 1, borderColor: T.border, borderRadius: 12, paddingVertical: 13 },
  contactBtnText: { fontSize: 13, fontWeight: "600", color: T.ink },
  cancelBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: T.redBg, borderWidth: 1, borderColor: "#F0B0A8", borderRadius: 14, paddingVertical: 15 },
  cancelBtnText: { fontSize: 14, fontWeight: "600", color: T.red },
});

function RatingModal({ shipment, onClose, onRated }: { shipment: Shipment; onClose: () => void; onRated: () => void }) {
  const insets = useSafeAreaInsets();
  const [stars, setStars] = useState(5);
  const [sending, setSending] = useState(false);

  async function submit() {
    setSending(true);
    try {
      await shipmentsService.rateShipment(shipment.id, stars);
      onRated();
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      Alert.alert("No se pudo calificar", typeof detail === "string" ? detail : "Intentá de nuevo.");
    } finally {
      setSending(false);
    }
  }

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" }}>
        <View style={{ backgroundColor: T.bg, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: insets.bottom + 24, gap: 16 }}>
          <View style={{ width: 38, height: 4, backgroundColor: T.border, borderRadius: 3, alignSelf: "center" }} />
          <View>
            <Text style={{ fontSize: 10, letterSpacing: 2.5, color: T.emeraldDeep, textTransform: "uppercase" }}>ENVÍO DP-{String(shipment.id).padStart(4, "0")}</Text>
            <Text style={{ fontSize: 22, fontWeight: "700", color: T.ink, letterSpacing: -0.7, marginTop: 4 }}>¿Cómo estuvo la entrega?</Text>
          </View>
          <View style={{ flexDirection: "row", justifyContent: "center", gap: 10, paddingVertical: 8 }}>
            {[1, 2, 3, 4, 5].map(n => (
              <TouchableOpacity key={n} onPress={() => setStars(n)} hitSlop={6}>
                <MaterialCommunityIcons name={n <= stars ? "star" : "star-outline"} size={38} color={n <= stars ? T.amber : T.border} />
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity
            style={{ backgroundColor: T.forest, borderRadius: 16, height: 52, alignItems: "center", justifyContent: "center" }}
            onPress={submit}
            disabled={sending}
            activeOpacity={0.88}
          >
            {sending
              ? <ActivityIndicator color={T.lime} />
              : <Text style={{ color: "#F4EFE3", fontWeight: "600", fontSize: 15 }}>Enviar calificación</Text>}
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose} style={{ alignItems: "center", paddingVertical: 4 }}>
            <Text style={{ color: T.inkMute, fontSize: 13 }}>Ahora no</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function PastShipmentCard({ item, onPress, onRate }: { item: Shipment; onPress: () => void; onRate: () => void }) {
  const isDelivered = item.status === ShipmentStatus.DELIVERED;
  const isCancelled = item.status === ShipmentStatus.CANCELLED;
  const isCollab = item.modality === DeliveryMode.COLLABORATIVE;
  const statusColor = isDelivered ? T.emeraldDeep : isCancelled ? T.red : T.amber;
  const statusBg = isDelivered ? T.mint : isCancelled ? T.redBg : T.amberBg;
  const statusLabel = isDelivered ? "ENTREGADO" : isCancelled ? "CANCELADO" : "PENDIENTE";
  const origCoord = useAddress(item.origin_lat, item.origin_lon);
  const destCoord = useAddress(item.destination_lat, item.destination_lon);
  const avatarColor = CADETE_COLORS[item.id % 4];

  return (
    <TouchableOpacity style={s.pastCard} onPress={onPress} activeOpacity={0.88}>
      {/* Top: id + status + date */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Text style={s.cardId}>DP-{String(item.id).padStart(4, "0")}</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: statusBg, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 }}>
            <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: statusColor }} />
            <Text style={{ fontSize: 9, letterSpacing: 1, color: statusColor, fontWeight: "700", textTransform: "uppercase" }}>{statusLabel}</Text>
          </View>
        </View>
        <Text style={s.cardDate}>{formatDate(item.created_at)}</Text>
      </View>

      {/* Body: thumb + info + price */}
      <View style={{ flexDirection: "row", gap: 12, marginBottom: 12, alignItems: "flex-start" }}>
        <PackageThumb size={56} category={item.package_size} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: "700", color: T.ink, letterSpacing: -0.3 }}>{SIZE_LABEL[item.package_size]}</Text>
          <Text style={{ fontSize: 11.5, color: T.inkMute, marginTop: 2 }}>
            {item.weight_kg} kg{item.description ? ` · ${item.description}` : ""}
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
            {isCollab && (
              <View style={{ backgroundColor: T.mint, borderWidth: 1, borderColor: T.borderSoft, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5 }}>
                <Text style={{ fontSize: 8.5, letterSpacing: 1, color: T.forest, fontWeight: "700", textTransform: "uppercase" }}>COLABORATIVA</Text>
              </View>
            )}
            {(item.co2_savings_kg ?? 0) > 0 && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                <MaterialCommunityIcons name="leaf" size={10} color={T.emeraldDeep} />
                <Text style={{ fontSize: 9, letterSpacing: 1, color: T.emeraldDeep, fontWeight: "700", textTransform: "uppercase" }}>
                  -{item.co2_savings_kg} CO₂
                </Text>
              </View>
            )}
          </View>
        </View>
        {item.estimated_price != null && (
          <View style={{ alignItems: "flex-end" }}>
            <Text style={{ fontSize: 17, fontWeight: "700", color: T.ink, letterSpacing: -0.5 }}>
              ${item.estimated_price.toLocaleString("es-AR")}
            </Text>
            <Text style={{ fontSize: 8.5, letterSpacing: 1, color: T.inkMute, textTransform: "uppercase" }}>ARS</Text>
          </View>
        )}
      </View>

      {/* Route */}
      <View style={{ backgroundColor: T.bg, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 10 }}>
        <MiniRouteLine origin={origCoord} destination={destCoord} />
      </View>

      {/* Cadete row */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingTop: 4 }}>
        <AvatarBubble initials="C" color={avatarColor} size={28} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 12, color: T.ink, fontWeight: "500" }}>Cadete</Text>
          <Text style={{ fontSize: 9, letterSpacing: 1, color: T.inkMute, textTransform: "uppercase", marginTop: 1 }}>1 VIAJE JUNTOS</Text>
        </View>
        {isDelivered && (
          <TouchableOpacity style={s.rateBtn} activeOpacity={0.85} onPress={onRate}>
            <MaterialCommunityIcons name="star-outline" size={11} color={T.lime} />
            <Text style={{ fontSize: 11.5, fontWeight: "600", color: "#F4EFE3" }}>Calificar</Text>
          </TouchableOpacity>
        )}
        {isCancelled && (
          <TouchableOpacity style={s.resendBtn} activeOpacity={0.85}>
            <Text style={{ fontSize: 11.5, fontWeight: "600", color: T.inkSoft }}>Reenviar</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

export default function MisEnviosScreen() {
  const insets = useSafeAreaInsets();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [tab, setTab] = useState<Tab>("active");
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [ratingShipment, setRatingShipment] = useState<Shipment | null>(null);

  async function load() {
    setLoading(true);
    setError(false);
    try {
      const data = await shipmentsService.getMyShipments(0, 50);
      const sorted = [...data].sort((a, b) => {
        const aA = ACTIVE_STATUSES.includes(a.status) ? 1 : 0;
        const bA = ACTIVE_STATUSES.includes(b.status) ? 1 : 0;
        if (aA !== bA) return bA - aA;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
      setShipments(sorted);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  useFocusEffect(useCallback(() => { load(); }, []));

  const activeShipments    = shipments.filter(s => ACTIVE_STATUSES.includes(s.status));
  const deliveredShipments = shipments.filter(s => s.status === ShipmentStatus.DELIVERED);
  const cancelledShipments = shipments.filter(s => s.status === ShipmentStatus.CANCELLED);

  const co2Total = deliveredShipments
    .filter(s => s.modality === DeliveryMode.COLLABORATIVE)
    .reduce((sum, s) => sum + (s.co2_savings_kg ?? 0), 0);
  const collabCount = deliveredShipments.filter(s => s.modality === DeliveryMode.COLLABORATIVE).length;

  const tabList = tab === "active" ? activeShipments : tab === "delivered" ? deliveredShipments : cancelledShipments;

  const TABS: { key: Tab; label: string; count: number }[] = [
    { key: "active",    label: "En curso",   count: activeShipments.length },
    { key: "delivered", label: "Entregados", count: deliveredShipments.length },
    { key: "cancelled", label: "Cancelados", count: cancelledShipments.length },
  ];

  const emptyLabel = tab === "active" ? "Sin envíos activos" : tab === "delivered" ? "Sin entregas todavía" : "Sin cancelaciones";

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.eyebrow}>HISTORIAL</Text>
          <Text style={s.title}>Mis envíos</Text>
        </View>
        <TouchableOpacity style={s.headerBtn} activeOpacity={0.75}>
          <MaterialCommunityIcons name="magnify" size={18} color={T.ink} />
        </TouchableOpacity>
      </View>

      {/* Tab bar */}
      <View style={s.tabBarWrap}>
        <View style={s.tabPill}>
          {TABS.map(t => (
            <TouchableOpacity
              key={t.key}
              style={[s.tabItem, tab === t.key && s.tabItemActive]}
              onPress={() => setTab(t.key)}
              activeOpacity={0.75}
            >
              <Text style={[s.tabLabel, tab === t.key && s.tabLabelActive]}>{t.label}</Text>
              <View style={[s.tabBadge, tab === t.key && s.tabBadgeActive]}>
                <Text style={[s.tabBadgeText, tab === t.key && s.tabBadgeTextActive]}>{t.count}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={T.forest} />
        </View>
      ) : error ? (
        <View style={s.center}>
          <MaterialCommunityIcons name="wifi-off" size={48} color={T.border} />
          <Text style={s.emptyTitle}>Sin conexión</Text>
          <TouchableOpacity style={s.retryBtn} onPress={load}>
            <Text style={s.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 14, gap: 10, paddingBottom: insets.bottom + 32 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Section header for Entregados / Cancelados */}
          {tab !== "active" && tabList.length > 0 && (
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 4 }}>
              <Text style={s.sectionLabel}>ANTERIORES</Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <Text style={{ fontSize: 10, letterSpacing: 1.5, color: T.inkSoft, textTransform: "uppercase", fontWeight: "600" }}>ESTE MES</Text>
                <MaterialCommunityIcons name="chevron-down" size={12} color={T.inkSoft} />
              </View>
            </View>
          )}

          {/* List */}
          {tabList.length === 0 ? (
            <View style={s.emptyState}>
              <MaterialCommunityIcons name="truck-delivery-outline" size={56} color={T.border} />
              <Text style={s.emptyTitle}>{emptyLabel}</Text>
            </View>
          ) : tab === "active" ? (
            activeShipments.map(item => (
              <LiveShipmentCard key={item.id} shipment={item} onPress={() => setSelectedShipment(item)} />
            ))
          ) : (
            tabList.map(item => (
              <PastShipmentCard
                key={item.id}
                item={item}
                onPress={() => setSelectedShipment(item)}
                onRate={() => setRatingShipment(item)}
              />
            ))
          )}

          {/* CO2 footer (Entregados tab) */}
          {tab === "delivered" && co2Total > 0 && (
            <View style={s.co2Footer}>
              <View style={s.co2Icon}>
                <MaterialCommunityIcons name="leaf" size={18} color={T.forest} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.co2FLabel}>ESTE MES AHORRASTE</Text>
                <Text style={s.co2FValue}>
                  {co2Total.toFixed(1)} kg de CO₂
                  {collabCount > 0 && (
                    <Text style={{ color: T.emeraldDeep }}> · {collabCount} envío{collabCount !== 1 ? "s" : ""} colaborativo{collabCount !== 1 ? "s" : ""}</Text>
                  )}
                </Text>
              </View>
            </View>
          )}
        </ScrollView>
      )}

      {selectedShipment && (
        <ShipmentDetailModal
          shipment={selectedShipment}
          onClose={() => setSelectedShipment(null)}
          onCancel={() => { setSelectedShipment(null); load(); }}
        />
      )}

      {ratingShipment && (
        <RatingModal
          shipment={ratingShipment}
          onClose={() => setRatingShipment(null)}
          onRated={() => { setRatingShipment(null); load(); }}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },

  header: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 0, paddingTop: 6 },
  eyebrow: { fontSize: 10, letterSpacing: 2.5, color: T.inkMute, textTransform: "uppercase" },
  title: { fontSize: 26, fontWeight: "700", color: T.ink, letterSpacing: -0.8, marginTop: 4 },
  headerBtn: { width: 38, height: 38, borderRadius: 12, borderWidth: 1, borderColor: T.border, backgroundColor: T.card, alignItems: "center", justifyContent: "center" },

  tabBarWrap: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 4 },
  tabPill: { flexDirection: "row", backgroundColor: T.cardSoft, borderWidth: 1, borderColor: T.borderSoft, borderRadius: 14, padding: 4, gap: 4 },
  tabItem: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 8, paddingHorizontal: 6, borderRadius: 10 },
  tabItemActive: { backgroundColor: T.card, shadowColor: T.forest, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 6, elevation: 2 },
  tabLabel: { fontSize: 12.5, fontWeight: "500", color: T.inkSoft },
  tabLabelActive: { fontWeight: "600", color: T.ink },
  tabBadge: { backgroundColor: T.border, borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1 },
  tabBadgeActive: { backgroundColor: T.forest },
  tabBadgeText: { fontSize: 9, letterSpacing: 0.5, fontWeight: "700", color: T.inkSoft },
  tabBadgeTextActive: { color: T.lime },

  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 40 },
  emptyState: { alignItems: "center", gap: 12, paddingVertical: 48 },
  emptyTitle: { fontSize: 15, color: T.inkMute, fontWeight: "600" },
  sectionLabel: { fontSize: 10, letterSpacing: 2, color: T.inkMute, textTransform: "uppercase", fontWeight: "600" },
  retryBtn: { backgroundColor: T.forest, borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10 },
  retryText: { color: "#F4EFE3", fontWeight: "700", fontSize: 14 },

  // Live card
  liveCard: { backgroundColor: T.card, borderRadius: 22, borderWidth: 1, borderColor: T.border, overflow: "hidden", shadowColor: T.forest, shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.18, shadowRadius: 32, elevation: 4 },

  // Past card
  pastCard: { backgroundColor: T.card, borderRadius: 18, borderWidth: 1, borderColor: T.border, padding: 14 },
  cardId: { fontSize: 10, letterSpacing: 1.5, color: T.ink, fontWeight: "700" },
  cardDate: { fontSize: 10, letterSpacing: 1, color: T.inkMute, textTransform: "uppercase" },
  rateBtn: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: T.forest, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  resendBtn: { borderWidth: 1, borderColor: T.border, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },

  // CO2 footer
  co2Footer: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: T.cardSoft, borderWidth: 1, borderColor: T.border, borderRadius: 14, padding: 14 },
  co2Icon: { width: 36, height: 36, borderRadius: 10, backgroundColor: T.mint, alignItems: "center", justifyContent: "center" },
  co2FLabel: { fontSize: 9.5, letterSpacing: 1.5, color: T.inkMute, textTransform: "uppercase", fontWeight: "600" },
  co2FValue: { fontSize: 16, fontWeight: "700", color: T.ink, letterSpacing: -0.4, marginTop: 1 },
});
