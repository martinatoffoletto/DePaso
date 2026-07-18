import { View, ScrollView, TouchableOpacity, Modal, Text } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { T } from "@/constants/tokens";
import type { SavedAddress } from "@/src/shared/profile/addressBookStore";

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>["name"];

/** Bottom sheet con todas las direcciones guardadas — tap para usarla en el campo activo. */
export function SavedAddressesModal({ visible, addresses, targetLabel, onSelect, onClose }: {
  visible: boolean;
  addresses: SavedAddress[];
  targetLabel: "origen" | "destino";
  onSelect: (a: SavedAddress) => void;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity className="flex-1 bg-black/40" activeOpacity={1} onPress={onClose}>
        <View
          className="absolute left-0 right-0 bottom-0 bg-bg rounded-t-[24px] pt-3"
          style={{ paddingBottom: insets.bottom + 8, maxHeight: "65%" }}
        >
          <View className="w-[38px] h-1 bg-border rounded-[3px] self-center mb-2" />
          <Text className="text-sm font-bold text-ink text-center">Direcciones guardadas</Text>
          <Text className="text-[11px] text-inkMute text-center mb-2">
            Tocá una para usarla como {targetLabel}
          </Text>
          <ScrollView showsVerticalScrollIndicator={false}>
            {addresses.map((a, i) => (
              <TouchableOpacity
                key={a.id}
                className={`flex-row items-center gap-3 px-5 py-3 ${i > 0 ? "border-t border-borderSoft" : ""}`}
                onPress={() => onSelect(a)}
                activeOpacity={0.7}
              >
                <View className="w-9 h-9 rounded-xl bg-mint items-center justify-center">
                  <MaterialCommunityIcons name={a.icon as IconName} size={18} color={T.forest} />
                </View>
                <View className="flex-1">
                  <Text className="text-[9px] tracking-[1.2px] text-inkMute uppercase">{a.label}</Text>
                  <Text className="text-sm text-ink font-medium mt-px" numberOfLines={2}>{a.address}</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={18} color={T.inkMute} />
              </TouchableOpacity>
            ))}
            {addresses.length === 0 && (
              <View className="items-center px-6 py-8 gap-2">
                <MaterialCommunityIcons name="map-marker-plus-outline" size={28} color={T.inkMute} />
                <Text className="text-[13px] text-inkMute text-center">
                  Todavía no guardaste direcciones. Podés agregarlas desde tu perfil.
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}
