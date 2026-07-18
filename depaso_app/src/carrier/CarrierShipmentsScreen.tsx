import { useCallback, useState } from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Text,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { carriersService, routesService } from "@/src/shared/api/carriers";
import { shipmentsService } from "@/src/shared/api/shipments";
import { CarrierRoute, CarrierSummary, Shipment, ShipmentStatus } from "@/src/shared/types";
import { T } from "@/constants/tokens";
import { EmptyState } from "@/src/shared/ui/EmptyState";
import { parseApiDate } from "@/src/shared/utils/dates";
import { HistoryRow } from "./components/HistoryRow";
import { PublishedRouteRow } from "./components/PublishedRouteRow";
import { DayPickerSheet } from "./components/DayPickerSheet";
import { groupByRecency } from "./history";
import { visibleRoutes } from "./routeUtils";
import PublishTripScreen from "./PublishTripScreen";

const PAGE_SIZE = 20;

type HistoryFilter = "all" | "delivered" | "cancelled";

const FILTERS: { key: HistoryFilter; label: string }[] = [
  { key: "all", label: "Todos" },
  { key: "delivered", label: "Entregados" },
  { key: "cancelled", label: "Cancelados" },
];

// The delivery lifecycle is managed from the operational map (Inicio) —
// this screen is history only.
const ACTIVE: ShipmentStatus[] = [
  ShipmentStatus.ASSIGNED,
  ShipmentStatus.PICKUP_ARRIVED,
  ShipmentStatus.IN_TRANSIT,
];

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
  const [filter, setFilter] = useState<HistoryFilter>("all");
  const [tab, setTab] = useState<"historial" | "publicados">("historial");
  const [routes, setRoutes] = useState<CarrierRoute[]>([]);
  const [showPublish, setShowPublish] = useState(false);
  const [dayFilter, setDayFilter] = useState<Date | null>(null);
  const [calOpen, setCalOpen] = useState(false);

  const active = shipments.filter((sh) => ACTIVE.includes(sh.status));
  const past = shipments.filter(
    (sh) => !ACTIVE.includes(sh.status) && sh.status !== ShipmentStatus.PENDING,
  );
  const filtered = past.filter((sh) =>
    filter === "all"
      ? true
      : filter === "delivered"
        ? sh.status === ShipmentStatus.DELIVERED
        : sh.status === ShipmentStatus.CANCELLED,
  );

  const sameDayAs = (iso: string, d: Date) => {
    const t = parseApiDate(iso);
    return t.getFullYear() === d.getFullYear() && t.getMonth() === d.getMonth() && t.getDate() === d.getDate();
  };
  const groups = dayFilter
    ? (() => {
        const items = filtered.filter((sh) => sameDayAs(sh.updated_at, dayFilter));
        const title = dayFilter.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" });
        return items.length > 0 ? [{ title, items }] : [];
      })()
    : groupByRecency(filtered);

  const myRoutes = visibleRoutes(routes);

  async function load(asRefresh = false) {
    if (asRefresh) setRefreshing(true);
    else setLoading(true);
    setError(false);
    try {
      const [list, sum, mine] = await Promise.all([
        shipmentsService.getAssignedShipments(0, PAGE_SIZE),
        carriersService.getSummary(),
        routesService.mine().catch(() => [] as CarrierRoute[]),
      ]);
      setShipments(list);
      setSummary(sum);
      setRoutes(mine);
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
      const more = await shipmentsService.getAssignedShipments(
        shipments.length,
        PAGE_SIZE,
      );
      if (more.length) setShipments((prev) => [...prev, ...more]);
      setHasMore(more.length === PAGE_SIZE);
    } catch {
      // best-effort
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, loading, shipments.length]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, []),
  );

  // Buscar un día puntual: si el historial paginado quedó corto, traer más
  // de una vez para que el día elegido realmente aparezca.
  const pickDay = async (d: Date) => {
    setDayFilter(d);
    setCalOpen(false);
    if (hasMore) {
      try {
        const list = await shipmentsService.getAssignedShipments(0, 200);
        setShipments(list);
        setHasMore(list.length === 200);
      } catch { /* se busca sobre lo ya cargado */ }
    }
  };

  const removeRoute = (r: CarrierRoute) => {
    Alert.alert("Eliminar viaje", "¿Dar de baja este viaje publicado?", [
      { text: "No, volver", style: "cancel" },
      {
        text: "Sí, eliminar", style: "destructive",
        onPress: async () => {
          try {
            await routesService.deactivate(r.id);
            setRoutes((prev) => prev.filter((x) => x.id !== r.id));
          } catch {
            Alert.alert("Error", "No se pudo eliminar el viaje.");
          }
        },
      },
    ]);
  };

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      {showPublish && <PublishTripScreen onClose={() => { setShowPublish(false); load(); }} />}

      {/* ── Forest hero with stats ── */}
      <View className="px-4 pt-3">
        <View className="bg-forest rounded-[24px] px-5 pt-5 pb-[22px] overflow-hidden">
          <View className="mb-4">
            <Text className="text-[10px] tracking-[2px] text-[#F4EFE3]/80 uppercase font-bold">
              Historial
            </Text>
            <Text className="text-[36px] font-bold text-lime tracking-[-2px] leading-[36px] mt-1">
              Mis Viajes
            </Text>
          </View>

          {summary && (
            <View className="flex-row gap-2">
              {[
                {
                  label: "Entregas",
                  value: String(summary.deliveries_completed),
                  icon: "package-variant-closed" as const,
                },
                {
                  label: "En curso",
                  value: String(summary.active_shipments),
                  icon: "moped-outline" as const,
                },
                {
                  label: "Reputación",
                  value: summary.reputation.toFixed(1),
                  icon: "star-outline" as const,
                },
                {
                  label: "CO₂",
                  value: `${summary.total_co2_saved_kg.toFixed(0)} kg`,
                  icon: "leaf" as const,
                },
              ].map((it, i) => (
                <View
                  key={i}
                  className="flex-1 bg-[#F4EFE3]/[0.08] rounded-[14px] p-[10px] items-center gap-1 border border-[#F4EFE3]/10"
                >
                  <MaterialCommunityIcons
                    name={it.icon}
                    size={14}
                    color="rgba(244,239,227,0.8)"
                  />
                  <Text
                    className="text-sm font-extrabold text-[#F4EFE3] tracking-[-0.4px]"
                    style={{ color: "#F4EFE3" }}
                  >
                    {it.value}
                  </Text>
                  <Text
                    className="text-[8.5px] tracking-[0.5px] text-[#F4EFE3]/75 uppercase text-center"
                    style={{ color: "rgba(244,239,227,0.75)" }}
                  >
                    {it.label}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>

      {/* ── Tabs: historial de entregas vs viajes publicados ── */}
      <View className="flex-row mx-4 mt-3 bg-card border border-border rounded-[14px] p-[3px]">
        {([
          { key: "historial" as const, label: "Historial", icon: "history" as const },
          { key: "publicados" as const, label: "Publicados", icon: "map-marker-path" as const },
        ]).map((t) => {
          const selected = tab === t.key;
          return (
            <TouchableOpacity
              key={t.key}
              className={`flex-1 flex-row items-center justify-center gap-[6px] rounded-[11px] py-[9px] ${selected ? "bg-forest" : ""}`}
              onPress={() => setTab(t.key)}
              activeOpacity={0.85}
            >
              <MaterialCommunityIcons name={t.icon} size={14} color={selected ? "#F4EFE3" : T.inkMute} />
              <Text className={`text-[12.5px] font-bold ${selected ? "text-[#F4EFE3]" : "text-inkMute"}`}>
                {t.label}
                {t.key === "publicados" && myRoutes.length > 0 ? ` (${myRoutes.length})` : ""}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading ? (
        <View className="items-center justify-center gap-[10px] p-10">
          <ActivityIndicator size="large" color={T.forest} />
        </View>
      ) : error ? (
        <EmptyState
          icon="wifi-off"
          title="Sin conexión"
          description="No pudimos cargar tus viajes."
          ctaLabel="Reintentar"
          onCta={() => load()}
        />
      ) : tab === "publicados" ? (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, gap: 10, paddingBottom: insets.bottom + 32 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={T.forest} />
          }
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity
            className="bg-forest rounded-[14px] py-[13px] flex-row items-center justify-center gap-2"
            onPress={() => setShowPublish(true)}
            activeOpacity={0.88}
          >
            <MaterialCommunityIcons name="plus" size={16} color="#F4EFE3" />
            <Text className="text-[#F4EFE3] font-bold text-[13.5px]">Publicar un viaje</Text>
          </TouchableOpacity>

          {myRoutes.length === 0 ? (
            <View className="items-center justify-center gap-[10px] p-10">
              <View className="w-[72px] h-[72px] rounded-[22px] bg-cardSoft items-center justify-center border border-border mb-1">
                <MaterialCommunityIcons name="map-marker-plus-outline" size={34} color={T.inkMute} />
              </View>
              <Text className="text-base text-ink font-bold tracking-[-0.3px] text-center">
                No tenés viajes publicados
              </Text>
              <Text className="text-[13px] text-inkMute text-center">
                Publicá tu ruta habitual o una ventana de disponibilidad y recibí pedidos que te queden de paso.
              </Text>
            </View>
          ) : (
            myRoutes.map((r) => (
              <PublishedRouteRow key={r.id} route={r} onRemove={() => removeRoute(r)} />
            ))
          )}
        </ScrollView>
      ) : (
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 16,
            gap: 10,
            paddingBottom: insets.bottom + 32,
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => load(true)}
              tintColor={T.forest}
            />
          }
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={400}
          onScroll={(e) => {
            const { layoutMeasurement, contentOffset, contentSize } =
              e.nativeEvent;
            if (
              layoutMeasurement.height + contentOffset.y >=
              contentSize.height - 400
            )
              loadMore();
          }}
        >
          {/* Active deliveries live on the operational map, not here */}
          {active.length > 0 && (
            <TouchableOpacity
              className="bg-amberBg border-[1.2px] border-amber rounded-2xl px-4 py-[14px] flex-row items-center gap-3"
              onPress={() => router.push("/(main)/enviar")}
              activeOpacity={0.85}
            >
              <MaterialCommunityIcons
                name="map-marker-radius-outline"
                size={22}
                color={T.amberDeep}
              />
              <View className="flex-1">
                <Text className="text-[13.5px] font-bold text-amberDeep">
                  {active.length} {active.length === 1 ? "entrega" : "entregas"}{" "}
                  en curso
                </Text>
                <Text className="text-[11.5px] text-amberDeep mt-px">
                  Gestionalas desde el mapa en Inicio.
                </Text>
              </View>
              <MaterialCommunityIcons
                name="arrow-right"
                size={18}
                color={T.amberDeep}
              />
            </TouchableOpacity>
          )}

          {/* Filter chips */}
          {past.length > 0 && (
            <View className="flex-row gap-[6px] flex-wrap">
              {FILTERS.map((f) => {
                const selected = filter === f.key;
                return (
                  <TouchableOpacity
                    key={f.key}
                    className={`rounded-full px-[14px] py-[7px] border ${selected ? "bg-forest border-forest" : "bg-card border-border"}`}
                    onPress={() => setFilter(f.key)}
                    activeOpacity={0.8}
                  >
                    <Text className={`text-[12px] font-semibold ${selected ? "text-[#F4EFE3]" : "text-inkSoft"}`}>
                      {f.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
              <TouchableOpacity
                className={`flex-row items-center gap-[5px] rounded-full px-[12px] py-[7px] border ${dayFilter ? "bg-forest border-forest" : "bg-card border-border"}`}
                onPress={() => setCalOpen(true)}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons name="calendar-search" size={13} color={dayFilter ? "#F4EFE3" : T.inkSoft} />
                <Text className={`text-[12px] font-semibold ${dayFilter ? "text-[#F4EFE3]" : "text-inkSoft"}`}>
                  {dayFilter
                    ? dayFilter.toLocaleDateString("es-AR", { day: "numeric", month: "short" })
                    : "Día"}
                </Text>
                {dayFilter && (
                  <TouchableOpacity onPress={() => setDayFilter(null)} hitSlop={8}>
                    <MaterialCommunityIcons name="close-circle" size={14} color="#F4EFE3" />
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            </View>
          )}

          {past.length === 0 ? (
            <View className="items-center justify-center gap-[10px] p-10">
              <View className="w-[72px] h-[72px] rounded-[22px] bg-cardSoft items-center justify-center border border-border mb-1">
                <MaterialCommunityIcons
                  name="history"
                  size={34}
                  color={T.inkMute}
                />
              </View>
              <Text className="text-base text-ink font-bold tracking-[-0.3px] text-center">
                Todavía no hay historial
              </Text>
              <Text className="text-[13px] text-inkMute text-center">
                Cuando completes entregas, van a aparecer acá con su detalle.
              </Text>
            </View>
          ) : groups.length === 0 ? (
            <View className="items-center justify-center gap-2 p-8">
              <MaterialCommunityIcons name="filter-off-outline" size={26} color={T.inkMute} />
              <Text className="text-[13px] text-inkMute text-center">
                {dayFilter
                  ? `No hay viajes el ${dayFilter.toLocaleDateString("es-AR", { day: "numeric", month: "long" })}.`
                  : `No hay viajes ${filter === "delivered" ? "entregados" : "cancelados"} en tu historial.`}
              </Text>
            </View>
          ) : (
            groups.map((g) => (
              <View key={g.title} className="gap-[10px]">
                <Text className="text-[9.5px] tracking-[2px] text-inkMute uppercase font-bold px-[2px] mt-1">
                  {g.title}
                </Text>
                {g.items.map((sh) => (
                  <HistoryRow key={sh.id} shipment={sh} />
                ))}
              </View>
            ))
          )}

          {loadingMore && (
            <View className="py-4 items-center">
              <ActivityIndicator color={T.forest} />
            </View>
          )}
        </ScrollView>
      )}

      <DayPickerSheet
        visible={calOpen}
        selected={dayFilter}
        onSelect={pickDay}
        onClose={() => setCalOpen(false)}
        title="Buscar viajes de un día"
      />
    </View>
  );
}
