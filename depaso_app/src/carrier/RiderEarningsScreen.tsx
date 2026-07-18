import { useCallback, useMemo, useState } from "react";
import { View, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Text } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { carriersService } from "@/src/shared/api/carriers";
import { shipmentsService } from "@/src/shared/api/shipments";
import { CarrierSummary, Shipment, ShipmentStatus } from "@/src/shared/types";
import { EmptyState } from "@/src/shared/ui/EmptyState";
import { T } from "@/constants/tokens";
import { weekEarnings, weekRangeLabel, shipmentsOfWeek, dayIndexInWeek, mondayOf } from "./weekEarnings";
import { WeekEarningsCard } from "./components/WeekEarningsCard";
import { WeeklyGoalCard } from "./components/WeeklyGoalCard";
import { PaymentRow } from "./components/PaymentRow";
import { DayPickerSheet } from "./components/DayPickerSheet";
import { money } from "./components/riderUi";

const DAY_NAMES = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"];
const DAY_MS = 86_400_000;
const WEEK_MS = 7 * DAY_MS;

export default function RiderEarningsScreen() {
  const insets = useSafeAreaInsets();
  const [summary, setSummary] = useState<CarrierSummary | null>(null);
  const [delivered, setDelivered] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);

  // 0 = semana actual, -1 = anterior, etc. Cambiar de semana limpia el día elegido.
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [calOpen, setCalOpen] = useState(false);

  const load = useCallback(async (asRefresh = false) => {
    if (asRefresh) setRefreshing(true);
    else setLoading(true);
    setError(false);
    try {
      const [sum, list] = await Promise.all([
        carriersService.getSummary(),
        shipmentsService.getAssignedShipments(0, 200).catch(() => [] as Shipment[]),
      ]);
      setSummary(sum);
      setDelivered(list.filter((s) => s.status === ShipmentStatus.DELIVERED));
    } catch {
      setSummary(null);
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const refDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + weekOffset * 7);
    return d;
  }, [weekOffset]);

  const week = useMemo(() => weekEarnings(delivered, refDate), [delivered, refDate]);
  const weekList = useMemo(() => shipmentsOfWeek(delivered, refDate), [delivered, refDate]);
  const list = useMemo(
    () => (selectedDay == null ? weekList : weekList.filter((s) => dayIndexInWeek(s, refDate) === selectedDay)),
    [weekList, selectedDay, refDate],
  );

  const weekTitle = weekOffset === 0 ? "Esta semana" : weekOffset === -1 ? "Semana pasada" : weekRangeLabel(refDate);

  const changeWeek = (delta: number) => {
    setWeekOffset((o) => Math.min(0, o + delta));
    setSelectedDay(null);
  };

  // Saltar a un día puntual del calendario: posiciona la semana y marca el día.
  const jumpToDate = (d: Date) => {
    const wk = Math.round((mondayOf(d).getTime() - mondayOf(new Date()).getTime()) / WEEK_MS);
    setWeekOffset(Math.min(0, wk));
    setSelectedDay((d.getDay() + 6) % 7);
    setCalOpen(false);
  };

  const selectedDate = selectedDay != null
    ? new Date(mondayOf(refDate).getTime() + selectedDay * DAY_MS)
    : null;

  if (loading) {
    return (
      <View className="flex-1 bg-bg items-center justify-center" style={{ paddingTop: insets.top }}>
        <ActivityIndicator size="large" color={T.forest} />
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
        <EmptyState
          icon="wifi-off"
          title="Sin conexión"
          description="No pudimos cargar tus ganancias."
          ctaLabel="Reintentar"
          onCta={() => load()}
        />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, gap: 10, paddingBottom: insets.bottom + 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={T.forest} />}
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-[26px] font-bold text-ink tracking-[-0.8px]">Pagos</Text>

        {/* Week navigator */}
        <View className="flex-row items-center justify-between bg-card border border-border rounded-2xl px-2 py-2">
          <TouchableOpacity
            className="w-9 h-9 rounded-xl items-center justify-center"
            onPress={() => changeWeek(-1)}
            hitSlop={8}
          >
            <MaterialCommunityIcons name="chevron-left" size={20} color={T.ink} />
          </TouchableOpacity>
          <TouchableOpacity className="items-center flex-row gap-[6px]" onPress={() => setCalOpen(true)} activeOpacity={0.7}>
            <View className="items-center">
              <Text className="text-[13.5px] font-bold text-ink">{weekTitle}</Text>
              <Text className="text-[10.5px] text-inkMute mt-px">{weekRangeLabel(refDate)}</Text>
            </View>
            <MaterialCommunityIcons name="calendar-search" size={16} color={T.inkMute} />
          </TouchableOpacity>
          <TouchableOpacity
            className={`w-9 h-9 rounded-xl items-center justify-center ${weekOffset === 0 ? "opacity-25" : ""}`}
            onPress={() => changeWeek(1)}
            disabled={weekOffset === 0}
            hitSlop={8}
          >
            <MaterialCommunityIcons name="chevron-right" size={20} color={T.ink} />
          </TouchableOpacity>
        </View>

        {/* Week chart — tap a bar to filter that day */}
        <WeekEarningsCard week={week} title={weekTitle} selectedDay={selectedDay} onSelectDay={setSelectedDay} />

        {/* Weekly goal only makes sense on the current week */}
        {weekOffset === 0 && <WeeklyGoalCard weekEarned={week.total} />}

        {/* Per-delivery breakdown */}
        <View className="flex-row items-baseline justify-between mt-1">
          <Text className="text-sm font-bold text-ink tracking-[-0.3px]">
            {selectedDay == null ? "Cobros de la semana" : `Cobros del ${DAY_NAMES[selectedDay]}`}
          </Text>
          {selectedDay != null && (
            <TouchableOpacity onPress={() => setSelectedDay(null)} hitSlop={8}>
              <Text className="text-[10px] tracking-[1.5px] text-emeraldDeep uppercase font-bold">Ver semana</Text>
            </TouchableOpacity>
          )}
        </View>

        {list.length === 0 ? (
          <View className="bg-card border border-border rounded-2xl px-4 py-6 items-center gap-2">
            <MaterialCommunityIcons name="wallet-outline" size={28} color={T.inkMute} />
            <Text className="text-[13px] text-inkMute text-center">
              {selectedDay == null
                ? "Sin cobros en esta semana."
                : `Sin cobros el ${DAY_NAMES[selectedDay]}.`}
            </Text>
          </View>
        ) : (
          <View className="gap-2">
            {list.map((sh) => <PaymentRow key={sh.id} shipment={sh} />)}
          </View>
        )}

        {/* Historic footer — deliberately quiet */}
        {summary && (
          <Text className="text-[11.5px] text-inkMute text-center mt-3">
            Histórico: {money(summary.total_earnings)} en {summary.deliveries_completed}{" "}
            {summary.deliveries_completed === 1 ? "entrega" : "entregas"}
            {summary.deliveries_completed > 0 &&
              ` · promedio ${money(summary.total_earnings / summary.deliveries_completed)}`}
          </Text>
        )}
      </ScrollView>

      <DayPickerSheet
        visible={calOpen}
        selected={selectedDate}
        onSelect={jumpToDate}
        onClose={() => setCalOpen(false)}
        title="Buscar cobros de un día"
      />
    </View>
  );
}
