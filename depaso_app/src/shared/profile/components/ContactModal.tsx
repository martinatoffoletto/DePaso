import { useState } from "react";
import { View, TouchableOpacity, ScrollView, Modal, TextInput as RNTextInput, Alert } from "react-native";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAddressBookStore } from "@/src/shared/profile/addressBookStore";
import { T } from "@/constants/tokens";

/** Libreta de contactos frecuentes ("mis personas", persistida en addressBookStore). */
export function ContactModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const { contacts, addContact, removeContact } = useAddressBookStore();
  const [adding, setAdding]   = useState(false);
  const [label, setLabel]     = useState("");
  const [name, setName]       = useState("");
  const [phone, setPhone]     = useState("");

  function save() {
    if (!label.trim() || !name.trim()) {
      Alert.alert("Completá los campos", "Nombre y apodo son requeridos.");
      return;
    }
    addContact({ label: label.trim().toUpperCase(), name: name.trim(), phone: phone.trim() });
    setLabel(""); setName(""); setPhone(""); setAdding(false);
  }

  function cancel() { setLabel(""); setName(""); setPhone(""); setAdding(false); }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
        {/* Header */}
        <View className="flex-row items-center justify-between px-5 py-[14px] border-b border-borderSoft">
          <TouchableOpacity onPress={onClose} hitSlop={10}>
            <MaterialCommunityIcons name="arrow-left" size={22} color={T.ink} />
          </TouchableOpacity>
          <Text className="text-[17px] font-bold text-ink tracking-[-0.4px]">Mis personas</Text>
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
              <Text className="text-[10px] tracking-[2px] text-forest font-bold uppercase">NUEVA PERSONA</Text>
              <View className="gap-1">
                <Text className="text-[9px] tracking-[1.5px] text-inkMute uppercase font-semibold">APODO (ej: MAMÁ, TRABAJO)</Text>
                <RNTextInput
                  className="text-[15px] text-ink border-b border-borderSoft py-[6px] font-medium"
                  value={label}
                  onChangeText={setLabel}
                  placeholder="MAMÁ"
                  placeholderTextColor={T.inkFaint}
                  autoCapitalize="characters"
                  autoFocus
                />
              </View>
              <View className="gap-1">
                <Text className="text-[9px] tracking-[1.5px] text-inkMute uppercase font-semibold">NOMBRE COMPLETO</Text>
                <RNTextInput
                  className="text-[15px] text-ink border-b border-borderSoft py-[6px] font-medium"
                  value={name}
                  onChangeText={setName}
                  placeholder="María García"
                  placeholderTextColor={T.inkFaint}
                />
              </View>
              <View className="gap-1">
                <Text className="text-[9px] tracking-[1.5px] text-inkMute uppercase font-semibold">TELÉFONO</Text>
                <RNTextInput
                  className="text-[15px] text-ink border-b border-borderSoft py-[6px] font-medium"
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="11 4521-8830"
                  placeholderTextColor={T.inkFaint}
                  keyboardType="phone-pad"
                />
              </View>
              <View className="flex-row gap-2 mt-1">
                <TouchableOpacity className="flex-1 flex-row justify-center items-center bg-cardSoft border border-border rounded-xl py-[13px]" onPress={cancel} activeOpacity={0.8}>
                  <Text className="text-sm font-semibold text-inkSoft">Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity className="flex-1 flex-row justify-center items-center bg-forest rounded-xl py-[13px]" onPress={save} activeOpacity={0.8}>
                  <Text className="text-sm font-bold text-[#F4EFE3]" style={{ color: "#F4EFE3" }}>Guardar</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* List */}
          {contacts.length === 0 && !adding ? (
            <View className="items-center gap-3 py-12">
              <MaterialCommunityIcons name="account-off-outline" size={48} color={T.border} />
              <Text className="text-sm text-inkMute font-medium">Sin personas guardadas</Text>
            </View>
          ) : (
            contacts.map((c) => (
              <View key={c.id} className="flex-row items-center gap-3 bg-card rounded-[14px] border border-border p-[14px]">
                <View className="w-[38px] h-[38px] rounded-[10px] bg-cardSoft items-center justify-center shrink-0">
                  <MaterialCommunityIcons name="account-outline" size={18} color={T.forest} />
                </View>
                <View className="flex-1">
                  <Text className="text-[13px] font-bold text-ink tracking-[-0.2px]">{c.label} · <Text className="font-normal text-ink">{c.name}</Text></Text>
                  {!!c.phone && <Text className="text-xs text-inkMute mt-[2px]">{c.phone}</Text>}
                </View>
                <TouchableOpacity
                  onPress={() => Alert.alert("Eliminar", `¿Eliminar "${c.label}"?`, [
                    { text: "Cancelar", style: "cancel" },
                    { text: "Eliminar", style: "destructive", onPress: () => removeContact(c.id) },
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
