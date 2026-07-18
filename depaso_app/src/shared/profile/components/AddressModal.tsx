import { useState } from "react";
import { View, TouchableOpacity, ScrollView, Modal, TextInput as RNTextInput, Alert } from "react-native";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAddressBookStore } from "@/src/shared/profile/addressBookStore";
import { T } from "@/constants/tokens";

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>["name"];

/** Libreta de direcciones del usuario (persistida en addressBookStore). */
export function AddressModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const { addresses, addAddress, removeAddress } = useAddressBookStore();
  const [adding, setAdding] = useState(false);
  const [label, setLabel]   = useState("");
  const [addr, setAddr]     = useState("");

  function save() {
    if (!label.trim() || !addr.trim()) {
      Alert.alert("Completá los campos", "Necesitamos el nombre y la dirección.");
      return;
    }
    addAddress({ label: label.trim().toUpperCase(), address: addr.trim(), icon: "map-marker-outline" });
    setLabel(""); setAddr(""); setAdding(false);
  }

  function cancel() { setLabel(""); setAddr(""); setAdding(false); }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
        {/* Header */}
        <View className="flex-row items-center justify-between px-5 py-[14px] border-b border-borderSoft">
          <TouchableOpacity onPress={onClose} hitSlop={10}>
            <MaterialCommunityIcons name="arrow-left" size={22} color={T.ink} />
          </TouchableOpacity>
          <Text className="text-[17px] font-bold text-ink tracking-[-0.4px]">Mis direcciones</Text>
          {!adding
            ? <TouchableOpacity onPress={() => setAdding(true)} hitSlop={10}>
                <MaterialCommunityIcons name="plus" size={24} color={T.forest} />
              </TouchableOpacity>
            : <View className="w-6" />
          }
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: insets.bottom + 32 }}>
          {/* Add form */}
          {adding && (
            <View className="bg-card rounded-[18px] border border-forest p-4 gap-3">
              <Text className="text-[10px] tracking-[2px] text-forest font-bold uppercase">NUEVA DIRECCIÓN</Text>
              <View className="gap-1">
                <Text className="text-[9px] tracking-[1.5px] text-inkMute uppercase font-semibold">NOMBRE (ej: CASA, TRABAJO)</Text>
                <RNTextInput
                  className="text-[15px] text-ink border-b border-borderSoft py-[6px] font-medium"
                  value={label}
                  onChangeText={setLabel}
                  placeholder="CASA"
                  placeholderTextColor={T.inkFaint}
                  autoCapitalize="characters"
                  autoFocus
                />
              </View>
              <View className="gap-1">
                <Text className="text-[9px] tracking-[1.5px] text-inkMute uppercase font-semibold">DIRECCIÓN COMPLETA</Text>
                <RNTextInput
                  className="text-[15px] text-ink border-b border-borderSoft py-[6px] font-medium"
                  value={addr}
                  onChangeText={setAddr}
                  placeholder="Av. Corrientes 1234, CABA"
                  placeholderTextColor={T.inkFaint}
                />
              </View>
              <View className="flex-row gap-2 mt-1">
                <TouchableOpacity className="flex-1 flex-row justify-center items-center bg-cardSoft border border-border rounded-xl py-[13px]" onPress={cancel} activeOpacity={0.8}>
                  <Text className="text-sm font-semibold text-inkSoft">Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity className="flex-1 flex-row justify-center items-center bg-forest rounded-xl py-[13px]" onPress={save} activeOpacity={0.8}>
                  <Text className="text-sm font-bold text-[#F4EFE3]">Guardar</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* List */}
          {addresses.length === 0 && !adding ? (
            <View className="items-center gap-3 py-12">
              <MaterialCommunityIcons name="map-marker-off-outline" size={48} color={T.border} />
              <Text className="text-sm text-inkMute font-medium">Sin direcciones guardadas</Text>
            </View>
          ) : (
            addresses.map((a) => (
              <View key={a.id} className="flex-row items-center gap-3 bg-card rounded-[14px] border border-border p-[14px]">
                <View className="w-[38px] h-[38px] rounded-[10px] bg-mint items-center justify-center shrink-0">
                  <MaterialCommunityIcons name={a.icon as IconName} size={18} color={T.forest} />
                </View>
                <View className="flex-1">
                  <Text className="text-[13px] font-bold text-ink tracking-[-0.2px]">{a.label}</Text>
                  <Text className="text-xs text-inkMute mt-[2px]" numberOfLines={1}>{a.address}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => Alert.alert("Eliminar", `¿Eliminar "${a.label}"?`, [
                    { text: "Cancelar", style: "cancel" },
                    { text: "Eliminar", style: "destructive", onPress: () => removeAddress(a.id) },
                  ])}
                  hitSlop={10}
                >
                  <MaterialCommunityIcons name="trash-can-outline" size={18} color={T.inkMute} />
                </TouchableOpacity>
              </View>
            ))
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}
