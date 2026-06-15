import { useCallback, useEffect, useState } from "react";
import { View, ScrollView, TouchableOpacity, ActivityIndicator, Alert, RefreshControl, StyleSheet } from "react-native";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { carriersService } from "@/src/services/carriers";
import { shipmentsService } from "@/src/services/shipments";
import { Carrier, DeliveryMode, FeedItem, PackageCategory } from "@/src/types";
import { reverseGeocode } from "@/src/utils/geocoding";
import { T } from "@/constants/tokens";
import PublishRouteScreen from "./PublishRouteScreen";

const SIZE_LABEL: Record<PackageCategory, string> = {
  [PackageCategory.S]:  "Pequeño",
  [PackageCategory.M]:  "Mediano",
  [PackageCategory.L]:  "Grande",
  [PackageCategory.XL]: "Flete",
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

function FeedCard({ item, onAccept, accepting }: { item: FeedItem; onAccept: () => void; accepting: boolean }) {
  const isCollab = item.modality === DeliveryMode.COLLABORATIVE;
  const origAddr = useAddress(item.origin_lat, item.origin_lon);
  const destAddr = useAddress(item.destination_lat, item.destination_lon);

  return (
    <View style={s.card}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Text style={s.cardId}>DP-{String(item.shipment_id).padStart(4, "0")}</Text>
          <View style={[s.modeTag, { backgroundColor: isCollab ? T.mint : T.amberBg }]}>
            <Text style={[s.modeTagText, { color: isCollab ? T.forest : T.amber }]}>
              {isCollab ? "COLABORATIVA" : "DEDICADA"}
            </Text>
          </View>
        </View>
        {item.estimated_price != null && (
          <Text style={s.price}>${item.estimated_price.toLocaleString("es-AR")}</Text>
        )}
      </View>

      <View style={{ gap: 6, marginBottom: 10 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, borderWidth: 1.8, borderColor: T.forest, backgroundColor: T.card }} />
          <Text style={s.addr} numberOfLines={1}>{origAddr}</Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <View style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: T.emerald, transform: [{ rotate: "45deg" }] }} />
          <Text style={s.addr} numberOfLines={1}>{destAddr}</Text>
        </View>
      </View>

      <View style={{ flexDirection: "row", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        <View style={s.chip}>
          <MaterialCommunityIcons name="package-variant" size={12} color={T.inkSoft} />
          <Text style={s.chipText}>{SIZE_LABEL[item.package_size]} · {item.weight_kg} kg</Text>
        </View>
        {item.detour_km != null && (
          <View style={s.chip}>
            <MaterialCommunityIcons name="swap-horizontal" size={12} color={T.inkSoft} />
            <Text style={s.chipText}>Desvío {item.detour_km.toFixed(1)} km</Text>
          </View>
        )}
        {item.distance_to_pickup_km != null && (
          <View style={s.chip}>
            <MaterialCommunityIcons name="map-marker-distance" size={12} color={T.inkSoft} />
            <Text style={s.chipText}>A {item.distance_to_pickup_km.toFixed(1)} km del retiro</Text>
          </View>
        )}
      </View>

      {/* Why this match (explainable assignment) */}
      {item.explanation.length > 0 && (
        <View style={s.whyBox}>
          <MaterialCommunityIcons name="information-outline" size={13} color={T.inkMute} style={{ marginTop: 1 }} />
          <Text style={s.whyText}>{item.explanation[item.explanation.length - 1]}</Text>
        </View>
      )}

      <TouchableOpacity style={s.acceptBtn} onPress={onAccept} disabled={accepting} activeOpacity={0.88}>
        {accepting
          ? <ActivityIndicator color={T.lime} size="small" />
          : <>
              <MaterialCommunityIcons name="check" size={16} color={T.lime} />
              <Text style={s.acceptText}>Aceptar pedido</Text>
            </>}
      </TouchableOpacity>
    </View>
  );
}

export default function FeedScreen() {
  const insets = useSafeAreaInsets();
  const [carrier, setCarrier] = useState<Carrier | null>(null);
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [acceptingId, setAcceptingId] = useState<number | null>(null);
  const [showRouteModal, setShowRouteModal] = useState(false);

  async function load(asRefresh = false) {
    if (asRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const profile = await carriersService.getMyProfile();
      setCarrier(profile);
      if (profile.is_verified) {
        setFeed(await carriersService.getFeed());
      }
    } catch {
      setCarrier(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useFocusEffect(useCallback(() => { load(); }, []));

  async function accept(item: FeedItem) {
    setAcceptingId(item.shipment_id);
    try {
      await shipmentsService.acceptShipment(item.shipment_id, item.route_id);
      Alert.alert("¡Pedido aceptado!", "Lo vas a ver en la pestaña Mis Viajes.");
      load();
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      Alert.alert("No se pudo aceptar", typeof detail === "string" ? detail : "Intentá de nuevo.");
    } finally {
      setAcceptingId(null);
    }
  }

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <View>
          <Text style={s.eyebrow}>PEDIDOS COMPATIBLES</Text>
          <Text style={s.title}>Para tu ruta</Text>
        </View>
        <TouchableOpacity
          style={s.routeBtn}
          onPress={() => setShowRouteModal(true)}
          hitSlop={10}
          accessibilityLabel="Publicar trayecto"
        >
          <MaterialCommunityIcons name="map-marker-path" size={20} color={T.forest} />
        </TouchableOpacity>
      </View>

      {showRouteModal && (
        <PublishRouteScreen onClose={() => setShowRouteModal(false)} />
      )}

      {loading ? (
        <View style={s.center}><ActivityIndicator size="large" color={T.forest} /></View>
      ) : carrier && !carrier.is_verified ? (
        <View style={s.center}>
          <MaterialCommunityIcons name="shield-account-outline" size={56} color={T.border} />
          <Text style={s.emptyTitle}>Cuenta en verificación</Text>
          <Text style={s.emptySub}>
            El equipo está revisando tu perfil de cadete. Cuando esté aprobado vas a poder aceptar pedidos.
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 14, gap: 10, paddingBottom: insets.bottom + 32 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={T.forest} />}
          showsVerticalScrollIndicator={false}
        >
          {feed.length === 0 ? (
            <View style={s.center}>
              <MaterialCommunityIcons name="radar" size={56} color={T.border} />
              <Text style={s.emptyTitle}>Sin pedidos por ahora</Text>
              <Text style={s.emptySub}>
                Publicá tu trayecto habitual desde Perfil para recibir pedidos que te queden de paso.
              </Text>
            </View>
          ) : (
            feed.map(item => (
              <FeedCard
                key={item.shipment_id}
                item={item}
                onAccept={() => accept(item)}
                accepting={acceptingId === item.shipment_id}
              />
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  header: { paddingHorizontal: 20, paddingTop: 6 },
  eyebrow: { fontSize: 10, letterSpacing: 2.5, color: T.inkMute, textTransform: "uppercase" },
  title: { fontSize: 26, fontWeight: "700", color: T.ink, letterSpacing: -0.8, marginTop: 4 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10, padding: 40 },
  emptyTitle: { fontSize: 15, color: T.inkMute, fontWeight: "600" },
  emptySub: { fontSize: 13, color: T.inkMute, textAlign: "center", lineHeight: 19 },

  card: { backgroundColor: T.card, borderRadius: 18, borderWidth: 1, borderColor: T.border, padding: 14 },
  cardId: { fontSize: 10, letterSpacing: 1.5, color: T.ink, fontWeight: "700" },
  modeTag: { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  modeTagText: { fontSize: 9, letterSpacing: 1, fontWeight: "700", textTransform: "uppercase" },
  price: { fontSize: 17, fontWeight: "700", color: T.ink, letterSpacing: -0.5 },
  addr: { flex: 1, fontSize: 13, color: T.ink, fontWeight: "500" },

  chip: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: T.cardSoft, borderWidth: 1, borderColor: T.borderSoft, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  chipText: { fontSize: 11, color: T.inkSoft, fontWeight: "500" },

  whyBox: { flexDirection: "row", gap: 6, backgroundColor: T.bg, borderRadius: 10, padding: 10, marginBottom: 12 },
  whyText: { flex: 1, fontSize: 11.5, color: T.inkSoft, lineHeight: 16 },

  acceptBtn: { backgroundColor: T.forest, borderRadius: 14, height: 46, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  acceptText: { color: "#F4EFE3", fontWeight: "600", fontSize: 14 },
});
