import { useEffect, useState } from "react";
import { View, ScrollView, TouchableOpacity, ActivityIndicator, Modal, Linking, Alert, Image, Share } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { shipmentsService } from "@/src/shared/api/shipments";
import { trackingService } from "@/src/shared/api/carriers";
import { AssignedCarrier, PaymentStatus, Shipment, ShipmentStatus, DeliveryMode, TrackedPosition } from "@/src/shared/types";
import { co2EquivalenceLabel } from "@/src/sender/co2";
import { PACKAGE_LABEL_SHORT as SIZE_LABEL } from "@/src/shared/utils/packageCategory";
import { T } from "@/constants/tokens";
import {
  ACTIVE_STATUSES, AvatarBubble, PackageThumb, StatusTimeline,
  carrierInitials, liveMapRegion, timelineSteps, useAddress,
} from "./shipmentsUi";

/** Detalle completo del envío: mapa vivo, timeline, cadete, pago y acciones. */
export function ShipmentDetailModal({ shipment, onClose, onCancel, onPaid }: { shipment: Shipment; onClose: () => void; onCancel: () => void; onPaid: () => void }) {
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
  // "Pagar más tarde" en el flujo de creación termina acá: sin este botón
  // un envío impago no se podía pagar nunca (el escrow no se fondeaba).
  const needsPayment = shipment.payment_status === PaymentStatus.PENDING
    && shipment.status !== ShipmentStatus.CANCELLED;
  const [payLoading, setPayLoading] = useState(false);
  const steps = timelineSteps(shipment.status);

  async function payNow() {
    setPayLoading(true);
    try {
      const b = await shipmentsService.paySimulated(shipment.id);
      Alert.alert(
        "Pago confirmado",
        `Pagaste $${b.amount.toLocaleString("es-AR")} ARS.\n` +
          "El monto queda protegido y se libera al cadete al completar la entrega.",
      );
      onPaid();
    } catch {
      Alert.alert("Error", "No se pudo procesar el pago. Intentá de nuevo.");
    } finally {
      setPayLoading(false);
    }
  }

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

  const STATUS_ES: Record<string, string> = {
    pending: "pendiente de asignación", assigned: "asignado a un cadete",
    pickup_arrived: "el cadete está retirando", in_transit: "en camino",
    delivered: "entregado", cancelled: "cancelado",
  };
  function shareTracking() {
    const code = `DP-${String(shipment.id).padStart(4, "0")}`;
    Share.share({
      message: `📦 Seguí mi envío ${code} en DePaso.\nEstado: ${STATUS_ES[shipment.status] ?? shipment.status}.`,
    }).catch(() => {});
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
        <TouchableOpacity
          onPress={shareTracking}
          hitSlop={10}
          className="absolute right-[58px] w-[34px] h-[34px] rounded-full bg-black/45 items-center justify-center"
          style={{ top: insets.top + 12 }}
        >
          <MaterialCommunityIcons name="share-variant" size={16} color="#fff" />
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

            {/* Price + payment status */}
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
                  {needsPayment ? (
                    <View className="bg-amberBg rounded-lg px-2 py-1">
                      <Text className="text-[9px] tracking-[1px] font-bold uppercase" style={{ color: T.amber }}>Pago pendiente</Text>
                    </View>
                  ) : shipment.payment_status !== PaymentStatus.REFUNDED ? (
                    <View className="bg-mint rounded-lg px-2 py-1">
                      <Text className="text-[9px] tracking-[1px] text-forest font-bold uppercase">
                        {shipment.payment_status === PaymentStatus.RELEASED ? "Pagado y liberado" : "Pagado"}
                      </Text>
                    </View>
                  ) : (
                    <View className="bg-cardSoft border border-border rounded-lg px-2 py-1">
                      <Text className="text-[9px] tracking-[1px] text-inkSoft font-bold uppercase">Reintegrado</Text>
                    </View>
                  )}
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

          {/* Pagar (simulado) — el pago quedó pendiente al crear el envío */}
          {needsPayment && (
            <TouchableOpacity
              className="flex-row items-center justify-center gap-2 bg-forest rounded-[14px] py-[15px]"
              onPress={payNow}
              activeOpacity={0.88}
              disabled={payLoading}
            >
              {payLoading
                ? <ActivityIndicator size="small" color={T.lime} />
                : <>
                    <MaterialCommunityIcons name="credit-card-check-outline" size={18} color="#F4EFE3" />
                    <Text className="text-sm font-semibold text-[#F4EFE3]" style={{ color: "#F4EFE3" }}>Pagar (simulado)</Text>
                  </>
              }
            </TouchableOpacity>
          )}

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
