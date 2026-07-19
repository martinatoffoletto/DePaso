import { useCallback, useState } from "react";
import { View, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, RefreshControl } from "react-native";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { shipmentsService } from "@/src/shared/api/shipments";
import { DeliveryMode, Shipment, ShipmentStatus } from "@/src/shared/types";
import { PACKAGE_LABEL_SHORT as SIZE_LABEL } from "@/src/shared/utils/packageCategory";
import { T } from "@/constants/tokens";
import { EmptyState } from "@/src/shared/ui/EmptyState";
import { SkeletonCard } from "@/src/shared/ui/Skeleton";
import { ACTIVE_STATUSES } from "./components/shipmentsUi";
import { LiveShipmentCard } from "./components/LiveShipmentCard";
import { ShipmentDetailModal } from "./components/ShipmentDetailModal";
import { RatingModal } from "./components/RatingModal";
import { PastShipmentCard } from "./components/PastShipmentCard";

type Tab = "active" | "delivered" | "cancelled";

const PAGE_SIZE = 20;

/** Active shipments first, then newest first. */
function sortShipments(data: Shipment[]): Shipment[] {
  return [...data].sort((a, b) => {
    const aA = ACTIVE_STATUSES.includes(a.status) ? 1 : 0;
    const bA = ACTIVE_STATUSES.includes(b.status) ? 1 : 0;
    if (aA !== bA) return bA - aA;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}

export default function MisEnviosScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(false);
  const [tab, setTab] = useState<Tab>("active");
  const [query, setQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [ratingShipment, setRatingShipment] = useState<Shipment | null>(null);

  async function load(isRefresh = false) {
    if (!isRefresh) setLoading(true);
    setError(false);
    try {
      const data = await shipmentsService.getMyShipments(0, PAGE_SIZE);
      setShipments(sortShipments(data));
      setHasMore(data.length === PAGE_SIZE);
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
      const data = await shipmentsService.getMyShipments(shipments.length, PAGE_SIZE);
      if (data.length) setShipments(prev => sortShipments([...prev, ...data]));
      setHasMore(data.length === PAGE_SIZE);
    } catch {
      // best-effort: a failed page-load just stops loading more
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, loading, shipments.length]);

  const onRefresh = () => { setRefreshing(true); load(true); };

  useFocusEffect(useCallback(() => { load(); }, []));

  const activeShipments    = shipments.filter(s => ACTIVE_STATUSES.includes(s.status));
  const deliveredShipments = shipments.filter(s => s.status === ShipmentStatus.DELIVERED);
  const cancelledShipments = shipments.filter(s => s.status === ShipmentStatus.CANCELLED);

  const co2Total = deliveredShipments
    .filter(s => s.modality === DeliveryMode.COLLABORATIVE)
    .reduce((sum, s) => sum + (s.co2_savings_kg ?? 0), 0);
  const collabCount = deliveredShipments.filter(s => s.modality === DeliveryMode.COLLABORATIVE).length;

  const tabList = tab === "active" ? activeShipments : tab === "delivered" ? deliveredShipments : cancelledShipments;

  // Search over id / category / recipient.
  const q = query.trim().toLowerCase();
  const visibleList = q
    ? tabList.filter(s =>
        `dp-${String(s.id).padStart(4, "0")}`.includes(q) ||
        (SIZE_LABEL[s.package_size] ?? "").toLowerCase().includes(q) ||
        (s.recipient_name ?? "").toLowerCase().includes(q))
    : tabList;

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
        <TouchableOpacity className="w-[38px] h-[38px] rounded-xl border border-border bg-card items-center justify-center" activeOpacity={0.75} onPress={() => { setShowSearch(v => !v); setQuery(""); }}>
          <MaterialCommunityIcons name={showSearch ? "close" : "magnify"} size={18} color={T.ink} />
        </TouchableOpacity>
      </View>

      {showSearch && (
        <View className="mx-5 mt-3 flex-row items-center gap-2 bg-card border border-border rounded-xl px-3">
          <MaterialCommunityIcons name="magnify" size={16} color={T.inkMute} />
          <TextInput
            className="flex-1 text-[14px] text-ink py-[9px]"
            value={query}
            onChangeText={setQuery}
            placeholder="Buscar por código, tipo o destinatario"
            placeholderTextColor={T.inkMute}
            autoFocus
          />
        </View>
      )}

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
                  <Text className="text-[9px] tracking-[0.5px] font-bold" style={{ color: isActive ? T.lime : T.inkSoft }}>{t.count}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {loading ? (
        <View className="flex-1 gap-[10px] px-4 pt-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </View>
      ) : error ? (
        <EmptyState
          icon="wifi-off"
          title="Sin conexión"
          description="No pudimos cargar tus envíos."
          ctaLabel="Reintentar"
          onCta={load}
        />
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 14, gap: 10, paddingBottom: insets.bottom + 32 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={T.forest} />}
          scrollEventThrottle={400}
          onScroll={(e) => {
            if (q) return; // pagination pauses while searching
            const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
            if (layoutMeasurement.height + contentOffset.y >= contentSize.height - 400) loadMore();
          }}
        >
          {/* Section header for Entregados / Cancelados */}
          {tab !== "active" && tabList.length > 0 && (
            <View className="flex-row items-center justify-between px-1">
              <Text className="text-[10px] tracking-[2px] text-inkMute uppercase font-semibold">ANTERIORES</Text>
              <Text className="text-[10px] tracking-[1.5px] text-inkSoft uppercase font-semibold">ESTE MES</Text>
            </View>
          )}

          {/* List */}
          {visibleList.length === 0 ? (
            q ? (
              <EmptyState icon="magnify" title="Sin resultados" description={`No encontramos envíos para "${query}".`} />
            ) : tab === "active" ? (
              <EmptyState
                icon="truck-delivery-outline"
                title={emptyLabel}
                description="Creá tu primer envío y hacé seguimiento acá."
                ctaLabel="Crear envío"
                onCta={() => router.push("/(main)/enviar")}
              />
            ) : (
              <EmptyState icon="truck-delivery-outline" title={emptyLabel} />
            )
          ) : tab === "active" ? (
            visibleList.map(item => (
              <LiveShipmentCard key={item.id} shipment={item} onPress={() => setSelectedShipment(item)} />
            ))
          ) : (
            visibleList.map(item => (
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

          {/* Infinite-scroll footer */}
          {loadingMore && (
            <View className="py-4 items-center">
              <ActivityIndicator color={T.forest} />
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
