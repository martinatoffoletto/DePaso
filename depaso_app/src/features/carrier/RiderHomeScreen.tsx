import { useCallback, useEffect, useMemo, useState } from "react";
import { View, ScrollView, TouchableOpacity, ActivityIndicator, Alert, RefreshControl, Text } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/src/stores/authStore";
import { useRiderStore } from "@/src/stores/riderStore";
import { carriersService, routesService } from "@/src/services/carriers";
import { shipmentsService } from "@/src/services/shipments";
import { Carrier, CarrierRoute, CarrierSummary, FeedItem, PackageCategory } from "@/src/types";
import { reverseGeocode } from "@/src/utils/geocoding";
import { T } from "@/constants/tokens";
import { RiderMap } from "./RiderMap";
import { IncomingOfferModal } from "./IncomingOfferModal";
import PublishTripScreen from "./PublishTripScreen";
import { useGpsPublisher } from "./useGpsPublisher";

const SIZE_LABEL: Record<PackageCategory, string> = {
  [PackageCategory.S]:  "Chico",
  [PackageCategory.M]:  "Mediano",
  [PackageCategory.L]:  "Grande",
  [PackageCategory.XL]: "Flete",
};

function money(n: number): string {
  return `$${Math.round(n).toLocaleString("es-AR")}`;
}

function useAddress(lat: number, lon: number): string {
  const [addr, setAddr] = useState(`${lat.toFixed(3)}, ${lon.toFixed(3)}`);
  useEffect(() => {
    let alive = true;
    reverseGeocode(lat, lon).then((r) => { if (alive) setAddr(r); });
    return () => { alive = false; };
  }, [lat, lon]);
  return addr;
}

function shiftLabel(startedAt: number | null, now: number): string {
  if (!startedAt) return "recién arrancás";
  const mins = Math.max(0, Math.floor((now - startedAt) / 60000));
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}min activo` : `${m}min activo`;
}

/** Small offer row in the online "Pedidos cerca tuyo" list. */
function OfferRow({ item, onPress }: { item: FeedItem; onPress: () => void }) {
  const origAddr = useAddress(item.origin_lat, item.origin_lon);
  const destAddr = useAddress(item.destination_lat, item.destination_lon);
  return (
    <TouchableOpacity
      className="bg-card border border-border rounded-[14px] px-3 py-[10px] flex-row items-center gap-[10px]"
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View className="w-[38px] h-[38px] rounded-[10px] bg-cardSoft border border-borderSoft items-center justify-center">
        {item.distance_to_pickup_km != null ? (
          <>
            <Text className="text-[13px] font-bold text-ink">{item.distance_to_pickup_km.toFixed(1)}</Text>
            <Text className="text-[7px] tracking-[0.5px] text-inkMute mt-px">KM</Text>
          </>
        ) : (
          <MaterialCommunityIcons name="package-variant" size={18} color={T.forest} />
        )}
      </View>
      <View className="flex-1">
        <View className="flex-row items-center gap-[6px]">
          <Text className="text-[13px] text-ink font-semibold">{SIZE_LABEL[item.package_size]}</Text>
          <Text className="text-[8px] tracking-[1px] text-inkMute bg-bg px-[5px] py-px rounded font-bold uppercase">
            {item.weight_kg} kg
          </Text>
        </View>
        <Text className="text-[11px] text-inkMute mt-px" numberOfLines={1}>{origAddr} → {destAddr}</Text>
      </View>
      <View className="items-end">
        <Text className="text-[15px] font-bold text-ink tracking-[-0.4px]">
          {item.estimated_price != null ? money(item.estimated_price) : "—"}
        </Text>
        <Text className="text-[8.5px] tracking-[1px] text-emeraldDeep font-bold mt-px">VER</Text>
      </View>
    </TouchableOpacity>
  );
}

/** Published collaborative trip card (offline state). */
function TripRow({ route }: { route: CarrierRoute }) {
  const origAddr = useAddress(route.origin_lat, route.origin_lon);
  const destAddr = useAddress(route.destination_lat ?? route.origin_lat, route.destination_lon ?? route.origin_lon);
  return (
    <View className="bg-card border border-border rounded-2xl px-[14px] py-3">
      <View className="flex-row items-center gap-2 mb-[10px]">
        <MaterialCommunityIcons
          name={route.kind === "dedicated_window" ? "calendar-clock" : "map-marker-path"}
          size={14}
          color={T.emeraldDeep}
        />
        <Text className="text-[11px] tracking-[1px] text-inkMute font-bold uppercase">
          {route.kind === "dedicated_window" ? "Ventana dedicada" : "Ruta habitual"}
        </Text>
      </View>
      <View className="flex-row items-center">
        <View className="flex-row items-center gap-[6px] flex-1 min-w-0">
          <View className="w-[9px] h-[9px] rounded-full border-2 border-forest bg-card" />
          <Text className="text-[13px] text-ink font-medium flex-1" numberOfLines={1}>{origAddr}</Text>
        </View>
        <MaterialCommunityIcons name="dots-horizontal" size={16} color={T.inkFaint} />
        <View className="flex-row items-center gap-[6px] flex-1 min-w-0 justify-end">
          <Text className="text-[13px] text-ink font-medium flex-1 text-right" numberOfLines={1}>{destAddr}</Text>
          <View className="w-[9px] h-[9px] rounded-[2px] bg-emerald rotate-45" />
        </View>
      </View>
      {route.recurrence_days && (
        <Text className="text-[10px] tracking-[1px] text-inkMute uppercase mt-2">{route.recurrence_days.replace(/,/g, " · ")}</Text>
      )}
    </View>
  );
}

export default function RiderHomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const online = useRiderStore((s) => s.online);
  const shiftStartedAt = useRiderStore((s) => s.shiftStartedAt);
  const goOnline = useRiderStore((s) => s.goOnline);
  const goOffline = useRiderStore((s) => s.goOffline);
  const firstName = user?.first_name ?? "Cadete";

  const [carrier, setCarrier] = useState<Carrier | null>(null);
  const [summary, setSummary] = useState<CarrierSummary | null>(null);
  const [routes, setRoutes] = useState<CarrierRoute[]>([]);
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showPublish, setShowPublish] = useState(false);
  const [offer, setOffer] = useState<FeedItem | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [dismissed, setDismissed] = useState<number[]>([]);
  const [now, setNow] = useState(Date.now());

  useGpsPublisher(online && !!carrier?.is_verified);

  const loadFeed = useCallback(async () => {
    try {
      const items = await carriersService.getFeed();
      setFeed(items);
    } catch {
      setFeed([]);
    }
  }, []);

  const load = useCallback(async (asRefresh = false) => {
    if (asRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const profile = await carriersService.getMyProfile();
      setCarrier(profile);
      const [sum, mine] = await Promise.all([
        carriersService.getSummary().catch(() => null),
        routesService.mine().catch(() => [] as CarrierRoute[]),
      ]);
      setSummary(sum);
      setRoutes(mine);
      if (profile.is_verified && online) await loadFeed();
    } catch {
      setCarrier(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [online, loadFeed]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  // Poll the feed + tick the shift clock while online.
  useEffect(() => {
    if (!online || !carrier?.is_verified) return;
    loadFeed();
    const feedTimer = setInterval(loadFeed, 20_000);
    const clockTimer = setInterval(() => setNow(Date.now()), 30_000);
    return () => { clearInterval(feedTimer); clearInterval(clockTimer); };
  }, [online, carrier?.is_verified, loadFeed]);

  const visibleFeed = useMemo(() => feed.filter((f) => !dismissed.includes(f.shipment_id)), [feed, dismissed]);

  async function acceptOffer(item: FeedItem) {
    setAccepting(true);
    try {
      await shipmentsService.acceptShipment(item.shipment_id, item.route_id);
      setOffer(null);
      setFeed((f) => f.filter((x) => x.shipment_id !== item.shipment_id));
      Alert.alert("Pedido aceptado", "Aparece ahora en Viajes.", [
        { text: "Ver Viajes", onPress: () => router.push("/(main)/envios") },
        { text: "Seguir", style: "cancel" },
      ]);
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail;
      Alert.alert("No se pudo aceptar", typeof detail === "string" ? detail : "Intentá de nuevo.");
    } finally {
      setAccepting(false);
    }
  }

  function rejectOffer(item: FeedItem) {
    setDismissed((d) => [...d, item.shipment_id]);
    setOffer(null);
  }

  if (loading) {
    return (
      <View className="flex-1 bg-bg items-center justify-center" style={{ paddingTop: insets.top }}>
        <ActivityIndicator size="large" color={T.forest} />
      </View>
    );
  }

  // Verification gate — matches the feed screen behaviour.
  if (carrier && !carrier.is_verified) {
    return (
      <View className="flex-1 bg-bg items-center justify-center px-10 gap-[10px]" style={{ paddingTop: insets.top }}>
        <View className="w-[72px] h-[72px] rounded-[22px] bg-cardSoft items-center justify-center border border-border mb-1">
          <MaterialCommunityIcons name="shield-account-outline" size={34} color={T.inkMute} />
        </View>
        <Text className="text-base text-ink font-bold tracking-[-0.3px] text-center">Cuenta en verificación</Text>
        <Text className="text-[13px] text-inkMute text-center leading-[19px]">
          El equipo está revisando tu perfil. Cuando esté aprobado vas a poder trabajar.
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      {showPublish && <PublishTripScreen onClose={() => { setShowPublish(false); load(); }} />}
      {offer && (
        <IncomingOfferModal
          item={offer}
          accepting={accepting}
          onAccept={() => acceptOffer(offer)}
          onReject={() => rejectOffer(offer)}
        />
      )}

      {online ? (
        /* ─────────── ONLINE ─────────── */
        <View className="flex-1">
          {/* Map background */}
          <View className="absolute inset-0">
            <RiderMap />
          </View>

          {/* Top floating status */}
          <View className="absolute left-4 right-4 flex-row items-center justify-between" style={{ top: 12 }}>
            <View
              className="bg-forest rounded-[14px] flex-row items-center gap-2 pl-[11px] pr-3 py-[9px]"
              style={{ shadowColor: T.forest, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 6 }}
            >
              <View className="w-2 h-2 rounded-full bg-lime" />
              <View>
                <Text className="text-[9px] tracking-[1.2px] font-bold uppercase text-lime">En línea</Text>
                <Text className="text-[11px] text-[#F4EFE3] font-medium mt-px">{shiftLabel(shiftStartedAt, now)}</Text>
              </View>
            </View>
            <TouchableOpacity
              className="bg-red rounded-xl flex-row items-center gap-[6px] px-4 py-[10px]"
              onPress={goOffline}
              activeOpacity={0.85}
            >
              <MaterialCommunityIcons name="pause" size={14} color="#F4EFE3" />
              <Text className="text-[13px] font-semibold text-[#F4EFE3]">Pausar</Text>
            </TouchableOpacity>
          </View>

          {/* Bottom sheet */}
          <View
            className="absolute left-0 right-0 bottom-0 bg-bg rounded-t-[28px] px-4 pt-3"
            style={{ maxHeight: "62%", shadowColor: T.forest, shadowOffset: { width: 0, height: -16 }, shadowOpacity: 0.2, shadowRadius: 40, elevation: 12 }}
          >
            <View className="w-[38px] h-1 bg-border rounded-[3px] self-center mb-3" />

            {/* Earnings strip */}
            <View className="flex-row items-center justify-between mb-[14px] px-1">
              <View>
                <Text className="text-[9px] tracking-[1.5px] text-inkMute uppercase">Ganado (total)</Text>
                <Text className="text-[28px] font-bold text-ink tracking-[-0.9px] mt-px">
                  {summary ? money(summary.total_earnings) : "—"}
                </Text>
              </View>
              <View className="items-end">
                <Text className="text-[9px] tracking-[1.5px] text-inkMute uppercase">Entregas</Text>
                <Text className="text-[28px] font-bold text-ink tracking-[-0.9px] mt-px">
                  {summary ? summary.deliveries_completed : "—"}
                </Text>
              </View>
            </View>

            {/* Offers header */}
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-sm font-bold text-ink tracking-[-0.3px]">Pedidos cerca tuyo</Text>
              {visibleFeed.length > 0 && (
                <View className="flex-row items-center gap-1 bg-amberBg px-[7px] py-[3px] rounded-md">
                  <View className="w-[5px] h-[5px] rounded-full bg-amber" />
                  <Text className="text-amberDeep text-[9px] tracking-[1px] font-bold uppercase">
                    {visibleFeed.length} {visibleFeed.length === 1 ? "nuevo" : "nuevos"}
                  </Text>
                </View>
              )}
            </View>

            <ScrollView
              contentContainerStyle={{ gap: 8, paddingBottom: insets.bottom + 16 }}
              showsVerticalScrollIndicator={false}
            >
              {visibleFeed.length === 0 ? (
                <View className="items-center justify-center py-10 gap-2">
                  <MaterialCommunityIcons name="radar" size={30} color={T.inkMute} />
                  <Text className="text-[13px] text-inkMute text-center">Buscando pedidos que te queden de paso…</Text>
                </View>
              ) : (
                visibleFeed.map((item) => (
                  <OfferRow key={item.shipment_id} item={item} onPress={() => setOffer(item)} />
                ))
              )}
            </ScrollView>
          </View>
        </View>
      ) : (
        /* ─────────── OFFLINE ─────────── */
        <ScrollView
          contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={T.forest} />}
          showsVerticalScrollIndicator={false}
        >
          {/* Top bar */}
          <View className="px-5 pt-[6px] flex-row items-center justify-between">
            <View className="flex-row items-center gap-[10px]">
              <View className="w-[38px] h-[38px] rounded-xl bg-forest items-center justify-center">
                <Text className="text-[15px] font-bold text-[#F4EFE3]">{firstName.charAt(0).toUpperCase()}</Text>
              </View>
              <View>
                <Text className="text-[9px] tracking-[1.5px] text-inkMute uppercase">Modo cadete</Text>
                <Text className="text-[13px] text-ink font-semibold">{firstName}</Text>
              </View>
            </View>
            <TouchableOpacity
              className="w-[38px] h-[38px] rounded-xl border border-border bg-card items-center justify-center"
              onPress={() => router.push("/(main)/perfil")}
              accessibilityLabel="Perfil"
            >
              <MaterialCommunityIcons name="bell-outline" size={18} color={T.ink} />
            </TouchableOpacity>
          </View>

          {/* Hero */}
          <View className="px-4 pt-[14px]">
            <View className="bg-forest rounded-[24px] px-5 pt-[22px] pb-5 overflow-hidden">
              <View className="flex-row items-center gap-2 mb-[14px]">
                <View className="w-2 h-2 rounded-full bg-[#F4EFE3]/40" />
                <Text className="text-[10px] tracking-[2px] text-[#F4EFE3]/55 font-bold uppercase">Fuera de línea</Text>
              </View>
              <Text className="text-[30px] font-bold text-[#F4EFE3] tracking-[-1.2px] leading-[30px]">
                Listo cuando{"\n"}vos quieras.
              </Text>
              <Text className="text-[13px] text-[#F4EFE3]/65 mt-2 mb-[22px]">
                Activá disponibilidad o programá un viaje que vas a hacer igual.
              </Text>

              <TouchableOpacity
                className="bg-lime rounded-2xl py-4 flex-row items-center justify-center gap-[10px] mb-[10px]"
                style={{ shadowColor: T.lime, shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.45, shadowRadius: 26, elevation: 6 }}
                onPress={goOnline}
                activeOpacity={0.9}
              >
                <MaterialCommunityIcons name="play" size={20} color={T.forest} />
                <Text className="text-base font-bold text-forest tracking-[-0.3px]">Empezar a trabajar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="bg-[#F4EFE3]/10 border border-[#F4EFE3]/20 rounded-[14px] py-[14px] flex-row items-center justify-center gap-[10px]"
                onPress={() => setShowPublish(true)}
                activeOpacity={0.85}
              >
                <MaterialCommunityIcons name="map-marker-path" size={16} color="#F4EFE3" />
                <Text className="text-sm font-semibold text-[#F4EFE3]">Publicar un viaje que voy a hacer</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Stats */}
          <View className="px-4 pt-[14px]">
            <Text className="text-sm font-bold text-ink tracking-[-0.3px] mb-2">Tu resumen</Text>
            <View className="flex-row gap-2">
              <View className="flex-[1.4] bg-card border border-border rounded-2xl px-[14px] py-3">
                <Text className="text-[9px] tracking-[1.5px] text-inkMute uppercase">Ganado (total)</Text>
                <Text className="text-[26px] font-bold text-ink tracking-[-0.8px] mt-px">
                  {summary ? money(summary.total_earnings) : "—"}
                </Text>
              </View>
              <View className="flex-1 bg-card border border-border rounded-2xl px-[14px] py-3">
                <Text className="text-[9px] tracking-[1.5px] text-inkMute uppercase">Entregas</Text>
                <Text className="text-[26px] font-bold text-ink tracking-[-0.8px] mt-px">
                  {summary ? summary.deliveries_completed : "—"}
                </Text>
              </View>
              <View className="flex-1 bg-card border border-border rounded-2xl px-[14px] py-3">
                <Text className="text-[9px] tracking-[1.5px] text-inkMute uppercase">Reputación</Text>
                <Text className="text-[26px] font-bold text-ink tracking-[-0.8px] mt-px">
                  {summary ? summary.reputation.toFixed(1) : "—"}
                </Text>
              </View>
            </View>
          </View>

          {/* Published trips */}
          <View className="px-4 pt-4">
            <View className="flex-row items-baseline justify-between mb-2">
              <Text className="text-sm font-bold text-ink tracking-[-0.3px]">Tus viajes publicados</Text>
              <TouchableOpacity onPress={() => setShowPublish(true)} hitSlop={8}>
                <Text className="text-[10px] tracking-[1.5px] text-emeraldDeep uppercase font-bold">Publicar</Text>
              </TouchableOpacity>
            </View>
            {routes.filter((r) => r.is_active).length === 0 ? (
              <TouchableOpacity
                className="bg-card border border-border border-dashed rounded-2xl px-4 py-5 items-center gap-2"
                onPress={() => setShowPublish(true)}
                activeOpacity={0.85}
              >
                <MaterialCommunityIcons name="map-marker-plus-outline" size={26} color={T.inkMute} />
                <Text className="text-[13px] text-inkMute text-center">
                  Todavía no publicaste ningún viaje. Programá tu ruta habitual y recibí pedidos de paso.
                </Text>
              </TouchableOpacity>
            ) : (
              <View className="gap-2">
                {routes.filter((r) => r.is_active).map((r) => <TripRow key={r.id} route={r} />)}
              </View>
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );
}
