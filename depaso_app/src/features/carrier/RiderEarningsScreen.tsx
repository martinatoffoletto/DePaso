import { useCallback, useState } from "react";
import { View, ScrollView, ActivityIndicator, RefreshControl, Text } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { carriersService } from "@/src/services/carriers";
import { shipmentsService } from "@/src/services/shipments";
import { CarrierSummary, PackageCategory, Shipment, ShipmentStatus } from "@/src/types";
import { T } from "@/constants/tokens";
import { PACKAGE_LABEL_SHORT } from "@/src/utils/packageCategory";

const SIZE_LABEL = PACKAGE_LABEL_SHORT;

function money(n: number): string {
  return `$${Math.round(n).toLocaleString("es-AR")}`;
}

export default function RiderEarningsScreen() {
  const insets = useSafeAreaInsets();
  const [summary, setSummary] = useState<CarrierSummary | null>(null);
  const [delivered, setDelivered] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (asRefresh = false) => {
    if (asRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const [sum, list] = await Promise.all([
        carriersService.getSummary(),
        shipmentsService.getAssignedShipments().catch(() => [] as Shipment[]),
      ]);
      setSummary(sum);
      setDelivered(list.filter((s) => s.status === ShipmentStatus.DELIVERED));
    } catch {
      setSummary(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (loading) {
    return (
      <View className="flex-1 bg-bg items-center justify-center" style={{ paddingTop: insets.top }}>
        <ActivityIndicator size="large" color={T.forest} />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={T.forest} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero — total earnings */}
        <View className="px-4 pt-3">
          <View className="bg-forest rounded-[24px] px-5 pt-5 pb-[22px] overflow-hidden">
            <Text className="text-[10px] tracking-[2px] text-[#F4EFE3]/55 uppercase font-bold">Ganado en total</Text>
            <Text className="text-[44px] font-bold text-lime tracking-[-2px] leading-[46px] mt-1">
              {summary ? money(summary.total_earnings) : "—"}
            </Text>
            <View className="flex-row items-center gap-2 mt-3">
              <View className="flex-row items-center gap-[5px] bg-[#F4EFE3]/10 px-[9px] py-1 rounded-lg">
                <MaterialCommunityIcons name="package-variant-closed" size={12} color="#F4EFE3" />
                <Text className="text-[11px] text-[#F4EFE3] font-semibold">
                  {summary ? summary.deliveries_completed : 0} entregas
                </Text>
              </View>
              <View className="flex-row items-center gap-[5px] bg-[#F4EFE3]/10 px-[9px] py-1 rounded-lg">
                <MaterialCommunityIcons name="leaf" size={12} color={T.lime} />
                <Text className="text-[11px] text-[#F4EFE3] font-semibold">
                  {summary ? summary.total_co2_saved_kg.toFixed(0) : 0} kg CO₂
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Stat tiles */}
        <View className="px-4 pt-[14px]">
          <View className="flex-row gap-2">
            <View className="flex-1 bg-card border border-border rounded-2xl px-[14px] py-3">
              <MaterialCommunityIcons name="star-outline" size={16} color={T.amber} />
              <Text className="text-[22px] font-bold text-ink tracking-[-0.6px] mt-1">
                {summary ? summary.reputation.toFixed(1) : "—"}
              </Text>
              <Text className="text-[9px] tracking-[1.5px] text-inkMute uppercase mt-px">Reputación</Text>
            </View>
            <View className="flex-1 bg-card border border-border rounded-2xl px-[14px] py-3">
              <MaterialCommunityIcons name="moped-outline" size={16} color={T.emeraldDeep} />
              <Text className="text-[22px] font-bold text-ink tracking-[-0.6px] mt-1">
                {summary ? summary.active_shipments : "—"}
              </Text>
              <Text className="text-[9px] tracking-[1.5px] text-inkMute uppercase mt-px">En curso</Text>
            </View>
            <View className="flex-1 bg-card border border-border rounded-2xl px-[14px] py-3">
              <MaterialCommunityIcons name="cash-multiple" size={16} color={T.forest} />
              <Text className="text-[22px] font-bold text-ink tracking-[-0.6px] mt-1">
                {summary && summary.deliveries_completed > 0
                  ? money(summary.total_earnings / summary.deliveries_completed)
                  : "—"}
              </Text>
              <Text className="text-[9px] tracking-[1.5px] text-inkMute uppercase mt-px">Promedio</Text>
            </View>
          </View>
        </View>

        {/* Recent delivered payments */}
        <View className="px-4 pt-5">
          <Text className="text-sm font-bold text-ink tracking-[-0.3px] mb-2">Cobros recientes</Text>
          {delivered.length === 0 ? (
            <View className="bg-card border border-border rounded-2xl px-4 py-6 items-center gap-2">
              <MaterialCommunityIcons name="wallet-outline" size={28} color={T.inkMute} />
              <Text className="text-[13px] text-inkMute text-center">
                Todavía no tenés cobros. Completá entregas para verlas acá.
              </Text>
            </View>
          ) : (
            <View className="gap-2">
              {delivered.map((sh) => (
                <View key={sh.id} className="flex-row items-center gap-3 bg-card border border-borderSoft rounded-[14px] p-[14px]">
                  <View className="w-9 h-9 rounded-xl bg-mint items-center justify-center">
                    <MaterialCommunityIcons name="check" size={16} color={T.forest} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-[10px] tracking-[1.5px] text-inkMute font-bold">DP-{String(sh.id).padStart(4, "0")}</Text>
                    <Text className="text-[12px] text-inkMute mt-px">{SIZE_LABEL[sh.package_size]} · Entregado</Text>
                  </View>
                  {sh.estimated_price != null && (
                    <Text className="text-sm font-bold text-emeraldDeep">+{money(sh.estimated_price)}</Text>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
