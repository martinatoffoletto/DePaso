import { useCallback, useEffect, useRef, useState } from "react";
import { View, ScrollView, TouchableOpacity, ActivityIndicator, Alert, RefreshControl, Linking } from "react-native";
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
import { PACKAGE_LABEL_SHORT } from "@/src/utils/packageCategory";
import { EmptyState } from "@/src/components/EmptyState";

const SIZE_LABEL = PACKAGE_LABEL_SHORT;
const PAGE_SIZE = 20;

const ACTIVE: ShipmentStatus[] = [
  ShipmentStatus.ASSIGNED,
  ShipmentStatus.PICKUP_ARRIVED,
  ShipmentStatus.IN_TRANSIT,
];

const STATUS_LABEL: Partial<Record<ShipmentStatus, { text: string; color: string; bg: string }>> = {
  [ShipmentStatus.ASSIGNED]:       { text: "ASIGNADO",  color: T.amber,       bg: T.amberBg },
  [ShipmentStatus.PICKUP_ARRIVED]: { text: "EN RETIRO", color: T.emeraldDeep, bg: T.mint },
  [ShipmentStatus.IN_TRANSIT]:     { text: "EN CAMINO", color: T.forest,      bg: T.mint },
};

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>["name"];

const NEXT_ACTION: Partial<Record<ShipmentStatus, { next: ShipmentStatus; label: string; icon: IconName }>> = {
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
        if (!cancelled) await trackingService.publishPosition(pos.coords.latitude, pos.coords.longitude);
      } catch {}
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
  const statusInfo = STATUS_LABEL[shipment.status];

  return (
    <View className="bg-card rounded-[18px] border border-border flex-row overflow-hidden">
      <View className="w-1" style={{ backgroundColor: isCollab ? T.emerald : T.amber }} />
      <View className="flex-1 p-[14px]">
        {/* Header */}
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center gap-2">
            <Text className="text-[10px] tracking-[1.5px] text-inkMute font-bold">DP-{String(shipment.id).padStart(4, "0")}</Text>
            {statusInfo && (
              <View className="rounded-md px-[7px] py-[3px]" style={{ backgroundColor: statusInfo.bg }}>
                <Text className="text-[9px] tracking-[1px] font-bold uppercase" style={{ color: statusInfo.color }}>
                  {statusInfo.text}
                </Text>
              </View>
            )}
          </View>
          {shipment.estimated_price != null && (
            <Text className="text-[17px] font-extrabold text-ink tracking-[-0.4px]">${shipment.estimated_price.toLocaleString("es-AR")}</Text>
          )}
        </View>

        {/* Route */}
        <View className="gap-2 mb-3">
          <View className="flex-row items-center gap-[10px]">
            <View className="w-[9px] h-[9px] rounded-full border-2 border-forest bg-card" />
            <Text className="flex-1 text-[13.5px] text-ink font-medium" numberOfLines={1}>{origAddr}</Text>
          </View>
          <View className="flex-row items-center gap-[10px]">
            <View className="w-[9px] h-[9px] rounded-[3px] bg-emerald rotate-45" />
            <Text className="flex-1 text-[13.5px] text-ink font-medium" numberOfLines={1}>{destAddr}</Text>
          </View>
        </View>

        {/* Chips */}
        <View className="flex-row gap-[6px] mb-[14px]">
          <View className="flex-row items-center gap-[5px] bg-cardSoft border border-borderSoft rounded-lg px-2 py-1">
            <MaterialCommunityIcons name="package-variant" size={12} color={T.inkSoft} />
            <Text className="text-[11px] text-inkSoft font-medium">{SIZE_LABEL[shipment.package_size]} · {shipment.weight_kg} kg</Text>
          </View>
          <View className="flex-row items-center gap-[5px] bg-cardSoft border border-borderSoft rounded-lg px-2 py-1">
            <MaterialCommunityIcons name={isCollab ? "account-group-outline" : "lightning-bolt"} size={12} color={T.inkSoft} />
            <Text className="text-[11px] text-inkSoft font-medium">{isCollab ? "Colaborativa" : "Dedicada"}</Text>
          </View>
        </View>

        {/* Recipient contact — so the carrier can coordinate the drop-off */}
        {shipment.recipient_name || shipment.recipient_phone ? (
          <View className="flex-row items-center gap-[10px] bg-cardSoft border border-borderSoft rounded-xl px-3 py-[10px] mb-[14px]">
            <MaterialCommunityIcons name="account-outline" size={16} color={T.inkSoft} />
            <View className="flex-1">
              <Text className="text-[9px] tracking-[1.5px] text-inkMute uppercase font-bold">RECIBE</Text>
              <Text className="text-[13px] text-ink font-semibold" numberOfLines={1}>
                {shipment.recipient_name || "Destinatario"}
              </Text>
            </View>
            {shipment.recipient_phone && (
              <TouchableOpacity
                className="flex-row items-center gap-[6px] bg-forest rounded-lg px-3 py-2"
                onPress={() => Linking.openURL(`tel:${shipment.recipient_phone}`)}
                activeOpacity={0.85}
              >
                <MaterialCommunityIcons name="phone" size={14} color="#F4EFE3" />
                <Text className="text-[12px] text-[#F4EFE3] font-semibold">Llamar</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : null}

        {/* Advance */}
        {action && (
          <TouchableOpacity
            className="bg-forest rounded-[14px] h-12 flex-row items-center justify-center gap-2"
            onPress={() => onAdvance(action.next)}
            disabled={advancing}
            activeOpacity={0.88}
          >
            {advancing
              ? <ActivityIndicator color="#F4EFE3" size="small" />
              : <>
                  <MaterialCommunityIcons name={action.icon} size={17} color="#F4EFE3" />
                  <Text className="text-[#F4EFE3] font-bold text-sm">{action.label}</Text>
                </>}
          </TouchableOpacity>
        )}

        {shipment.status === ShipmentStatus.ASSIGNED && (
          <TouchableOpacity className="items-center pt-3" onPress={onCancel} activeOpacity={0.8}>
            <Text className="text-xs text-red font-medium">No puedo llevarlo · penaliza reputación</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

export default function CarrierShipmentsScreen() {
  const insets = useSafeAreaInsets();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [summary, setSummary] = useState<CarrierSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(false);
  const [advancingId, setAdvancingId] = useState<number | null>(null);

  const active = shipments.filter(sh => ACTIVE.includes(sh.status));
  const past = shipments.filter(sh => !ACTIVE.includes(sh.status) && sh.status !== ShipmentStatus.PENDING);

  useGpsPublisher(active.length > 0);

  async function load(asRefresh = false) {
    if (asRefresh) setRefreshing(true);
    else setLoading(true);
    setError(false);
    try {
      const [list, sum] = await Promise.all([
        shipmentsService.getAssignedShipments(0, PAGE_SIZE),
        carriersService.getSummary(),
      ]);
      setShipments(list);
      setSummary(sum);
      setHasMore(list.length === PAGE_SIZE);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || loading) return;
    setLoadingMore(true);
    try {
      const more = await shipmentsService.getAssignedShipments(shipments.length, PAGE_SIZE);
      if (more.length) setShipments(prev => [...prev, ...more]);
      setHasMore(more.length === PAGE_SIZE);
    } catch {
      // best-effort
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, loading, shipments.length]);

  useFocusEffect(useCallback(() => { load(); }, []));

  async function advance(shipment: Shipment, next: ShipmentStatus) {
    setAdvancingId(shipment.id);
    try {
      let coords: { lat: number; lon: number } | undefined;
      try {
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        coords = { lat: pos.coords.latitude, lon: pos.coords.longitude };
      } catch {}
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
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      {/* ── Forest hero with stats ── */}
      <View className="bg-forest px-5 pt-3 pb-[18px]">
        <View className="mb-4">
          <Text className="text-[9.5px] tracking-[2.5px] text-[#F4EFE3]/45 uppercase font-bold">MIS VIAJES</Text>
          <Text className="text-[26px] font-extrabold text-[#F4EFE3] tracking-[-0.8px] mt-[3px]">Entregas</Text>
        </View>

        {summary && (
          <View className="flex-row gap-2">
            {[
              { label: "Entregas",    value: String(summary.deliveries_completed), icon: "package-variant-closed" as const },
              { label: "Ganancias",   value: `$${Math.round(summary.total_earnings / 1000).toFixed(1)}k`, icon: "cash-multiple" as const },
              { label: "Reputación",  value: summary.reputation.toFixed(1),                               icon: "star-outline" as const },
              { label: "CO₂",         value: `${summary.total_co2_saved_kg.toFixed(0)} kg`,               icon: "leaf" as const },
            ].map((it, i) => (
              <View key={i} className="flex-1 bg-[#F4EFE3]/[0.08] rounded-[14px] p-[10px] items-center gap-1 border border-[#F4EFE3]/10">
                <MaterialCommunityIcons name={it.icon} size={14} color="rgba(244,239,227,0.5)" />
                <Text className="text-sm font-extrabold text-[#F4EFE3] tracking-[-0.4px]">{it.value}</Text>
                <Text className="text-[8.5px] tracking-[0.5px] text-[#F4EFE3]/45 uppercase text-center">{it.label}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {loading ? (
        <View className="items-center justify-center gap-[10px] p-10"><ActivityIndicator size="large" color={T.forest} /></View>
      ) : error ? (
        <EmptyState
          icon="wifi-off"
          title="Sin conexión"
          description="No pudimos cargar tus viajes."
          ctaLabel="Reintentar"
          onCta={() => load()}
        />
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, gap: 10, paddingBottom: insets.bottom + 32 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={T.forest} />}
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={400}
          onScroll={(e) => {
            const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
            if (layoutMeasurement.height + contentOffset.y >= contentSize.height - 400) loadMore();
          }}
        >
          {active.length > 0 && (
            <View className="flex-row items-center gap-2 px-[2px] mb-[2px]">
              <View className="w-[7px] h-[7px] rounded-full bg-emerald" />
              <Text className="text-[9.5px] tracking-[2px] text-inkMute uppercase font-bold">EN CURSO · TRANSMITIENDO UBICACIÓN</Text>
            </View>
          )}
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
            <View className="items-center justify-center gap-[10px] p-10">
              <View className="w-[72px] h-[72px] rounded-[22px] bg-cardSoft items-center justify-center border border-border mb-1">
                <MaterialCommunityIcons name="moped-outline" size={34} color={T.inkMute} />
              </View>
              <Text className="text-base text-ink font-bold tracking-[-0.3px] text-center">Sin entregas activas</Text>
              <Text className="text-[13px] text-inkMute text-center">Aceptá pedidos desde la pestaña Pedidos.</Text>
            </View>
          )}

          {past.length > 0 && (
            <>
              <Text className="text-[9.5px] tracking-[2px] text-inkMute uppercase font-bold mt-[10px] px-[2px]">HISTORIAL</Text>
              {past.map(sh => {
                const delivered = sh.status === ShipmentStatus.DELIVERED;
                return (
                  <View key={sh.id} className="flex-row items-center gap-3 bg-card rounded-[14px] border border-borderSoft p-[14px]">
                    <View className="w-[9px] h-[9px] rounded-full shrink-0" style={{ backgroundColor: delivered ? T.emerald : T.red }} />
                    <View className="flex-1">
                      <Text className="text-[10px] tracking-[1.5px] text-inkMute font-bold">DP-{String(sh.id).padStart(4, "0")}</Text>
                      <Text className="text-xs text-inkMute mt-[2px]">{SIZE_LABEL[sh.package_size]} · {delivered ? "Entregado" : "Cancelado"}</Text>
                    </View>
                    {sh.estimated_price != null && delivered && (
                      <Text className="text-sm font-bold text-emeraldDeep">+${sh.estimated_price.toLocaleString("es-AR")}</Text>
                    )}
                  </View>
                );
              })}
            </>
          )}

          {loadingMore && (
            <View className="py-4 items-center">
              <ActivityIndicator color={T.forest} />
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}
