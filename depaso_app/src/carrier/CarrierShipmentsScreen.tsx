import { useCallback, useEffect, useState } from "react";
import { View, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from "react-native";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { carriersService } from "@/src/shared/api/carriers";
import { shipmentsService } from "@/src/shared/api/shipments";
import { CarrierSummary, Shipment, ShipmentStatus } from "@/src/shared/types";
import { reverseGeocode } from "@/src/shared/utils/geocoding";
import { T } from "@/constants/tokens";
import { PACKAGE_LABEL_SHORT } from "@/src/shared/utils/packageCategory";
import { EmptyState } from "@/src/shared/ui/EmptyState";

const SIZE_LABEL = PACKAGE_LABEL_SHORT;
const PAGE_SIZE = 20;

// The delivery lifecycle is managed from the operational map (Inicio) —
// this screen is history only.
const ACTIVE: ShipmentStatus[] = [
  ShipmentStatus.ASSIGNED,
  ShipmentStatus.PICKUP_ARRIVED,
  ShipmentStatus.IN_TRANSIT,
];

function useAddress(lat: number, lon: number): string {
  const [addr, setAddr] = useState(`${lat.toFixed(3)}, ${lon.toFixed(3)}`);
  useEffect(() => {
    let alive = true;
    reverseGeocode(lat, lon).then(r => { if (alive) setAddr(r); });
    return () => { alive = false; };
  }, [lat, lon]);
  return addr;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("es-AR", { day: "numeric", month: "short" }) +
    " · " + d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
}

function HistoryRow({ shipment }: { shipment: Shipment }) {
  const origAddr = useAddress(shipment.origin_lat, shipment.origin_lon);
  const destAddr = useAddress(shipment.destination_lat, shipment.destination_lon);
  const delivered = shipment.status === ShipmentStatus.DELIVERED;
  return (
    <View className="bg-card rounded-2xl border border-borderSoft p-[14px]">
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center gap-2">
          <View className="w-[9px] h-[9px] rounded-full" style={{ backgroundColor: delivered ? T.emerald : T.red }} />
          <Text className="text-[10px] tracking-[1.5px] text-inkMute font-bold">DP-{String(shipment.id).padStart(4, "0")}</Text>
          <View className={`rounded-md px-[7px] py-[2px] ${delivered ? "bg-mint" : "bg-cardSoft"}`}>
            <Text className={`text-[9px] tracking-[1px] font-bold uppercase ${delivered ? "text-emeraldDeep" : "text-red"}`}>
              {delivered ? "Entregado" : "Cancelado"}
            </Text>
          </View>
        </View>
        {shipment.estimated_price != null && delivered && (
          <Text className="text-sm font-bold text-emeraldDeep">+${shipment.estimated_price.toLocaleString("es-AR")}</Text>
        )}
      </View>
      <View className="gap-[5px] mb-2">
        <View className="flex-row items-center gap-[8px]">
          <View className="w-[8px] h-[8px] rounded-full border-2 border-forest bg-card" />
          <Text className="flex-1 text-[12.5px] text-ink font-medium" numberOfLines={1}>{origAddr}</Text>
        </View>
        <View className="flex-row items-center gap-[8px]">
          <View className="w-[8px] h-[8px] rounded-[2px] bg-emerald rotate-45" />
          <Text className="flex-1 text-[12.5px] text-ink font-medium" numberOfLines={1}>{destAddr}</Text>
        </View>
      </View>
      <Text className="text-[10.5px] text-inkMute">
        {SIZE_LABEL[shipment.package_size]} · {shipment.weight_kg} kg · {formatDate(shipment.updated_at)}
      </Text>
    </View>
  );
}

export default function CarrierShipmentsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [summary, setSummary] = useState<CarrierSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(false);

  const active = shipments.filter(sh => ACTIVE.includes(sh.status));
  const past = shipments.filter(sh => !ACTIVE.includes(sh.status) && sh.status !== ShipmentStatus.PENDING);

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

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      {/* ── Forest hero with stats ── */}
      <View className="bg-forest px-5 pt-3 pb-[18px]">
        <View className="mb-4">
          <Text className="text-[9.5px] tracking-[2.5px] text-[#F4EFE3]/80 uppercase font-bold">MIS VIAJES</Text>
          <Text className="text-[26px] font-extrabold text-[#F4EFE3] tracking-[-0.8px] mt-[3px]">Historial</Text>
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
                <MaterialCommunityIcons name={it.icon} size={14} color="rgba(244,239,227,0.8)" />
                <Text className="text-sm font-extrabold text-[#F4EFE3] tracking-[-0.4px]">{it.value}</Text>
                <Text className="text-[8.5px] tracking-[0.5px] text-[#F4EFE3]/75 uppercase text-center">{it.label}</Text>
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
          {/* Active deliveries live on the operational map, not here */}
          {active.length > 0 && (
            <TouchableOpacity
              className="bg-amberBg border-[1.2px] border-amber rounded-2xl px-4 py-[14px] flex-row items-center gap-3"
              onPress={() => router.push("/(main)/enviar")}
              activeOpacity={0.85}
            >
              <MaterialCommunityIcons name="map-marker-radius-outline" size={22} color={T.amberDeep} />
              <View className="flex-1">
                <Text className="text-[13.5px] font-bold text-amberDeep">
                  {active.length} {active.length === 1 ? "entrega" : "entregas"} en curso
                </Text>
                <Text className="text-[11.5px] text-amberDeep mt-px">Gestionalas desde el mapa en Inicio.</Text>
              </View>
              <MaterialCommunityIcons name="arrow-right" size={18} color={T.amberDeep} />
            </TouchableOpacity>
          )}

          {past.length === 0 ? (
            <View className="items-center justify-center gap-[10px] p-10">
              <View className="w-[72px] h-[72px] rounded-[22px] bg-cardSoft items-center justify-center border border-border mb-1">
                <MaterialCommunityIcons name="history" size={34} color={T.inkMute} />
              </View>
              <Text className="text-base text-ink font-bold tracking-[-0.3px] text-center">Todavía no hay historial</Text>
              <Text className="text-[13px] text-inkMute text-center">
                Cuando completes entregas, van a aparecer acá con su detalle.
              </Text>
            </View>
          ) : (
            <>
              <Text className="text-[9.5px] tracking-[2px] text-inkMute uppercase font-bold px-[2px]">HISTORIAL</Text>
              {past.map(sh => <HistoryRow key={sh.id} shipment={sh} />)}
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
