import { useState } from "react";
import { View, ScrollView, TouchableOpacity, Image, Alert, ActivityIndicator, Modal } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { T } from "@/constants/tokens";
import type { Coords } from "./FlowNavigator";
import { shipmentsService } from "@/src/services/shipments";
import { DeliveryMode, AssignmentMode, PackageCategory, Quote } from "@/src/types";

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>["name"];

const SIZE_LABEL: Record<string, string> = {
  s: "Pequeño / Documentos", m: "Carga mediana",
  l: "Grande / Voluminoso", xl: "Mudanza / Flete",
};

function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <View className="flex-row gap-[6px] items-center">
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          className="h-[6px] rounded"
          style={{ width: i === current - 1 ? 18 : 6, backgroundColor: i < current ? T.forest : T.border }}
        />
      ))}
      <Text className="text-[10px] tracking-[1.5px] text-inkMute ml-1">{String(current).padStart(2, "0")}/{String(total).padStart(2, "0")}</Text>
    </View>
  );
}

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
  quote: Quote | null;
  recipientName?: string;
  recipientPhone?: string;
  onBack: () => void;
  onConfirm: () => void;
};

function Row({ icon, label, value }: { icon: IconName; label: string; value: string }) {
  return (
    <View className="flex-row items-start gap-[10px] py-[10px]">
      <MaterialCommunityIcons name={icon} size={17} color={T.inkMute} />
      <Text className="text-[13px] text-inkMute w-20">{label}</Text>
      <Text className="flex-1 text-sm text-ink font-medium text-right" numberOfLines={2}>{value}</Text>
    </View>
  );
}

export function SummaryScreen({
  origin, destination, originCoords, destinationCoords,
  categoryId, weightKg, description, photoUri, mode, quote, recipientName, recipientPhone,
  onBack, onConfirm,
}: SummaryScreenProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [assignmentMode, setAssignmentMode] = useState<AssignmentMode>(AssignmentMode.ON_DEMAND);
  const [payShipmentId, setPayShipmentId] = useState<number | null>(null);
  const [paying, setPaying] = useState(false);
  const isCollaborative = mode === "colaborativa";
  const price = quote
    ? (isCollaborative ? quote.price_collaborative : quote.price_dedicated)
    : null;

  const finish = () => {
    setPayShipmentId(null);
    onConfirm();
  };

  const handleConfirm = async () => {
    if (!originCoords || !destinationCoords) return;
    setLoading(true);
    try {
      const shipment = await shipmentsService.createShipment({
        package_size: categoryId as PackageCategory,
        modality: mode === "dedicada" ? DeliveryMode.DEDICATED : DeliveryMode.COLLABORATIVE,
        assignment_mode: assignmentMode,
        origin_lat: originCoords.latitude,
        origin_lon: originCoords.longitude,
        destination_lat: destinationCoords.latitude,
        destination_lon: destinationCoords.longitude,
        weight_kg: weightKg,
        description: description || undefined,
      });
      // Open the simulated payment sheet for the freshly created shipment.
      setPayShipmentId(shipment.id);
    } catch (err: any) {
      Alert.alert("Error", err?.response?.data?.detail ?? "No se pudo crear el envío. Intentá de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const handlePay = async () => {
    if (payShipmentId == null) return;
    setPaying(true);
    try {
      const b = await shipmentsService.paySimulated(payShipmentId);
      setPayShipmentId(null);
      Alert.alert(
        "Pago confirmado",
        `Pagaste $${b.amount.toLocaleString("es-AR")} ARS.\n` +
          `El cadete recibirá $${b.carrier_payout.toLocaleString("es-AR")} ` +
          `(comisión DePaso ${Math.round(b.platform_commission_rate * 100)}%: ` +
          `$${b.platform_fee.toLocaleString("es-AR")}).\n\n` +
          "Te avisamos cuando se asigne un cadete.",
        [
          { text: "Ver mis envíos", onPress: () => { onConfirm(); router.push("/(main)/envios"); } },
          { text: "Seguir enviando", style: "cancel", onPress: onConfirm },
        ],
      );
    } catch (err: any) {
      Alert.alert("Error", err?.response?.data?.detail ?? "No se pudo procesar el pago. Intentá de nuevo.");
    } finally {
      setPaying(false);
    }
  };

  const mapRegion = originCoords && destinationCoords ? {
    latitude: (originCoords.latitude + destinationCoords.latitude) / 2,
    longitude: (originCoords.longitude + destinationCoords.longitude) / 2,
    latitudeDelta: Math.abs(originCoords.latitude - destinationCoords.latitude) * 2.2 + 0.02,
    longitudeDelta: Math.abs(originCoords.longitude - destinationCoords.longitude) * 2.2 + 0.02,
  } : undefined;

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      {/* Step header */}
      <View className="flex-row items-center justify-between px-5 pt-2 pb-1">
        <TouchableOpacity
          className="w-[38px] h-[38px] rounded-xl border border-border bg-card items-center justify-center"
          onPress={onBack}
          hitSlop={10}
        >
          <MaterialCommunityIcons name="arrow-left" size={18} color={T.ink} />
        </TouchableOpacity>
        <StepDots current={4} total={4} />

        <View className="w-[38px] h-[38px] rounded-xl border border-border bg-card items-center justify-center">
          <MaterialCommunityIcons name="creation" size={16} color={T.ink} />
        </View>
      </View>

      <View className="px-5 pt-1 pb-[10px]">
        <Text className="text-[10px] tracking-[2.5px] text-emeraldDeep uppercase mb-1">PASO 04 · RESUMEN</Text>
        <Text className="text-2xl font-bold text-ink tracking-[-0.8px] leading-7">Confirmá{"\n"}tu envío</Text>
      </View>

      {/* Map */}
      {originCoords && destinationCoords && (
        <View className="mx-4 mb-1 rounded-[18px] overflow-hidden border border-border">
          <MapView
            style={{ height: 175 }}
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
        </View>
      )}

      <ScrollView
        contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Route card */}
        <View className="bg-card rounded-[18px] border border-border p-4">
          <Text className="text-[10px] tracking-[1.5px] text-inkMute uppercase mb-3 font-semibold">RUTA</Text>
          <View className="flex-row gap-3">
            <View className="items-center gap-[2px] pt-1">
              <View className="w-[10px] h-[10px] rounded-full bg-emerald" />
              <View className="w-[2px] flex-1 bg-border min-h-[20px]" />
              <View className="w-[10px] h-[10px] rounded-[3px] bg-red" />
            </View>
            <View className="flex-1">
              <Text className="text-sm text-ink font-medium" numberOfLines={2}>{origin}</Text>
              <View className="h-3" />
              <Text className="text-sm text-ink font-medium" numberOfLines={2}>{destination}</Text>
            </View>
          </View>
          {(recipientName || recipientPhone) && (
            <Text className="text-xs text-inkMute mt-[10px]">
              Recibe: {[recipientName, recipientPhone].filter(Boolean).join(" · ")}
            </Text>
          )}
        </View>

        {/* Package details card */}
        <View className="bg-card rounded-[18px] border border-border p-4">
          <Text className="text-[10px] tracking-[1.5px] text-inkMute uppercase mb-3 font-semibold">DETALLES</Text>

          {photoUri && (
            <>
              <Image source={{ uri: photoUri }} className="w-full h-40 rounded-[10px] mb-1" resizeMode="cover" />
              <View className="h-px bg-borderSoft" />
            </>
          )}

          <Row icon="package-variant-closed" label="Paquete" value={`${SIZE_LABEL[categoryId] ?? categoryId} · ${weightKg} kg`} />

          {!!description && (
            <>
              <View className="h-px bg-borderSoft" />
              <Row icon="text-box-outline" label="Descripción" value={description} />
            </>
          )}

          <View className="h-px bg-borderSoft" />
          <Row
            icon={isCollaborative ? "account-group-outline" : "lightning-bolt"}
            label="Modalidad"
            value={isCollaborative ? "Colaborativa" : "Dedicada"}
          />
          <View className="h-px bg-borderSoft" />
          <View className="flex-row items-start gap-[10px] py-[10px]">
            <MaterialCommunityIcons name="clock-fast" size={17} color={T.inkMute} />
            <Text className="text-[13px] text-inkMute w-20">Asignación</Text>
            <View className="flex-row gap-[6px] flex-1 justify-end">
              <TouchableOpacity
                className={`px-[10px] py-[5px] rounded-lg border ${assignmentMode === AssignmentMode.ON_DEMAND ? "border-forest bg-forest" : "border-border bg-card"}`}
                onPress={() => setAssignmentMode(AssignmentMode.ON_DEMAND)}
                activeOpacity={0.8}
              >
                <Text className={`text-xs font-medium ${assignmentMode === AssignmentMode.ON_DEMAND ? "text-white" : "text-inkMute"}`}>
                  Inmediato
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`px-[10px] py-[5px] rounded-lg border ${assignmentMode === AssignmentMode.BY_AVAILABILITY ? "border-forest bg-forest" : "border-border bg-card"}`}
                onPress={() => setAssignmentMode(AssignmentMode.BY_AVAILABILITY)}
                activeOpacity={0.8}
              >
                <Text className={`text-xs font-medium ${assignmentMode === AssignmentMode.BY_AVAILABILITY ? "text-white" : "text-inkMute"}`}>
                  Por ruta
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          <View className="h-px bg-borderSoft" />
          <Row icon="cash" label="Precio est." value={price != null ? `$${price.toLocaleString("es-AR")} ARS` : "A confirmar"} />
        </View>

        {/* CO₂ hero card */}
        {isCollaborative && (
          <View className="flex-row gap-3 bg-mint rounded-2xl p-4 border border-border items-start">
            <View className="w-9 h-9 rounded-xl bg-emerald items-center justify-center shrink-0">
              <MaterialCommunityIcons name="leaf" size={20} color="#fff" />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-semibold text-forest mb-[2px]">Ahorrás CO₂</Text>
              <Text className="text-xs text-inkSoft leading-[17px]">
                {"Este envío colaborativo evita hasta "}
                <Text className="text-emeraldDeep font-bold">
                  {quote?.co2_savings_estimate_kg != null
                    ? `${quote.co2_savings_estimate_kg.toFixed(1)} kg`
                    : "~1.8 kg"}{" CO₂"}
                </Text>
                {" de emisiones"}
              </Text>
            </View>
          </View>
        )}

        {/* CTAs */}
        <TouchableOpacity
          className="flex-row bg-forest rounded-[14px] py-4 items-center justify-center gap-[10px]"
          style={{ opacity: loading ? 0.7 : 1, shadowColor: T.forest, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 16, elevation: 5 }}
          onPress={handleConfirm}
          activeOpacity={0.88}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <>
                <MaterialCommunityIcons name="check-circle-outline" size={22} color="#fff" />
                <Text className="text-[#F4EFE3] font-bold text-[17px]">Confirmar envío</Text>
              </>
          }
        </TouchableOpacity>

        <TouchableOpacity className="items-center py-[10px]" onPress={onBack} activeOpacity={0.7}>
          <Text className="text-sm text-inkMute">Volver y modificar</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Simulated payment sheet */}
      <Modal
        visible={payShipmentId != null}
        transparent
        animationType="slide"
        onRequestClose={() => { if (!paying) finish(); }}
      >
        <View className="flex-1 justify-end bg-black/40">
          <View className="bg-bg rounded-t-[28px] px-5 pt-4" style={{ paddingBottom: insets.bottom + 20 }}>
            <View className="items-center mb-3">
              <View className="w-10 h-[5px] rounded-full bg-border" />
            </View>

            <View className="flex-row items-center gap-[10px] mb-1">
              <View className="w-9 h-9 rounded-xl bg-forest items-center justify-center">
                <MaterialCommunityIcons name="lock-check" size={20} color="#fff" />
              </View>
              <Text className="text-lg font-bold text-ink tracking-[-0.4px]">Pago del envío</Text>
            </View>
            <Text className="text-[13px] text-inkMute mb-4 leading-[18px]">
              Pago simulado — no se cobra dinero real. El monto queda retenido y se libera al cadete al completar la entrega.
            </Text>

            <View className="bg-card rounded-2xl border border-border p-4 mb-4">
              <View className="flex-row items-center justify-between">
                <Text className="text-sm text-inkMute">Total a pagar</Text>
                <Text className="text-2xl font-bold text-ink tracking-[-0.8px]">
                  {price != null ? `$${price.toLocaleString("es-AR")}` : "—"}
                  <Text className="text-sm text-inkMute font-medium"> ARS</Text>
                </Text>
              </View>
              <Text className="text-[11px] text-inkMute mt-1">
                Incluye la comisión de la plataforma. El desglose se muestra al confirmar.
              </Text>
            </View>

            <TouchableOpacity
              className="flex-row bg-forest rounded-[14px] py-4 items-center justify-center gap-[10px]"
              style={{ opacity: paying ? 0.7 : 1 }}
              onPress={handlePay}
              activeOpacity={0.88}
              disabled={paying}
            >
              {paying
                ? <ActivityIndicator color="#fff" />
                : <>
                    <MaterialCommunityIcons name="credit-card-check-outline" size={20} color="#fff" />
                    <Text className="text-[#F4EFE3] font-bold text-[16px]">Pagar (simulado)</Text>
                  </>
              }
            </TouchableOpacity>

            <TouchableOpacity className="items-center py-[12px]" onPress={finish} activeOpacity={0.7} disabled={paying}>
              <Text className="text-sm text-inkMute">Pagar más tarde</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
