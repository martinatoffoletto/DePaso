import { View, Text } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Shipment, PLATFORM_COMMISSION_RATE } from "@/src/shared/types";
import { carrierPayout } from "@/src/shared/utils/payout";
import { parseApiDate } from "@/src/shared/utils/dates";
import { PACKAGE_LABEL_SHORT } from "@/src/shared/utils/packageCategory";
import { T } from "@/constants/tokens";
import { money } from "./riderUi";

function whenLabel(iso: string): string {
  const d = parseApiDate(iso);
  const day = d.toLocaleDateString("es-AR", { weekday: "short", day: "numeric", month: "short" });
  const time = d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
  return `${day} · ${time}`;
}

/** Fila de cobro en Pagos: entrega + desglose bruto − comisión = neto. */
export function PaymentRow({ shipment }: { shipment: Shipment }) {
  const gross = shipment.estimated_price;
  return (
    <View className="flex-row items-center gap-3 bg-card border border-borderSoft rounded-[14px] p-[14px]">
      <View className="w-9 h-9 rounded-xl bg-mint items-center justify-center">
        <MaterialCommunityIcons name="check" size={16} color={T.forest} />
      </View>
      <View className="flex-1">
        <Text className="text-[12.5px] text-ink font-semibold">
          DP-{String(shipment.id).padStart(4, "0")}
          <Text className="text-inkMute font-medium"> · {PACKAGE_LABEL_SHORT[shipment.package_size] ?? shipment.package_size}</Text>
        </Text>
        <Text className="text-[11px] text-inkMute mt-px">{whenLabel(shipment.updated_at)}</Text>
      </View>
      {gross != null && (
        <View className="items-end">
          <Text className="text-sm font-bold text-emeraldDeep">+{money(carrierPayout(gross))}</Text>
          <Text className="text-[10px] text-inkMute mt-px">
            {money(gross)} − {Math.round(PLATFORM_COMMISSION_RATE * 100)}%
          </Text>
        </View>
      )}
    </View>
  );
}
