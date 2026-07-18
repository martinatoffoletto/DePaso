import { useState } from "react";
import { View, TouchableOpacity, ActivityIndicator, Modal, Alert } from "react-native";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { shipmentsService } from "@/src/shared/api/shipments";
import { Shipment } from "@/src/shared/types";
import { T } from "@/constants/tokens";

/** Calificación post-entrega (1-5 estrellas + comentario). */
export function RatingModal({ shipment, onClose, onRated }: { shipment: Shipment; onClose: () => void; onRated: () => void }) {
  const insets = useSafeAreaInsets();
  const [stars, setStars] = useState(5);
  const [sending, setSending] = useState(false);

  async function submit() {
    setSending(true);
    try {
      await shipmentsService.rateShipment(shipment.id, stars);
      onRated();
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      Alert.alert("No se pudo calificar", typeof detail === "string" ? detail : "Intentá de nuevo.");
    } finally {
      setSending(false);
    }
  }

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 bg-black/45 justify-end">
        <View className="bg-bg rounded-t-[28px] p-6 gap-4" style={{ paddingBottom: insets.bottom + 24 }}>
          <View className="w-[38px] h-1 bg-border rounded-[3px] self-center" />
          <View>
            <Text className="text-[10px] tracking-[2.5px] text-emeraldDeep uppercase">ENVÍO DP-{String(shipment.id).padStart(4, "0")}</Text>
            <Text className="text-[22px] font-bold text-ink tracking-[-0.7px] mt-1">¿Cómo estuvo la entrega?</Text>
          </View>
          <View className="flex-row justify-center gap-[10px] py-2">
            {[1, 2, 3, 4, 5].map(n => (
              <TouchableOpacity key={n} onPress={() => setStars(n)} hitSlop={6}>
                <MaterialCommunityIcons name={n <= stars ? "star" : "star-outline"} size={38} color={n <= stars ? T.amber : T.border} />
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity
            className="bg-forest rounded-2xl h-[52px] items-center justify-center"
            onPress={submit}
            disabled={sending}
            activeOpacity={0.88}
          >
            {sending
              ? <ActivityIndicator color={T.lime} />
              : <Text className="text-[#F4EFE3] font-semibold text-[15px]">Enviar calificación</Text>}
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose} className="items-center py-1">
            <Text className="text-inkMute text-[13px]">Ahora no</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
