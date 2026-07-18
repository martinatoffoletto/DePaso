import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View, ScrollView, TouchableOpacity, ActivityIndicator, Alert, RefreshControl, Text } from "react-native";
import MapView, { Marker, Polyline, Region } from "react-native-maps";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import * as Location from "expo-location";
import { useAuthStore } from "@/src/shared/session/authStore";
import { useRiderStore } from "@/src/carrier/riderStore";
import { toast } from "@/src/shared/ui/toastStore";
import { carriersService, routesService } from "@/src/shared/api/carriers";
import { shipmentsService } from "@/src/shared/api/shipments";
import { Carrier, CarrierRoute, CarrierSummary, FeedItem, Shipment, ShipmentStatus } from "@/src/shared/types";
import { carrierPayout } from "@/src/shared/utils/payout";
import { T } from "@/constants/tokens";
import { IncomingOfferModal } from "./IncomingOfferModal";
import PublishTripScreen from "./PublishTripScreen";
import { useGpsPublisher } from "./useGpsPublisher";
import { ActiveJobPanel } from "./components/ActiveJobPanel";
import { OfferRow } from "./components/OfferRow";
import { TripRow } from "./components/TripRow";
import { money } from "./components/riderUi";

const ACTIVE_STATUSES: ShipmentStatus[] = [
  ShipmentStatus.ASSIGNED,
  ShipmentStatus.PICKUP_ARRIVED,
  ShipmentStatus.IN_TRANSIT,
];

const BA_REGION: Region = { latitude: -34.6037, longitude: -58.4173, latitudeDelta: 0.06, longitudeDelta: 0.06 };
const SPACE_WINDOW_HOURS = 4;

function shiftLabel(startedAt: number | null, now: number): string {
  if (!startedAt) return "recién arrancás";
  const mins = Math.max(0, Math.floor((now - startedAt) / 60000));
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}min activo` : `${m}min activo`;
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

  // El toggle "en línea" también vive en el backend (is_available): es lo que
  // mete al carrier en el pool on-demand del matching dedicado. Sin el sync,
  // el botón era puramente cosmético y ningún carrier real era matcheable.
  const setAvailability = useCallback((value: boolean) => {
    if (value) goOnline(); else goOffline();
    carriersService.updateProfile({ is_available: value }).catch(() => {
      // sin red: el estado local manda; el próximo load() reconcilia
    });
  }, [goOnline, goOffline]);

  const [carrier, setCarrier] = useState<Carrier | null>(null);
  const [summary, setSummary] = useState<CarrierSummary | null>(null);
  const [routes, setRoutes] = useState<CarrierRoute[]>([]);
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [activeJobs, setActiveJobs] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showPublish, setShowPublish] = useState(false);
  const [offer, setOffer] = useState<FeedItem | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [advancingId, setAdvancingId] = useState<number | null>(null);
  const [dismissed, setDismissed] = useState<number[]>([]);
  const [now, setNow] = useState(Date.now());
  const [region, setRegion] = useState<Region | null>(null);
  const [spaceSaving, setSpaceSaving] = useState(false);

  // Shipment ids already announced — new ones auto-open the incoming modal.
  const seenOffersRef = useRef<Set<number>>(new Set());
  const offerRef = useRef<FeedItem | null>(null);
  offerRef.current = offer;

  // Broadcast GPS while on shift or with deliveries in progress.
  useGpsPublisher((online || activeJobs.length > 0) && !!carrier?.is_verified);

  const loadFeed = useCallback(async () => {
    try {
      const items = await carriersService.getFeed();
      setFeed(items);
    } catch {
      setFeed([]);
    }
  }, []);

  const loadActive = useCallback(async () => {
    try {
      const list = await shipmentsService.getAssignedShipments(0, 50);
      setActiveJobs(list.filter((s) => ACTIVE_STATUSES.includes(s.status)));
    } catch {
      // keep previous state
    }
  }, []);

  const load = useCallback(async (asRefresh = false) => {
    if (asRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const profile = await carriersService.getMyProfile();
      setCarrier(profile);
      // Reconciliar disponibilidad: si la app se cerró estando "en línea",
      // el backend quedaba disponible para siempre.
      if (profile.is_available !== online) {
        carriersService.updateProfile({ is_available: online }).catch(() => {});
      }
      const [sum, mine] = await Promise.all([
        carriersService.getSummary().catch(() => null),
        routesService.mine().catch(() => [] as CarrierRoute[]),
      ]);
      setSummary(sum);
      setRoutes(mine);
      await loadActive();
      if (profile.is_verified && online) await loadFeed();
    } catch {
      setCarrier(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [online, loadFeed, loadActive]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  // Center the operational map on the rider as soon as they go online.
  useEffect(() => {
    if (!online) return;
    let alive = true;
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") { if (alive) setRegion(BA_REGION); return; }
        const pos = await Location.getLastKnownPositionAsync()
          ?? await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        if (alive && pos) {
          setRegion({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            latitudeDelta: 0.035,
            longitudeDelta: 0.035,
          });
        } else if (alive) {
          setRegion(BA_REGION);
        }
      } catch {
        if (alive) setRegion(BA_REGION);
      }
    })();
    return () => { alive = false; };
  }, [online]);

  // Poll the feed + tick the shift clock while online.
  useEffect(() => {
    if (!online || !carrier?.is_verified) return;
    loadFeed();
    const feedTimer = setInterval(loadFeed, 20_000);
    const clockTimer = setInterval(() => setNow(Date.now()), 30_000);
    return () => { clearInterval(feedTimer); clearInterval(clockTimer); };
  }, [online, carrier?.is_verified, loadFeed]);

  const visibleFeed = useMemo(() => feed.filter((f) => !dismissed.includes(f.shipment_id)), [feed, dismissed]);

  // Uber-style incoming request: a brand-new compatible shipment pops the
  // modal over the map instead of waiting for the rider to find it in a list.
  useEffect(() => {
    if (!online) return;
    const fresh = visibleFeed.filter((f) => !seenOffersRef.current.has(f.shipment_id));
    visibleFeed.forEach((f) => seenOffersRef.current.add(f.shipment_id));
    if (fresh.length > 0 && offerRef.current == null) {
      setOffer(fresh[0]);
    }
  }, [visibleFeed, online]);

  // "Dedicado por espacio": derived from the routes themselves — an active
  // dedicated window covering this moment means the toggle is on.
  const spaceRoute = useMemo(() => routes.find((r) =>
    r.kind === "dedicated_window" && r.is_active &&
    new Date(r.window_start).getTime() <= now && now <= new Date(r.window_end).getTime(),
  ) ?? null, [routes, now]);

  const usedKg = useMemo(() => activeJobs.reduce((acc, s) => acc + s.weight_kg, 0), [activeJobs]);
  const freeKg = carrier ? Math.max(0, carrier.capacity_kg - usedKg) : 0;

  async function toggleSpaceMode() {
    if (spaceSaving) return;
    setSpaceSaving(true);
    try {
      if (spaceRoute) {
        await routesService.deactivate(spaceRoute.id);
        setRoutes((r) => r.filter((x) => x.id !== spaceRoute.id));
        toast.info("Dedicado por espacio desactivado.");
      } else {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          toast.error("Necesitamos tu ubicación para publicar tu disponibilidad por espacio.");
          return;
        }
        const pos = await Location.getLastKnownPositionAsync()
          ?? await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        if (!pos) {
          toast.error("No pudimos obtener tu ubicación. Intentá de nuevo.");
          return;
        }
        const start = new Date();
        const end = new Date(start.getTime() + SPACE_WINDOW_HOURS * 3600 * 1000);
        const route = await routesService.publish({
          kind: "dedicated_window",
          origin_lat: pos.coords.latitude,
          origin_lon: pos.coords.longitude,
          window_start: start.toISOString(),
          window_end: end.toISOString(),
        });
        setRoutes((r) => [...r, route]);
        toast.success(`Disponible por espacio durante ${SPACE_WINDOW_HOURS} h. Te llegan pedidos compatibles con tu capacidad.`);
      }
    } catch {
      toast.error("No se pudo actualizar tu disponibilidad por espacio.");
    } finally {
      setSpaceSaving(false);
    }
  }

  async function acceptOffer(item: FeedItem) {
    setAccepting(true);
    try {
      await shipmentsService.acceptShipment(item.shipment_id, item.route_id);
      setOffer(null);
      setFeed((f) => f.filter((x) => x.shipment_id !== item.shipment_id));
      await loadActive();
      if (!online) setAvailability(true);
      toast.success("Pedido aceptado — gestionalo desde el mapa.");
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

  async function advance(shipment: Shipment, next: ShipmentStatus) {
    setAdvancingId(shipment.id);
    try {
      let coords: { lat: number; lon: number } | undefined;
      try {
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        coords = { lat: pos.coords.latitude, lon: pos.coords.longitude };
      } catch {}
      await shipmentsService.updateStatus(shipment.id, next, coords);
      await loadActive();
      if (next === ShipmentStatus.DELIVERED) {
        carriersService.getSummary().then(setSummary).catch(() => {});
        // Lo que el carrier cobra es el precio menos la comisión (igual que
        // total_earnings del backend) — mostrar el bruto era engañoso.
        toast.success(shipment.estimated_price != null
          ? `Entrega completada 🎉 Sumaste ${money(carrierPayout(shipment.estimated_price))}.`
          : "Entrega completada 🎉");
      }
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail;
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
              await loadActive();
            } catch {
              Alert.alert("Error", "No se pudo cancelar.");
            }
          },
        },
      ],
    );
  }

  if (loading) {
    return (
      <View className="flex-1 bg-bg items-center justify-center" style={{ paddingTop: insets.top }}>
        <ActivityIndicator size="large" color={T.forest} />
      </View>
    );
  }

  // El perfil se crea junto con el registro (antes de autenticar la sesión),
  // así que si no cargó fue un error puntual (red, backend) — reintentar alcanza.
  if (!carrier) {
    return (
      <View className="flex-1 bg-bg items-center justify-center px-10 gap-[10px]" style={{ paddingTop: insets.top }}>
        <View className="w-[72px] h-[72px] rounded-[22px] bg-cardSoft items-center justify-center border border-border mb-1">
          <MaterialCommunityIcons name="alert-circle-outline" size={34} color={T.inkMute} />
        </View>
        <Text className="text-base text-ink font-bold tracking-[-0.3px] text-center">No pudimos cargar tu perfil</Text>
        <Text className="text-[13px] text-inkMute text-center leading-[19px]">
          Revisá tu conexión e intentá de nuevo.
        </Text>
        <TouchableOpacity
          className="bg-forest rounded-2xl px-6 h-[46px] items-center justify-center mt-2"
          onPress={() => load()}
          activeOpacity={0.88}
        >
          <Text className="text-[#F4EFE3] font-bold text-[14px]">Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Verification gate — matches the feed screen behaviour.
  if (!carrier.is_verified) {
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
    <View className="flex-1 bg-bg">
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
        /* ─────────── ONLINE · OPERATIONAL MAP ─────────── */
        <View className="flex-1">
          {/* Real interactive map — rider position, offers and active routes */}
          <View className="absolute inset-0">
            <MapView
              style={{ flex: 1 }}
              region={region ?? BA_REGION}
              onRegionChangeComplete={setRegion}
              showsUserLocation
              showsMyLocationButton={false}
              toolbarEnabled={false}
            >
              {visibleFeed.map((item) => (
                <Marker
                  key={`offer-${item.shipment_id}`}
                  coordinate={{ latitude: item.origin_lat, longitude: item.origin_lon }}
                  pinColor={T.amber}
                  onPress={() => setOffer(item)}
                />
              ))}
              {activeJobs.flatMap((job) => [
                <Marker key={`job-o-${job.id}`} coordinate={{ latitude: job.origin_lat, longitude: job.origin_lon }} pinColor={T.forest} />,
                <Marker key={`job-d-${job.id}`} coordinate={{ latitude: job.destination_lat, longitude: job.destination_lon }} pinColor={T.emerald} />,
                <Polyline
                  key={`job-l-${job.id}`}
                  coordinates={[
                    { latitude: job.origin_lat, longitude: job.origin_lon },
                    { latitude: job.destination_lat, longitude: job.destination_lon },
                  ]}
                  strokeColor={T.forest}
                  strokeWidth={3}
                  lineDashPattern={[8, 5]}
                />,
              ])}
            </MapView>
          </View>

          {/* Top floating status */}
          <View className="absolute left-4 right-4" style={{ top: insets.top + 8 }}>
            <View className="flex-row items-center justify-between">
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
                onPress={() => setAvailability(false)}
                activeOpacity={0.85}
              >
                <MaterialCommunityIcons name="pause" size={14} color="#F4EFE3" />
                <Text className="text-[13px] font-semibold text-[#F4EFE3]">Pausar</Text>
              </TouchableOpacity>
            </View>

            {/* "Dedicado por espacio" toggle — keeps taking chained orders */}
            <TouchableOpacity
              className={`self-start mt-2 flex-row items-center gap-2 rounded-[12px] px-3 py-2 border-[1.2px] ${spaceRoute ? "bg-forest border-forest" : "bg-card border-border"}`}
              style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 10, elevation: 4 }}
              onPress={toggleSpaceMode}
              disabled={spaceSaving}
              activeOpacity={0.85}
            >
              {spaceSaving ? (
                <ActivityIndicator size={12} color={spaceRoute ? T.lime : T.forest} />
              ) : (
                <MaterialCommunityIcons name="truck-cargo-container" size={14} color={spaceRoute ? T.lime : T.inkSoft} />
              )}
              <Text className={`text-[11.5px] font-bold ${spaceRoute ? "text-[#F4EFE3]" : "text-inkSoft"}`}>
                Dedicado por espacio {spaceRoute ? "ON" : "OFF"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Bottom sheet */}
          <View
            className="absolute left-0 right-0 bottom-0 bg-bg rounded-t-[28px] px-4 pt-3"
            style={{ maxHeight: "58%", shadowColor: T.forest, shadowOffset: { width: 0, height: -16 }, shadowOpacity: 0.2, shadowRadius: 40, elevation: 12 }}
          >
            <View className="w-[38px] h-1 bg-border rounded-[3px] self-center mb-3" />

            {/* Earnings + capacity strip */}
            <View className="flex-row items-center justify-between mb-3 px-1">
              <View>
                <Text className="text-[9px] tracking-[1.5px] text-inkMute uppercase font-bold">Ganado (total)</Text>
                <Text className="text-[24px] font-bold text-ink tracking-[-0.8px] mt-px">
                  {summary ? money(summary.total_earnings) : "—"}
                </Text>
              </View>
              <View className="items-center">
                <Text className="text-[9px] tracking-[1.5px] text-inkMute uppercase font-bold">En curso</Text>
                <Text className="text-[24px] font-bold text-ink tracking-[-0.8px] mt-px">{activeJobs.length}</Text>
              </View>
              {carrier && (
                <View className="items-end">
                  <Text className="text-[9px] tracking-[1.5px] text-inkMute uppercase font-bold">Capacidad libre</Text>
                  <Text className="text-[24px] font-bold tracking-[-0.8px] mt-px" style={{ color: freeKg > 0 ? T.ink : T.red }}>
                    {freeKg.toFixed(0)}<Text className="text-[13px] text-inkMute font-semibold"> / {carrier.capacity_kg.toFixed(0)} kg</Text>
                  </Text>
                </View>
              )}
            </View>

            <ScrollView
              contentContainerStyle={{ gap: 8, paddingBottom: insets.bottom + 16 }}
              showsVerticalScrollIndicator={false}
            >
              {/* Active deliveries — managed right here, on the map */}
              {activeJobs.length > 0 && (
                <>
                  <View className="flex-row items-center gap-2 px-1">
                    <View className="w-[7px] h-[7px] rounded-full bg-emerald" />
                    <Text className="text-[9.5px] tracking-[2px] text-inkMute uppercase font-bold">
                      EN CURSO · TRANSMITIENDO UBICACIÓN
                    </Text>
                  </View>
                  {activeJobs.map((job) => (
                    <ActiveJobPanel
                      key={job.id}
                      shipment={job}
                      advancing={advancingId === job.id}
                      onAdvance={(next) => advance(job, next)}
                      onCancel={() => bail(job)}
                    />
                  ))}
                </>
              )}

              {/* Offers */}
              <View className="flex-row items-center justify-between mt-1">
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

              {visibleFeed.length === 0 ? (
                <View className="items-center justify-center py-8 gap-2">
                  <MaterialCommunityIcons name="radar" size={30} color={T.inkMute} />
                  <Text className="text-[13px] text-inkMute text-center">
                    {activeJobs.length > 0
                      ? "Buscando pedidos que encadenen con tu recorrido…"
                      : "Buscando pedidos que te queden de paso…"}
                  </Text>
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
          contentContainerStyle={{ paddingTop: insets.top, paddingBottom: insets.bottom + 24 }}
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

          {/* Deliveries still in progress — jump back to the operational map */}
          {activeJobs.length > 0 && (
            <View className="px-4 pt-3">
              <TouchableOpacity
                className="bg-amberBg border-[1.2px] border-amber rounded-2xl px-4 py-[14px] flex-row items-center gap-3"
                onPress={() => setAvailability(true)}
                activeOpacity={0.85}
              >
                <MaterialCommunityIcons name="map-marker-radius-outline" size={22} color={T.amberDeep} />
                <View className="flex-1">
                  <Text className="text-[13.5px] font-bold text-amberDeep">
                    Tenés {activeJobs.length} {activeJobs.length === 1 ? "entrega" : "entregas"} en curso
                  </Text>
                  <Text className="text-[11.5px] text-amberDeep mt-px">Abrí el mapa operativo para gestionarlas.</Text>
                </View>
                <MaterialCommunityIcons name="arrow-right" size={18} color={T.amberDeep} />
              </TouchableOpacity>
            </View>
          )}

          {/* Hero */}
          <View className="px-4 pt-[14px]">
            <View className="bg-forest rounded-[24px] px-5 pt-[22px] pb-5 overflow-hidden">
              <View className="flex-row items-center gap-2 mb-[14px]">
                <View className="w-2 h-2 rounded-full bg-[#F4EFE3]/60" />
                <Text className="text-[10px] tracking-[2px] text-[#F4EFE3]/85 font-bold uppercase">Fuera de línea</Text>
              </View>
              <Text className="text-[30px] font-bold text-[#F4EFE3] tracking-[-1.2px] leading-[30px]">
                Listo cuando{"\n"}vos quieras.
              </Text>
              <Text className="text-[13px] text-[#F4EFE3]/85 mt-2 mb-[22px]">
                Activá disponibilidad o programá un viaje que vas a hacer igual.
              </Text>

              <TouchableOpacity
                className="bg-lime rounded-2xl py-4 flex-row items-center justify-center gap-[10px] mb-[10px]"
                style={{ shadowColor: T.lime, shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.45, shadowRadius: 26, elevation: 6 }}
                onPress={() => setAvailability(true)}
                activeOpacity={0.9}
              >
                <MaterialCommunityIcons name="play" size={20} color={T.forest} />
                <Text className="text-base font-bold text-forest tracking-[-0.3px]">Empezar a trabajar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="bg-[#F4EFE3]/10 border border-[#F4EFE3]/30 rounded-[14px] py-[14px] flex-row items-center justify-center gap-[10px]"
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
