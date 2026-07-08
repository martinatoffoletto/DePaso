import { useEffect, useState } from "react";
import { View, TouchableOpacity, ActivityIndicator, Modal, Image, ScrollView, Text } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DeliveryMode, FeedItem } from "@/src/types";
import { reverseGeocode } from "@/src/utils/geocoding";
import { T } from "@/constants/tokens";
import { PACKAGE_LABEL_SHORT } from "@/src/utils/packageCategory";

const SIZE_LABEL = PACKAGE_LABEL_SHORT;

function useAddress(lat: number, lon: number): string {
  const [addr, setAddr] = useState(`${lat.toFixed(3)}, ${lon.toFixed(3)}`);
  useEffect(() => {
    let alive = true;
    reverseGeocode(lat, lon).then((r) => { if (alive) setAddr(r); });
    return () => { alive = false; };
  }, [lat, lon]);
  return addr;
}

type Props = {
  item: FeedItem;
  accepting: boolean;
  onAccept: () => void;
  onReject: () => void;
};

/**
 * Uber-style incoming offer: transparent modal over the operational map.
 * Shows everything the rider needs to decide — route, price, photo,
 * description and declared value. Accept assigns, reject keeps them online.
 */
export function IncomingOfferModal({ item, accepting, onAccept, onReject }: Props) {
  const insets = useSafeAreaInsets();
  const isCollab = item.modality === DeliveryMode.COLLABORATIVE;
  const pickupAddr = useAddress(item.origin_lat, item.origin_lon);
  const dropoffAddr = useAddress(item.destination_lat, item.destination_lon);
  const priceLabel = item.estimated_price != null ? `$${item.estimated_price.toLocaleString("es-AR")}` : "A convenir";

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onReject}>
      {/* Dim layer — the real operational map stays visible behind */}
      <View className="flex-1 bg-black/35">
        {/* Notification banner */}
        <View
          className="absolute left-4 right-4 bg-forest rounded-2xl px-3 py-[10px] flex-row items-center gap-[10px]"
          style={{ top: insets.top + 12, shadowColor: "#000", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.4, shadowRadius: 24, elevation: 8 }}
        >
          <View className="w-7 h-7 rounded-lg bg-lime items-center justify-center shrink-0">
            <MaterialCommunityIcons name="package-variant-closed" size={16} color={T.forest} />
          </View>
          <View className="flex-1">
            <Text className="text-[9px] tracking-[1.2px] text-lime font-bold uppercase">Nuevo pedido cerca</Text>
            <Text className="text-[12.5px] text-[#F4EFE3] font-semibold mt-px" numberOfLines={1}>
              {SIZE_LABEL[item.package_size]} · {priceLabel}
              {item.distance_to_pickup_km != null ? ` · ${item.distance_to_pickup_km.toFixed(1)} km` : ""}
            </Text>
          </View>
          <Text className="text-[10px] text-[#F4EFE3]/80 tracking-[1px] font-bold">DEPASO</Text>
        </View>

        {/* Detail sheet */}
        <View
          className="absolute left-0 right-0 bottom-0 bg-bg rounded-t-[28px] px-4 pt-[14px]"
          style={{ maxHeight: "78%", paddingBottom: insets.bottom + 20, shadowColor: "#000", shadowOffset: { width: 0, height: -20 }, shadowOpacity: 0.3, shadowRadius: 40, elevation: 12 }}
        >
          <View className="w-[38px] h-1 bg-border rounded-[3px] self-center mb-[14px]" />

          {/* Header row */}
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center gap-2">
              <View className="w-[10px] h-[10px] rounded-full bg-amber" />
              <Text className="text-amberDeep text-[10px] tracking-[1.5px] font-bold uppercase">
                Pedido entrante
              </Text>
            </View>
            <View className="flex-row items-center gap-1 bg-amberBg px-[9px] py-1 rounded-lg">
              <MaterialCommunityIcons name="clock-outline" size={12} color={T.amberDeep} />
              <Text className="text-amberDeep text-[11px] font-bold tracking-[0.5px]">
                {isCollab ? "COLAB." : "EXPRESS"}
              </Text>
            </View>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
            {/* Earnings + distance hero */}
            <View className="bg-forest rounded-[18px] p-4 mb-3">
              <View className="flex-row items-end justify-between">
                <View>
                  <Text className="text-[9.5px] tracking-[1.5px] text-[#F4EFE3]/80 uppercase">Ganás</Text>
                  <Text className="text-[38px] font-bold text-lime tracking-[-1.5px] leading-[38px] mt-1">{priceLabel}</Text>
                </View>
                <View className="items-end">
                  {item.detour_km != null && (
                    <Text className="text-[20px] font-bold text-[#F4EFE3] tracking-[-0.5px]">
                      +{item.detour_km.toFixed(1)} <Text className="text-xs text-[#F4EFE3]/80">km desvío</Text>
                    </Text>
                  )}
                  {item.distance_to_pickup_km != null && (
                    <Text className="text-[9px] tracking-[1px] text-[#F4EFE3]/80 uppercase mt-1">
                      {item.distance_to_pickup_km.toFixed(1)} km al retiro
                    </Text>
                  )}
                </View>
              </View>
            </View>

            {/* Package photo — what the rider is going to carry */}
            {item.photo_url && (
              <View className="rounded-[18px] overflow-hidden border border-border mb-3">
                <Image source={{ uri: item.photo_url }} className="w-full h-[150px]" resizeMode="cover" />
                <View className="absolute bottom-2 left-2 bg-black/55 rounded-lg px-2 py-1 flex-row items-center gap-[5px]">
                  <MaterialCommunityIcons name="camera-outline" size={11} color="#F4EFE3" />
                  <Text className="text-[10px] text-[#F4EFE3] font-semibold">Foto del paquete</Text>
                </View>
              </View>
            )}

            {/* Pickup + dropoff */}
            <View className="gap-[6px] mb-3">
              <View className="bg-card border border-border rounded-xl px-3 py-[10px] flex-row items-center gap-3">
                <View className="w-3 h-3 rounded-full border-[2.5px] border-forest bg-card shrink-0" />
                <View className="flex-1">
                  <Text className="text-[8.5px] tracking-[1.2px] text-inkMute uppercase">Retiro</Text>
                  <Text className="text-[13px] text-ink font-medium mt-px" numberOfLines={1}>{pickupAddr}</Text>
                </View>
              </View>
              <View className="bg-card border border-border rounded-xl px-3 py-[10px] flex-row items-center gap-3">
                <View className="w-3 h-3 rounded-[3px] bg-emerald shrink-0 rotate-45" />
                <View className="flex-1">
                  <Text className="text-[8.5px] tracking-[1.2px] text-inkMute uppercase">Entrega</Text>
                  <Text className="text-[13px] text-ink font-medium mt-px" numberOfLines={1}>{dropoffAddr}</Text>
                </View>
              </View>
            </View>

            {/* Description */}
            {item.description ? (
              <View className="bg-card border border-border rounded-xl px-3 py-[10px] mb-3 flex-row items-start gap-3">
                <MaterialCommunityIcons name="text-box-outline" size={16} color={T.inkSoft} style={{ marginTop: 1 }} />
                <View className="flex-1">
                  <Text className="text-[8.5px] tracking-[1.2px] text-inkMute uppercase">Descripción</Text>
                  <Text className="text-[13px] text-ink mt-px leading-[18px]">{item.description}</Text>
                </View>
              </View>
            ) : null}

            {/* Package details strip */}
            <View className="flex-row gap-[6px] mb-[14px]">
              <View className="flex-1 bg-cardSoft border border-borderSoft rounded-[10px] px-[9px] py-[7px]">
                <Text className="text-[8px] tracking-[1px] text-inkMute uppercase font-bold">Tipo</Text>
                <Text className="text-[12.5px] text-ink font-semibold mt-px">{SIZE_LABEL[item.package_size]}</Text>
              </View>
              <View className="flex-1 bg-cardSoft border border-borderSoft rounded-[10px] px-[9px] py-[7px]">
                <Text className="text-[8px] tracking-[1px] text-inkMute uppercase font-bold">Peso</Text>
                <Text className="text-[12.5px] text-ink font-semibold mt-px">{item.weight_kg} kg</Text>
              </View>
              {item.declared_value != null && item.declared_value > 0 ? (
                <View className="flex-1 bg-amberBg rounded-[10px] px-[9px] py-[7px]">
                  <Text className="text-[8px] tracking-[1px] text-amberDeep uppercase font-bold">Valor decl.</Text>
                  <Text className="text-[12.5px] text-amberDeep font-semibold mt-px" numberOfLines={1}>
                    ${item.declared_value.toLocaleString("es-AR")}
                  </Text>
                </View>
              ) : (
                <View className="flex-1 bg-mint rounded-[10px] px-[9px] py-[7px]">
                  <Text className="text-[8px] tracking-[1px] text-forest uppercase font-bold">Modo</Text>
                  <Text className="text-[12.5px] text-forest font-semibold mt-px">{isCollab ? "Colab." : "Dedic."}</Text>
                </View>
              )}
            </View>
          </ScrollView>

          {/* Actions */}
          <View className="flex-row gap-[10px]">
            <TouchableOpacity
              className="w-14 h-14 rounded-[18px] bg-card border border-border items-center justify-center shrink-0"
              onPress={onReject}
              disabled={accepting}
              activeOpacity={0.8}
              accessibilityLabel="Rechazar pedido"
            >
              <MaterialCommunityIcons name="close" size={20} color={T.inkSoft} />
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 h-14 rounded-[18px] bg-forest flex-row items-center justify-center gap-[10px]"
              style={{ shadowColor: T.forest, shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.5, shadowRadius: 32, elevation: 8 }}
              onPress={onAccept}
              disabled={accepting}
              activeOpacity={0.9}
            >
              {accepting ? (
                <ActivityIndicator color={T.lime} />
              ) : (
                <>
                  <MaterialCommunityIcons name="check" size={20} color={T.lime} />
                  <Text className="text-base font-bold text-lime tracking-[-0.3px]">Aceptar · {priceLabel}</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
