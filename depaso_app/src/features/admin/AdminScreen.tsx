import { useCallback, useEffect, useState } from "react";
import {
  View, ScrollView, RefreshControl,
  ActivityIndicator, TouchableOpacity, Alert,
} from "react-native";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { adminService } from "@/src/services/admin";
import { AdminActivity, AdminDashboard, Carrier, ModerationAction, SystemStatus } from "@/src/types";
import { T } from "@/constants/tokens";

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>["name"];

const VEHICLE_LABELS: Record<string, string> = {
  pedestrian: "A pie",
  bike: "Bicicleta",
  motorcycle: "Moto",
  car: "Auto",
  van: "Camioneta",
  truck: "Camión",
};

function MetricCard({ icon, value, label, accent = false }: {
  icon: IconName; value: string; label: string; accent?: boolean;
}) {
  return (
    <View className="flex-1 bg-card rounded-[18px] border border-border p-[14px] gap-1">
      <View className={`w-[34px] h-[34px] rounded-[10px] items-center justify-center ${accent ? "bg-mint" : "bg-cardSoft border border-borderSoft"}`}>
        <MaterialCommunityIcons name={icon} size={18} color={accent ? T.forest : T.inkSoft} />
      </View>
      <Text className="text-[21px] font-bold text-ink tracking-[-0.5px] mt-1">{value}</Text>
      <Text className="text-[11px] text-inkMute">{label}</Text>
    </View>
  );
}

function PendingCarrierCard({ carrier, onModerate, busy }: {
  carrier: Carrier;
  onModerate: (id: number, action: ModerationAction) => void;
  busy: boolean;
}) {
  return (
    <View className="bg-card rounded-2xl border border-border p-[14px]">
      <View className="flex-row items-center gap-3">
        <View className="w-[38px] h-[38px] rounded-[10px] bg-amberBg items-center justify-center">
          <MaterialCommunityIcons name="truck-outline" size={18} color={T.amber} />
        </View>
        <View className="flex-1 min-w-0">
          <Text className="text-sm font-bold text-ink tracking-[-0.2px]" numberOfLines={1}>{carrier.company_name}</Text>
          <Text className="text-[11.5px] text-inkMute mt-[2px]">
            {VEHICLE_LABELS[carrier.vehicle_type] ?? carrier.vehicle_type} · {carrier.license_plate} · {carrier.capacity_kg} kg
          </Text>
        </View>
      </View>
      <View className="flex-row gap-2 mt-3">
        <TouchableOpacity
          className="flex-1 flex-row items-center justify-center gap-[6px] rounded-[11px] py-[10px] bg-forest"
          style={busy ? { opacity: 0.5 } : undefined}
          disabled={busy}
          onPress={() => onModerate(carrier.id, "verify")}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="check-decagram-outline" size={15} color="#F4EFE3" />
          <Text className="text-[13px] font-bold text-[#F4EFE3]">Verificar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-1 flex-row items-center justify-center gap-[6px] rounded-[11px] py-[10px] border border-border bg-cardSoft"
          style={busy ? { opacity: 0.5 } : undefined}
          disabled={busy}
          onPress={() =>
            Alert.alert("Suspender cadete", `¿Suspender a "${carrier.company_name}"?`, [
              { text: "Cancelar", style: "cancel" },
              { text: "Suspender", style: "destructive", onPress: () => onModerate(carrier.id, "suspend") },
            ])
          }
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="cancel" size={15} color={T.red} />
          <Text className="text-[13px] font-semibold text-red">Suspender</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function StatusRow({ label, ok, value }: { label: string; ok: boolean; value: string }) {
  return (
    <View className="flex-row items-center gap-3 px-4 py-[13px]">
      <View className="w-[9px] h-[9px] rounded-full" style={{ backgroundColor: ok ? T.emerald : T.red }} />
      <Text className="flex-1 text-[13px] text-ink font-medium">{label}</Text>
      <Text className="text-[12px] font-semibold" style={{ color: ok ? T.forest : T.red }}>{value}</Text>
    </View>
  );
}

export default function AdminScreen() {
  const insets = useSafeAreaInsets();
  const [dashboard, setDashboard] = useState<AdminDashboard | null>(null);
  const [pending, setPending] = useState<Carrier[]>([]);
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [activity, setActivity] = useState<AdminActivity | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const [moderatingId, setModeratingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      setError(false);
      const [dash, carriers, sys, act] = await Promise.all([
        adminService.getDashboard(),
        adminService.getPendingCarriers(),
        adminService.getStatus().catch(() => null),
        adminService.getActivity(10).catch(() => null),
      ]);
      setDashboard(dash);
      setPending(carriers);
      setStatus(sys);
      setActivity(act);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = () => { setRefreshing(true); load(); };

  const moderate = async (carrierId: number, action: ModerationAction) => {
    setModeratingId(carrierId);
    try {
      await adminService.moderateCarrier(carrierId, action);
      setPending((prev) => prev.filter((c) => c.id !== carrierId));
      const dash = await adminService.getDashboard();
      setDashboard(dash);
    } catch {
      Alert.alert("Error", "No se pudo aplicar la acción. Intentá de nuevo.");
    } finally {
      setModeratingId(null);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-bg justify-center items-center">
        <ActivityIndicator color={T.forest} size="large" />
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-bg"
      contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={T.forest} />}
      showsVerticalScrollIndicator={false}
    >
      <View className="flex-row items-center justify-between px-5 pb-[6px]" style={{ paddingTop: insets.top + 6 }}>
        <Text className="text-[22px] font-bold text-ink tracking-[-0.6px]">Panel de control</Text>
        <View className="flex-row items-center gap-1 bg-mint px-2 py-1 rounded-lg">
          <MaterialCommunityIcons name="shield-account-outline" size={12} color={T.forest} />
          <Text className="text-[9px] tracking-[1.2px] text-forest font-bold">ADMIN</Text>
        </View>
      </View>

      {error && (
        <View className="flex-row items-center gap-2 mx-4 mt-2 bg-redBg rounded-xl p-3">
          <MaterialCommunityIcons name="wifi-off" size={16} color={T.red} />
          <Text className="flex-1 text-xs text-red font-medium">No pudimos cargar los datos. Deslizá para reintentar.</Text>
        </View>
      )}

      {/* Operations */}
      <Text className="text-[10px] font-bold tracking-[2px] text-inkMute uppercase mx-5 mt-[18px] mb-2">OPERACIÓN</Text>
      <View className="flex-row gap-[10px] mx-4">
        <MetricCard icon="package-variant-closed" value={String(dashboard?.shipments_total ?? 0)} label="Envíos totales" />
        <MetricCard icon="truck-fast-outline" value={String(dashboard?.shipments_active ?? 0)} label="En curso" />
      </View>
      <View className="flex-row gap-[10px] mx-4 mt-[10px]">
        <MetricCard icon="check-circle-outline" value={String(dashboard?.shipments_delivered ?? 0)} label="Entregados" accent />
        <MetricCard icon="clock-outline" value={String(dashboard?.shipments_pending ?? 0)} label="Sin asignar" />
      </View>

      {/* Platform */}
      <Text className="text-[10px] font-bold tracking-[2px] text-inkMute uppercase mx-5 mt-[18px] mb-2">PLATAFORMA</Text>
      <View className="flex-row gap-[10px] mx-4">
        <MetricCard icon="account-group-outline" value={String(dashboard?.total_users ?? 0)} label="Usuarios" />
        <MetricCard icon="bike-fast" value={String(dashboard?.total_carriers ?? 0)} label="Cadetes" />
      </View>
      <View className="flex-row gap-[10px] mx-4 mt-[10px]">
        <MetricCard
          icon="leaf"
          value={`${(dashboard?.total_co2_saved_kg ?? 0).toFixed(1)} kg`}
          label="CO₂ ahorrado"
          accent
        />
        <MetricCard
          icon="handshake-outline"
          value={`${((dashboard?.matching_success_rate ?? 0) * 100).toFixed(0)}%`}
          label="Tasa de éxito"
        />
      </View>

      {/* Pending carriers */}
      <View className="flex-row items-center justify-between mr-5">
        <Text className="text-[10px] font-bold tracking-[2px] text-inkMute uppercase mx-5 mt-[18px] mb-2">CADETES PENDIENTES DE VERIFICACIÓN</Text>
        {pending.length > 0 && (
          <View className="bg-amberBg px-2 py-[2px] rounded-lg mt-[18px] mb-2">
            <Text className="text-[11px] font-bold text-amber">{pending.length}</Text>
          </View>
        )}
      </View>
      {pending.length === 0 ? (
        <View className="items-center gap-[10px] py-9">
          <MaterialCommunityIcons name="check-decagram-outline" size={42} color={T.border} />
          <Text className="text-[13px] text-inkMute font-medium">No hay verificaciones pendientes</Text>
        </View>
      ) : (
        <View className="mx-4 gap-[10px]">
          {pending.map((c) => (
            <PendingCarrierCard
              key={c.id}
              carrier={c}
              onModerate={moderate}
              busy={moderatingId === c.id}
            />
          ))}
        </View>
      )}

      {/* System health + vision model */}
      {status && (
        <>
          <Text className="text-[10px] font-bold tracking-[2px] text-inkMute uppercase mx-5 mt-[22px] mb-2">ESTADO DEL SISTEMA</Text>
          <View className="mx-4 bg-card rounded-[18px] border border-border overflow-hidden">
            <StatusRow label="API" ok={status.api === "ok"} value={status.api === "ok" ? "Operativa" : "Caída"} />
            <View className="h-px bg-borderSoft ml-4" />
            <StatusRow label="Base de datos" ok={status.database === "ok"} value={status.database === "ok" ? "Conectada" : "Error"} />
            <View className="h-px bg-borderSoft ml-4" />
            <StatusRow
              label="Modelo de visión"
              ok={status.vision_model_loaded}
              value={status.vision_model_loaded ? "Cargado" : "Fallback (stub)"}
            />
            <View className="h-px bg-borderSoft ml-4" />
            <StatusRow label="Entorno" ok value={status.environment} />
          </View>
        </>
      )}

      {/* Recent activity */}
      {activity && (activity.recent_events.length > 0 || activity.recent_classifications.length > 0) && (
        <>
          <Text className="text-[10px] font-bold tracking-[2px] text-inkMute uppercase mx-5 mt-[22px] mb-2">ACTIVIDAD RECIENTE</Text>
          <View className="mx-4 bg-card rounded-[18px] border border-border overflow-hidden">
            {activity.recent_events.slice(0, 6).map((e, i) => (
              <View key={`e${e.id}`}>
                {i > 0 && <View className="h-px bg-borderSoft ml-4" />}
                <View className="flex-row items-center gap-3 px-4 py-[11px]">
                  <MaterialCommunityIcons name="timeline-clock-outline" size={16} color={T.inkSoft} />
                  <Text className="flex-1 text-[12.5px] text-ink">Envío #{e.shipment_id} → {e.status}</Text>
                  <Text className="text-[10px] text-inkMute">{new Date(e.created_at).toLocaleDateString("es-AR", { day: "numeric", month: "short" })}</Text>
                </View>
              </View>
            ))}
          </View>
        </>
      )}
    </ScrollView>
  );
}
