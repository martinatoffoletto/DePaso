import { useState } from "react";
import { View, ScrollView, TouchableOpacity, Image, Alert, ActivityIndicator } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { T } from "@/constants/tokens";
import { StepDots } from "@/src/sender/components/StepDots";
import { SummaryRow } from "@/src/sender/components/SummaryRow";
import type { Coords } from "./FlowNavigator";
import { shipmentsService } from "@/src/shared/api/shipments";
import { co2EquivalenceLabel } from "@/src/sender/co2";
import { PACKAGE_LABEL } from "@/src/shared/utils/packageCategory";
import { PickupSchedule, pickupScheduleLabel } from "@/src/sender/pickupSchedule";
import { DeliveryMode, AssignmentMode, PackageCategory, Quote } from "@/src/shared/types";


const SIZE_LABEL = PACKAGE_LABEL;


type SummaryScreenProps = {
  origin: string;
  destination: string;
  originCoords: Coords | null;
  destinationCoords: Coords | null;
  categoryId: string;
  weightKg: number;
  description?: string;
  declaredValue?: number | null;
  photoUri?: string | null;
  photoServerUrl?: string | null;
  mode: "dedicada" | "colaborativa";
  quote: Quote | null;
  recipientName?: string;
  recipientPhone?: string;
  schedule: PickupSchedule;
  onBack: () => void;
  onConfirm: () => void;
};


export function SummaryScreen({
  origin, destination, originCoords, destinationCoords,
  categoryId, weightKg, description, declaredValue, photoUri, photoServerUrl, mode, quote, recipientName, recipientPhone, schedule,
  onBack, onConfirm,
}: SummaryScreenProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  // Retiro inmediato o a hora exacta matchea on demand; una franja horaria
  // matchea por disponibilidad (cadete cuya ruta pasa dentro de la ventana).
  const assignmentMode = schedule.kind === "window" ? AssignmentMode.BY_AVAILABILITY : AssignmentMode.ON_DEMAND;
  const isCollaborative = mode === "colaborativa";
  const price = quote
    ? (isCollaborative ? quote.price_collaborative : quote.price_dedicated)
    : null;

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
        photo_url: photoServerUrl ?? undefined,
        description: description || undefined,
        declared_value: declaredValue ?? undefined,
        recipient_name: recipientName || undefined,
        recipient_phone: recipientPhone || undefined,
      });
      // Cobro simulado en segundo plano — el flujo no hace foco en el pago
      // (estilo Uber): si falla queda pendiente y no bloquea el pedido.
      await shipmentsService.paySimulated(shipment.id).catch(() => {});
      Alert.alert(
        "¡Pedido confirmado!",
        "Estamos buscando un cadete para tu envío. Te avisamos apenas lo tome.",
        [
          { text: "Ver mis envíos", onPress: () => { onConfirm(); router.push("/(main)/envios"); } },
          { text: "Seguir enviando", style: "cancel", onPress: onConfirm },
        ],
      );
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

          <SummaryRow icon="package-variant-closed" label="Paquete" value={`${SIZE_LABEL[categoryId] ?? categoryId} · ${weightKg} kg`} />

          {!!description && (
            <>
              <View className="h-px bg-borderSoft" />
              <SummaryRow icon="text-box-outline" label="Descripción" value={description} />
            </>
          )}

          {declaredValue != null && declaredValue > 0 && (
            <>
              <View className="h-px bg-borderSoft" />
              <SummaryRow icon="cash-multiple" label="Valor decl." value={`$${declaredValue.toLocaleString("es-AR")} ARS`} />
            </>
          )}

          <View className="h-px bg-borderSoft" />
          <SummaryRow
            icon={isCollaborative ? "account-group-outline" : "lightning-bolt"}
            label="Modalidad"
            value={isCollaborative ? "Colaborativa" : "Dedicada"}
          />
          <View className="h-px bg-borderSoft" />
          <SummaryRow icon="clock-outline" label="Retiro" value={pickupScheduleLabel(schedule)} />
          <View className="h-px bg-borderSoft" />
          <SummaryRow icon="cash" label="Precio est." value={price != null ? `$${price.toLocaleString("es-AR")} ARS` : "A confirmar"} />
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
              <Text className="text-[11px] text-emeraldDeep font-semibold mt-[3px]">
                {co2EquivalenceLabel(quote?.co2_savings_estimate_kg ?? 1.8)}
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
                <Text className="text-[#F4EFE3] font-bold text-[17px]" style={{ color: "#F4EFE3" }}>Confirmar pedido</Text>
              </>
          }
        </TouchableOpacity>

        <TouchableOpacity className="items-center py-[10px]" onPress={onBack} activeOpacity={0.7}>
          <Text className="text-sm text-inkMute">Volver y modificar</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
