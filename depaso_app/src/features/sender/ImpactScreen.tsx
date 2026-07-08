import { useCallback, useEffect, useState } from "react";
import { View, ScrollView, RefreshControl, ActivityIndicator } from "react-native";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { co2Service } from "@/src/services";
import { ClientImpact } from "@/src/types";
import { T } from "@/constants/tokens";

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>["name"];

function EquivalenceCard({ icon, value, unit, label }: {
  icon: IconName; value: string; unit: string; label: string;
}) {
  return (
    <View className="flex-1 bg-card rounded-[18px] border border-border p-4 gap-[6px]">
      <View className="w-9 h-9 rounded-[10px] bg-mint items-center justify-center">
        <MaterialCommunityIcons name={icon} size={20} color={T.forest} />
      </View>
      <Text className="text-[22px] font-bold text-ink tracking-[-0.5px] mt-1">
        {value}<Text className="text-[13px] font-medium text-inkMute"> {unit}</Text>
      </Text>
      <Text className="text-[11.5px] text-inkMute">{label}</Text>
    </View>
  );
}

export default function ImpactScreen() {
  const insets = useSafeAreaInsets();
  const [impact, setImpact] = useState<ClientImpact | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    try {
      setError(false);
      setImpact(await co2Service.getMyImpact());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = () => { setRefreshing(true); load(); };

  if (loading) {
    return (
      <View className="flex-1 bg-bg justify-center items-center">
        <ActivityIndicator color={T.forest} size="large" />
      </View>
    );
  }

  const kg = impact?.total_co2_saved_kg ?? 0;
  const eq = impact?.equivalences;
  const collaborativeShare = impact && impact.shipments_delivered > 0
    ? impact.shipments_collaborative / impact.shipments_delivered
    : 0;

  return (
    <ScrollView
      className="flex-1 bg-bg"
      contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={T.forest} />}
      showsVerticalScrollIndicator={false}
    >
      <View className="flex-row items-center justify-between px-5 pb-[6px]" style={{ paddingTop: insets.top + 6 }}>
        <Text className="text-[22px] font-bold text-ink tracking-[-0.6px]">Impacto ambiental</Text>
      </View>

      {error && (
        <View className="flex-row items-center gap-2 mx-4 mt-2 bg-redBg rounded-xl p-3">
          <MaterialCommunityIcons name="wifi-off" size={16} color={T.red} />
          <Text className="flex-1 text-xs text-red font-medium">No pudimos actualizar tus datos. Deslizá para reintentar.</Text>
        </View>
      )}

      {/* Hero: total CO2 saved */}
      <View className="m-4 mt-[14px] rounded-3xl bg-forest p-[22px] overflow-hidden">
        <View className="flex-row items-center gap-[5px] self-start bg-lime/15 border border-lime/30 px-2 py-[3px] rounded-md">
          <MaterialCommunityIcons name="leaf" size={12} color={T.lime} />
          <Text className="text-[9px] tracking-[1.2px] text-lime font-bold">CO₂ EVITADO CON TUS ENVÍOS</Text>
        </View>
        <Text className="text-5xl font-extrabold text-[#F4EFE3] tracking-[-1.5px] mt-3">
          {kg.toFixed(2)}<Text className="text-xl font-medium text-[#F4EFE3]/70"> kg</Text>
        </Text>
        <Text className="text-[12.5px] leading-[18px] text-[#F4EFE3]/70 mt-[6px]">
          Cada envío colaborativo aprovecha un viaje que ya iba a hacerse,
          en lugar de generar un viaje dedicado nuevo.
        </Text>
        <View className="flex-row mt-5">
          <View className="flex-1 border-r border-[#F4EFE3]/[0.12] pr-[10px] mr-[14px]">
            <Text className="text-xl font-bold text-[#F4EFE3] tracking-[-0.5px]">{impact?.shipments_delivered ?? 0}</Text>
            <Text className="text-[9px] tracking-[1.3px] text-[#F4EFE3]/80 mt-[2px]">ENTREGADOS</Text>
          </View>
          <View className="flex-1 border-r border-[#F4EFE3]/[0.12] pr-[10px] mr-[14px]">
            <Text className="text-xl font-bold text-[#F4EFE3] tracking-[-0.5px]">{impact?.shipments_collaborative ?? 0}</Text>
            <Text className="text-[9px] tracking-[1.3px] text-[#F4EFE3]/80 mt-[2px]">COLABORATIVOS</Text>
          </View>
          <View className="flex-1">
            <Text className="text-xl font-bold text-lime tracking-[-0.5px]">{(collaborativeShare * 100).toFixed(0)}%</Text>
            <Text className="text-[9px] tracking-[1.3px] text-[#F4EFE3]/80 mt-[2px]">ECO</Text>
          </View>
        </View>
      </View>

      {/* Equivalences */}
      <Text className="text-[10px] font-bold tracking-[2px] text-inkMute uppercase mx-5 mt-[18px] mb-2">ESO EQUIVALE A…</Text>
      <View className="flex-row gap-[10px] mx-4">
        <EquivalenceCard
          icon="car-hatchback"
          value={(eq?.car_km ?? 0).toFixed(1)}
          unit="km"
          label="no recorridos en auto"
        />
        <EquivalenceCard
          icon="tree-outline"
          value={(eq?.tree_months ?? 0).toFixed(1)}
          unit="meses"
          label="de absorción de un árbol"
        />
      </View>
      <View className="flex-row gap-[10px] mx-4 mt-[10px]">
        <EquivalenceCard
          icon="cellphone-charging"
          value={String(eq?.smartphone_charges ?? 0)}
          unit="cargas"
          label="completas de celular"
        />
        <View className="flex-1 bg-cardSoft rounded-[18px] border border-border p-4 gap-[6px] justify-center items-start">
          <MaterialCommunityIcons name="information-outline" size={18} color={T.inkMute} />
          <Text className="text-[11px] leading-[15px] text-inkMute">
            Calculado con factores IPCC al confirmar cada envío
          </Text>
        </View>
      </View>

      {/* How it works */}
      <Text className="text-[10px] font-bold tracking-[2px] text-inkMute uppercase mx-5 mt-[18px] mb-2">CÓMO LO CALCULAMOS</Text>
      <View className="mx-4 bg-card rounded-[18px] border border-border overflow-hidden">
        <View className="flex-row items-center gap-3 px-4 py-[13px]">
          <View className="w-8 h-8 rounded-[9px] bg-cardSoft border border-borderSoft items-center justify-center">
            <MaterialCommunityIcons name="truck-fast-outline" size={16} color={T.inkSoft} />
          </View>
          <View className="flex-1">
            <Text className="text-[13px] font-semibold text-ink">Escenario sin DePaso</Text>
            <Text className="text-[11.5px] text-inkMute mt-px">Un viaje dedicado exclusivo para tu paquete</Text>
          </View>
        </View>
        <View className="h-px bg-borderSoft ml-[60px]" />
        <View className="flex-row items-center gap-3 px-4 py-[13px]">
          <View className="w-8 h-8 rounded-[9px] bg-mint border border-borderSoft items-center justify-center">
            <MaterialCommunityIcons name="map-marker-path" size={16} color={T.forest} />
          </View>
          <View className="flex-1">
            <Text className="text-[13px] font-semibold text-ink">Escenario con DePaso</Text>
            <Text className="text-[11.5px] text-inkMute mt-px">Solo el desvío extra de un trayecto que ya existía</Text>
          </View>
        </View>
        <View className="h-px bg-borderSoft ml-[60px]" />
        <View className="flex-row items-center gap-3 px-4 py-[13px]">
          <View className="w-8 h-8 rounded-[9px] bg-mint border border-borderSoft items-center justify-center">
            <MaterialCommunityIcons name="leaf" size={16} color={T.forest} />
          </View>
          <View className="flex-1">
            <Text className="text-[13px] font-semibold text-ink">Tu ahorro</Text>
            <Text className="text-[11.5px] text-inkMute mt-px">La diferencia entre ambos, sumada envío a envío</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
