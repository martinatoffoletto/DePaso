import { useCallback, useEffect, useState } from "react";
import { View, ScrollView, TouchableOpacity, ActivityIndicator, Modal, Linking, Alert, Image } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { shipmentsService } from "@/src/services/shipments";
import { trackingService } from "@/src/services/carriers";
import { AssignedCarrier, Shipment, ShipmentStatus, PackageCategory, DeliveryMode, TrackedPosition } from "@/src/types";
import { co2EquivalenceLabel } from "@/src/utils/co2";
import { T } from "@/constants/tokens";
import { reverseGeocode } from "@/src/utils/geocoding";
import { PACKAGE_LABEL_SHORT } from "@/src/utils/packageCategory";

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

const SIZE_LABEL = PACKAGE_LABEL_SHORT;

const CADETE_COLORS = [T.amber, T.violet, T.emerald, T.sky];

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("es-AR", { day: "numeric", month: "short" }).toUpperCase();
}

function thumbIcon(cat: PackageCategory): IconName {
  if (cat === PackageCategory.S) return "email-outline";
  if (cat === PackageCategory.L || cat === PackageCategory.XL) return "cube-outline";
  return "package-variant";
}

function PackageThumb({ category, size = 56 }: { category?: PackageCategory; size?: number }) {
  return (
    <View className="rounded-xl bg-cardSoft border border-borderSoft items-center justify-center shrink-0" style={{ width: size, height: size }}>
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
    <View className="items-center justify-center shrink-0" style={{ width: size, height: size, borderRadius: size, backgroundColor: color }}>
      <Text style={{ fontSize: Math.round(size * 0.38), fontWeight: "700", color: "#F4EFE3" }}>{initials}</Text>
    </View>
  );
}

function MiniRouteLine({ origin, destination }: { origin: string; destination: string }) {
  return (
    <View className="flex-row items-center">
      <View className="flex-row items-center gap-[6px] flex-1 overflow-hidden">
        <View className="w-2 h-2 rounded-full border-[1.8px] border-forest bg-card shrink-0" />
        <Text className="text-[12.5px] text-ink font-medium" numberOfLines={1}>{origin}</Text>
      </View>
      <View className="flex-row items-center gap-[2px] px-2">
        {[0.4, 0.7, 1.0].map((op, i) => (
          <View key={i} className="w-[3px] h-[3px] rounded-full bg-inkFaint" style={{ opacity: op }} />
        ))}
      </View>
      <View className="flex-row items-center gap-[6px] flex-1 justify-end overflow-hidden">
        <Text className="text-[12.5px] text-ink font-medium" numberOfLines={1}>{destination}</Text>
        <View className="w-2 h-2 rounded-[2px] bg-emerald rotate-45 shrink-0" />
      </View>
    </View>
  );
}

function carrierInitials(name?: string): string {
  if (!name) return "CA";
  return name.split(" ").filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase() || "CA";
}

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

// Shared progress-timeline row (used by the live card and the detail modal)
function StatusTimeline({ steps, dotBase }: { steps: ReturnType<typeof timelineSteps>; dotBase: number }) {
  const doneCount = steps.filter(st => st.done).length;
  return (
    <View className="flex-row items-start relative">
      <View className="absolute left-[22px] right-[22px] h-[2px] bg-border rounded-[2px]" style={{ top: dotBase / 2 + 1 }} />
      <View className="absolute left-[22px] h-[2px] bg-emerald rounded-[2px]" style={{ top: dotBase / 2 + 1, width: `${Math.max(0, doneCount * 30)}%` }} />
      {steps.map((step, i) => (
        <View key={i} className="flex-1 items-center" style={{ gap: dotBase <= 10 ? 4 : 6 }}>
          <View
            className="items-center justify-center"
            style={{
              width: step.active ? dotBase + 4 : dotBase, height: step.active ? dotBase + 4 : dotBase,
              borderRadius: (dotBase + 4) / 2,
              backgroundColor: step.done ? T.emerald : step.active ? T.card : T.bg,
              borderWidth: step.active ? 2.5 : step.done ? 0 : 2,
              borderColor: step.active ? T.emerald : T.border,
            }}
          >
            {step.done && <MaterialCommunityIcons name="check" size={dotBase <= 10 ? 6 : 7} color="#F4EFE3" />}
          </View>
          <Text
            className="text-center"
            style={{ fontSize: dotBase <= 10 ? 10.5 : 11, color: step.active ? T.ink : step.done ? T.inkSoft : T.inkFaint, fontWeight: step.active ? "700" : step.done ? "500" : "400" }}
            numberOfLines={1}
          >
            {step.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

function LiveShipmentCard({ shipment, onPress }: { shipment: Shipment; onPress: () => void }) {
  const isCollab = shipment.modality === DeliveryMode.COLLABORATIVE;
  const sizeLabel = SIZE_LABEL[shipment.package_size] ?? "Paquete";
  const steps = timelineSteps(shipment.status);
  const origAddr = useAddress(shipment.origin_lat, shipment.origin_lon);
  const destAddr = useAddress(shipment.destination_lat, shipment.destination_lon);

  return (
    <TouchableOpacity
      className="bg-card rounded-[22px] border border-border overflow-hidden"
      style={{ shadowColor: T.forest, shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.18, shadowRadius: 32, elevation: 4 }}
      onPress={onPress}
      activeOpacity={0.95}
    >
      {/* Route header */}
      <View className="p-[14px] border-b border-borderSoft">
        <View className="flex-row items-center justify-between mb-[10px]">
          <View className="flex-row items-center gap-[6px] bg-forest px-[9px] py-[5px] rounded-lg">
            <View className="w-2 h-2 rounded-full bg-lime" />
            <Text className="text-[9.5px] tracking-[1.2px] font-bold text-lime uppercase">EN CURSO</Text>
          </View>
          <View className="flex-row items-center gap-2">
            <View className="flex-row items-center gap-[5px] bg-cardSoft border border-border px-2 py-[5px] rounded-lg">
              <MaterialCommunityIcons name="clock-outline" size={11} color={T.forest} />
              <Text className="text-[9.5px] text-inkSoft font-semibold">En camino</Text>
            </View>
            <View className="bg-cardSoft border border-border px-2 py-[5px] rounded-lg">
              <Text className="text-[9.5px] tracking-[1px] text-ink font-bold">DP-{String(shipment.id).padStart(4, "0")}</Text>
            </View>
          </View>
        </View>
        <MiniRouteLine origin={origAddr} destination={destAddr} />
        <View className="mt-2">
          <View className="bg-cardSoft border border-borderSoft rounded-lg px-2 py-1 self-start">
            <Text className="text-[9.5px] tracking-[1px] text-inkSoft font-bold uppercase">{shipment.weight_kg} KG</Text>
          </View>
        </View>
      </View>

      {/* Progress timeline */}
      <View className="px-4 pt-[14px] pb-3 border-b border-borderSoft">
        <StatusTimeline steps={steps} dotBase={10} />
      </View>

      {/* Package row */}
      <View className="flex-row items-center gap-3 px-4 py-3 border-b border-borderSoft">
        <PackageThumb category={shipment.package_size} size={48} />
        <View className="flex-1">
          <Text className="text-[15.5px] font-bold text-ink tracking-[-0.3px]">{sizeLabel} · {shipment.weight_kg} kg</Text>
          <Text className="text-[11.5px] text-inkMute mt-[2px]" numberOfLines={1}>{origAddr} → {destAddr}</Text>
        </View>
        {isCollab && (
          <View className="flex-row items-center gap-1 bg-mint px-[7px] py-[3px] rounded-md">
            <MaterialCommunityIcons name="leaf" size={10} color={T.forest} />
            <Text className="text-[9px] tracking-[1px] text-forest font-bold uppercase">COLAB</Text>
          </View>
        )}
      </View>

      {/* Cadete + tap hint */}
      <View className="flex-row items-center gap-3 px-4 py-[14px]">
        <AvatarBubble initials="CA" color={T.amber} size={40} />
        <View className="flex-1">
          <Text className="text-[8.5px] tracking-[1.2px] text-inkMute uppercase">TU CADETE</Text>
          <View className="flex-row items-center gap-[6px] mt-px">
            <Text className="text-sm text-ink font-semibold">Cadete asignado</Text>
            <MaterialCommunityIcons name="star" size={11} color={T.amber} />
            <Text className="text-[10px] text-inkSoft font-bold">5.0</Text>
          </View>
        </View>
        <View className="flex-row items-center gap-[5px] bg-cardSoft border border-border px-[10px] py-[7px] rounded-[10px]">
          <Text className="text-[11.5px] text-inkSoft font-semibold">Ver detalles</Text>
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

  // Assigned carrier contact + reputation (once a carrier is assigned).
  const [carrier, setCarrier] = useState<AssignedCarrier | null>(null);
  useEffect(() => {
    if (shipment.carrier_id == null) { setCarrier(null); return; }
    let alive = true;
    shipmentsService.getAssignedCarrier(shipment.id)
      .then(c => { if (alive) setCarrier(c); })
      .catch(() => {});
    return () => { alive = false; };
  }, [shipment.id, shipment.carrier_id]);

  function callCarrier() {
    if (!carrier?.phone) return;
    Linking.openURL(`tel:${carrier.phone}`);
  }
  function messageCarrier() {
    if (!carrier?.phone) return;
    const phone = carrier.phone.replace(/\D/g, "");
    Alert.alert("Enviar mensaje", "¿Por qué servicio?", [
      { text: "Mensaje de texto", onPress: () => Linking.openURL(`sms:${carrier.phone}`) },
      { text: "WhatsApp",         onPress: () => Linking.openURL(`https://wa.me/${phone}`) },
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
      <View className="flex-1 bg-bg">
        {/* Full map */}
        <MapView style={{ height: 300 }} region={liveMapRegion(shipment)}>
          <Marker coordinate={originCoord} pinColor={T.forest} />
          <Marker coordinate={destCoord} pinColor={T.emerald} />
          <Polyline coordinates={[originCoord, destCoord]} strokeColor={T.forest} strokeWidth={3} lineDashPattern={[8, 5]} />
          {carrierPos && (
            <Marker coordinate={{ latitude: carrierPos.lat, longitude: carrierPos.lon }}>
              <View className="w-[30px] h-[30px] rounded-full bg-forest border-[2.5px] border-lime items-center justify-center">
                <MaterialCommunityIcons name="moped" size={15} color={T.lime} />
              </View>
            </Marker>
          )}
        </MapView>

        {/* Map overlays */}
        <TouchableOpacity
          onPress={onClose}
          hitSlop={10}
          className="absolute right-4 w-[34px] h-[34px] rounded-full bg-black/45 items-center justify-center"
          style={{ top: insets.top + 12 }}
        >
          <MaterialCommunityIcons name="close" size={18} color="#fff" />
        </TouchableOpacity>
        <View className="absolute left-4 bg-[#F4EFE3]/95 rounded-lg px-[10px] py-[6px]" style={{ top: insets.top + 12 }}>
          <Text className="text-[10px] tracking-[1.5px] font-bold text-ink">DP-{String(shipment.id).padStart(4, "0")}</Text>
        </View>

        <ScrollView
          contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: insets.bottom + 24 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Route */}
          <View className="bg-card rounded-[18px] border border-border p-4">
            <Text className="text-[10px] tracking-[1.5px] text-inkMute uppercase mb-3 font-semibold">RUTA</Text>
            <View className="flex-row gap-3">
              <View className="items-center gap-[3px] pt-[3px]">
                <View className="w-[10px] h-[10px] rounded-full border-[2.5px] border-forest bg-card" />
                <View className="w-[2px] flex-1 bg-border min-h-[20px]" />
                <View className="w-[10px] h-[10px] rounded-[2px] bg-emerald rotate-45" />
              </View>
              <View className="flex-1 gap-4">
                <Text className="text-sm text-ink font-medium" numberOfLines={2}>{origAddr}</Text>
                <Text className="text-sm text-ink font-medium" numberOfLines={2}>{destAddr}</Text>
              </View>
            </View>
          </View>

          {/* Package */}
          <View className="bg-card rounded-[18px] border border-border p-4">
            <Text className="text-[10px] tracking-[1.5px] text-inkMute uppercase mb-3 font-semibold">PAQUETE</Text>

            {/* Photo */}
            {!!shipment.photo_url && (
              <Image
                source={{ uri: shipment.photo_url }}
                className="w-full h-[180px] rounded-xl mb-[14px]"
                resizeMode="cover"
              />
            )}

            {/* Size + weight */}
            <View className="flex-row items-center gap-3 mb-3">
              <PackageThumb category={shipment.package_size} size={52} />
              <View className="flex-1">
                <Text className="text-[17px] font-bold text-ink tracking-[-0.4px]">{sizeLabel}</Text>
                <Text className="text-[13px] text-inkMute mt-[2px]">{shipment.weight_kg} kg</Text>
              </View>
            </View>

            {/* Description */}
            {!!shipment.description && (
              <>
                <View className="h-px bg-borderSoft" />
                <View className="flex-row gap-[10px] py-3">
                  <MaterialCommunityIcons name="text-box-outline" size={16} color={T.inkMute} style={{ marginTop: 1 }} />
                  <Text className="flex-1 text-sm text-ink leading-5">{shipment.description}</Text>
                </View>
              </>
            )}

            <View className="h-px bg-borderSoft" />

            {/* Modality */}
            <View className="flex-row items-center gap-[10px] py-3">
              <MaterialCommunityIcons
                name={isCollab ? "account-group-outline" : "lightning-bolt"}
                size={16} color={isCollab ? T.forest : T.amber}
              />
              <View className="flex-1">
                <Text className="text-[10px] tracking-[1px] text-inkMute uppercase">TIPO DE VIAJE</Text>
                <Text className="text-sm text-ink font-semibold mt-px">
                  {isCollab ? "Colaborativa" : "Dedicada"}
                  {isCollab ? " · Compartido con otros envíos" : " · Viaje exclusivo"}
                </Text>
              </View>
              {isCollab && (
                <View className="bg-mint rounded-lg px-[7px] py-1">
                  <MaterialCommunityIcons name="leaf" size={14} color={T.forest} />
                </View>
              )}
            </View>

            {/* Price */}
            {shipment.estimated_price != null && (
              <>
                <View className="h-px bg-borderSoft" />
                <View className="flex-row items-center gap-[10px] py-3">
                  <MaterialCommunityIcons name="cash" size={16} color={T.inkMute} />
                  <View className="flex-1">
                    <Text className="text-[10px] tracking-[1px] text-inkMute uppercase">COSTO</Text>
                    <Text className="text-lg font-bold text-ink tracking-[-0.5px] mt-px">
                      ${shipment.estimated_price.toLocaleString("es-AR")}
                      <Text className="text-[11px] font-normal text-inkMute"> ARS</Text>
                    </Text>
                  </View>
                </View>
              </>
            )}

            {/* CO2 */}
            {isCollab && (shipment.co2_savings_kg ?? 0) > 0 && (
              <>
                <View className="h-px bg-borderSoft" />
                <View className="flex-row items-start gap-[10px] py-3">
                  <MaterialCommunityIcons name="leaf" size={16} color={T.forest} />
                  <View className="flex-1">
                    <Text className="text-[13px] text-forest font-semibold">
                      Ahorraste {shipment.co2_savings_kg} kg de CO₂
                    </Text>
                    <Text className="text-[11px] text-emeraldDeep font-medium mt-[2px]">
                      {co2EquivalenceLabel(shipment.co2_savings_kg ?? 0)}
                    </Text>
                  </View>
                </View>
              </>
            )}
          </View>

          {/* Cadete + contacto */}
          <View className="bg-card rounded-[18px] border border-border p-4">
            <Text className="text-[10px] tracking-[1.5px] text-inkMute uppercase mb-3 font-semibold">
              {shipment.status === ShipmentStatus.DELIVERED ? "ENTREGADO POR" : shipment.status === ShipmentStatus.CANCELLED ? "CADETE" : "TU CADETE"}
            </Text>

            {shipment.status === ShipmentStatus.PENDING && !shipment.carrier_id ? (
              <View className="flex-row items-center gap-3">
                <View className="w-[46px] h-[46px] rounded-full bg-cardSoft border border-borderSoft items-center justify-center">
                  <MaterialCommunityIcons name="clock-outline" size={20} color={T.inkMute} />
                </View>
                <View>
                  <Text className="text-sm font-semibold text-ink">Buscando cadete...</Text>
                  <Text className="text-xs text-inkMute mt-[2px]">Te avisamos cuando se asigne</Text>
                </View>
              </View>
            ) : (
              <>
                <View className="flex-row items-center gap-3 mb-[14px]">
                  <AvatarBubble initials={carrierInitials(carrier?.name)} color={T.amber} size={46} />
                  <View className="flex-1">
                    <Text className="text-[15px] font-semibold text-ink">{carrier?.name ?? "Cadete asignado"}</Text>
                    <View className="flex-row items-center gap-1 mt-[3px]">
                      <MaterialCommunityIcons name="star" size={12} color={T.amber} />
                      <Text className="text-[11px] text-inkSoft font-semibold">
                        {carrier ? `${carrier.rating.toFixed(1)} · ${carrier.trips} ${carrier.trips === 1 ? "viaje" : "viajes"}` : "—"}
                      </Text>
                    </View>
                  </View>
                </View>
                {ACTIVE_STATUSES.includes(shipment.status) && carrier?.phone && (
                  <View className="flex-row gap-2">
                    <TouchableOpacity className="flex-1 flex-row items-center justify-center gap-2 bg-cardSoft border border-border rounded-xl py-[13px]" onPress={callCarrier} activeOpacity={0.8}>
                      <MaterialCommunityIcons name="phone-outline" size={17} color={T.forest} />
                      <Text className="text-[13px] font-semibold text-ink">Llamar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity className="flex-1 flex-row items-center justify-center gap-2 bg-cardSoft border border-border rounded-xl py-[13px]" onPress={messageCarrier} activeOpacity={0.8}>
                      <MaterialCommunityIcons name="message-outline" size={17} color={T.forest} />
                      <Text className="text-[13px] font-semibold text-ink">Mensaje</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}
          </View>

          {/* Estado / timeline */}
          <View className="bg-card rounded-[18px] border border-border p-4">
            <Text className="text-[10px] tracking-[1.5px] text-inkMute uppercase mb-3 font-semibold">ESTADO DEL ENVÍO</Text>
            <StatusTimeline steps={steps} dotBase={12} />
          </View>

          {/* Cancelar envío */}
          {canCancel && (
            <TouchableOpacity
              className="flex-row items-center justify-center gap-2 bg-redBg border border-red/40 rounded-[14px] py-[15px]"
              onPress={confirmCancel}
              activeOpacity={0.8}
              disabled={cancelLoading}
            >
              {cancelLoading
                ? <ActivityIndicator size="small" color={T.red} />
                : <>
                    <MaterialCommunityIcons name="close-circle-outline" size={18} color={T.red} />
                    <Text className="text-sm font-semibold text-red">Cancelar envío</Text>
                  </>
              }
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

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
      <View className="flex-1 bg-black/45 justify-end">
        <View className="bg-bg rounded-t-[28px] p-6 gap-4" style={{ paddingBottom: insets.bottom + 24 }}>
          <View className="w-[38px] h-1 bg-border rounded-[3px] self-center" />
          <View>
            <Text className="text-[10px] tracking-[2.5px] text-emeraldDeep uppercase">ENVÍO DP-{String(shipment.id).padStart(4, "0")}</Text>
            <Text className="text-[22px] font-bold text-ink tracking-[-0.7px] mt-1">¿Cómo estuvo la entrega?</Text>
          </View>
          <View className="flex-row justify-center gap-[10px] py-2">
            {[1, 2, 3, 4, 5].map(n => (
              <TouchableOpacity key={n} onPress={() => setStars(n)} hitSlop={6}>
                <MaterialCommunityIcons name={n <= stars ? "star" : "star-outline"} size={38} color={n <= stars ? T.amber : T.border} />
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity
            className="bg-forest rounded-2xl h-[52px] items-center justify-center"
            onPress={submit}
            disabled={sending}
            activeOpacity={0.88}
          >
            {sending
              ? <ActivityIndicator color={T.lime} />
              : <Text className="text-[#F4EFE3] font-semibold text-[15px]">Enviar calificación</Text>}
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose} className="items-center py-1">
            <Text className="text-inkMute text-[13px]">Ahora no</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function PastShipmentCard({ item, onPress, onRate }: { item: Shipment; onPress: () => void; onRate: () => void }) {
  const router = useRouter();
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
    <TouchableOpacity className="bg-card rounded-[18px] border border-border p-[14px]" onPress={onPress} activeOpacity={0.88}>
      {/* Top: id + status + date */}
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center gap-2">
          <Text className="text-[10px] tracking-[1.5px] text-ink font-bold">DP-{String(item.id).padStart(4, "0")}</Text>
          <View className="flex-row items-center gap-1 px-[7px] py-[3px] rounded-md" style={{ backgroundColor: statusBg }}>
            <View className="w-[5px] h-[5px] rounded-full" style={{ backgroundColor: statusColor }} />
            <Text className="text-[9px] tracking-[1px] font-bold uppercase" style={{ color: statusColor }}>{statusLabel}</Text>
          </View>
        </View>
        <Text className="text-[10px] tracking-[1px] text-inkMute uppercase">{formatDate(item.created_at)}</Text>
      </View>

      {/* Body: thumb + info + price */}
      <View className="flex-row gap-3 mb-3 items-start">
        <PackageThumb size={56} category={item.package_size} />
        <View className="flex-1">
          <Text className="text-base font-bold text-ink tracking-[-0.3px]">{SIZE_LABEL[item.package_size]}</Text>
          <Text className="text-[11.5px] text-inkMute mt-[2px]">
            {item.weight_kg} kg{item.description ? ` · ${item.description}` : ""}
          </Text>
          <View className="flex-row items-center gap-[6px] mt-[6px] flex-wrap">
            {isCollab && (
              <View className="bg-mint border border-borderSoft px-[6px] py-[2px] rounded-[5px]">
                <Text className="text-[8.5px] tracking-[1px] text-forest font-bold uppercase">COLABORATIVA</Text>
              </View>
            )}
            {(item.co2_savings_kg ?? 0) > 0 && (
              <View className="flex-row items-center gap-[3px]">
                <MaterialCommunityIcons name="leaf" size={10} color={T.emeraldDeep} />
                <Text className="text-[9px] tracking-[1px] text-emeraldDeep font-bold uppercase">
                  -{item.co2_savings_kg} CO₂
                </Text>
              </View>
            )}
          </View>
        </View>
        {item.estimated_price != null && (
          <View className="items-end">
            <Text className="text-[17px] font-bold text-ink tracking-[-0.5px]">
              ${item.estimated_price.toLocaleString("es-AR")}
            </Text>
            <Text className="text-[8.5px] tracking-[1px] text-inkMute uppercase">ARS</Text>
          </View>
        )}
      </View>

      {/* Route */}
      <View className="bg-bg rounded-xl px-3 py-2 mb-[10px]">
        <MiniRouteLine origin={origCoord} destination={destCoord} />
      </View>

      {/* Cadete row */}
      <View className="flex-row items-center gap-[10px] pt-1">
        <AvatarBubble initials="C" color={avatarColor} size={28} />
        <View className="flex-1">
          <Text className="text-xs text-ink font-medium">Cadete</Text>
          <Text className="text-[9px] tracking-[1px] text-inkMute uppercase mt-px">1 VIAJE JUNTOS</Text>
        </View>
        {isDelivered && (
          <TouchableOpacity className="flex-row items-center gap-[5px] bg-forest px-[10px] py-[6px] rounded-lg" activeOpacity={0.85} onPress={onRate}>
            <MaterialCommunityIcons name="star-outline" size={11} color={T.lime} />
            <Text className="text-[11.5px] font-semibold text-[#F4EFE3]">Calificar</Text>
          </TouchableOpacity>
        )}
        {isCancelled && (
          <TouchableOpacity className="border border-border px-[10px] py-[6px] rounded-lg" activeOpacity={0.85} onPress={() => router.push("/(main)/enviar")}>
            <Text className="text-[11.5px] font-semibold text-inkSoft">Reenviar</Text>
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
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="flex-row items-end justify-between px-5 pt-[6px]">
        <View>
          <Text className="text-[10px] tracking-[2.5px] text-inkMute uppercase">HISTORIAL</Text>
          <Text className="text-[26px] font-bold text-ink tracking-[-0.8px] mt-1">Mis envíos</Text>
        </View>
        <TouchableOpacity className="w-[38px] h-[38px] rounded-xl border border-border bg-card items-center justify-center" activeOpacity={0.75} onPress={() => Alert.alert("Búsqueda", "La búsqueda estará disponible en una próxima versión.")}>
          <MaterialCommunityIcons name="magnify" size={18} color={T.ink} />
        </TouchableOpacity>
      </View>

      {/* Tab bar */}
      <View className="px-4 pt-4 pb-1">
        <View className="flex-row bg-cardSoft border border-borderSoft rounded-[14px] p-1 gap-1">
          {TABS.map(t => {
            const isActive = tab === t.key;
            return (
              <TouchableOpacity
                key={t.key}
                className="flex-1 flex-row items-center justify-center gap-[6px] py-2 px-[6px] rounded-[10px]"
                style={isActive ? { backgroundColor: T.card, shadowColor: T.forest, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 6, elevation: 2 } : undefined}
                onPress={() => setTab(t.key)}
                activeOpacity={0.75}
              >
                <Text className={`text-[12.5px] ${isActive ? "font-semibold text-ink" : "font-medium text-inkSoft"}`}>{t.label}</Text>
                <View className={`rounded px-[5px] py-px ${isActive ? "bg-forest" : "bg-border"}`}>
                  <Text className={`text-[9px] tracking-[0.5px] font-bold ${isActive ? "text-lime" : "text-inkSoft"}`}>{t.count}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center gap-3 p-10">
          <ActivityIndicator size="large" color={T.forest} />
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center gap-3 p-10">
          <MaterialCommunityIcons name="wifi-off" size={48} color={T.border} />
          <Text className="text-[15px] text-inkMute font-semibold">Sin conexión</Text>
          <TouchableOpacity className="bg-forest rounded-[10px] px-5 py-[10px]" onPress={load}>
            <Text className="text-[#F4EFE3] font-bold text-sm">Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 14, gap: 10, paddingBottom: insets.bottom + 32 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Section header for Entregados / Cancelados */}
          {tab !== "active" && tabList.length > 0 && (
            <View className="flex-row items-center justify-between px-1">
              <Text className="text-[10px] tracking-[2px] text-inkMute uppercase font-semibold">ANTERIORES</Text>
              <Text className="text-[10px] tracking-[1.5px] text-inkSoft uppercase font-semibold">ESTE MES</Text>
            </View>
          )}

          {/* List */}
          {tabList.length === 0 ? (
            <View className="items-center gap-3 py-12">
              <MaterialCommunityIcons name="truck-delivery-outline" size={56} color={T.border} />
              <Text className="text-[15px] text-inkMute font-semibold">{emptyLabel}</Text>
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
            <View className="flex-row items-center gap-3 bg-cardSoft border border-border rounded-[14px] p-[14px]">
              <View className="w-9 h-9 rounded-[10px] bg-mint items-center justify-center">
                <MaterialCommunityIcons name="leaf" size={18} color={T.forest} />
              </View>
              <View className="flex-1">
                <Text className="text-[9.5px] tracking-[1.5px] text-inkMute uppercase font-semibold">ESTE MES AHORRASTE</Text>
                <Text className="text-base font-bold text-ink tracking-[-0.4px] mt-px">
                  {co2Total.toFixed(1)} kg de CO₂
                  {collabCount > 0 && (
                    <Text className="text-emeraldDeep"> · {collabCount} envío{collabCount !== 1 ? "s" : ""} colaborativo{collabCount !== 1 ? "s" : ""}</Text>
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
