import { useState } from "react";
import { Modal, View, TextInput, TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from "react-native";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { T } from "@/constants/tokens";
import { authService } from "@/src/shared/session/auth";
import { useAuthStore } from "@/src/shared/session/authStore";

function Field({ label, ...rest }: { label: string } & React.ComponentProps<typeof TextInput>) {
  return (
    <View className="gap-1">
      <Text className="text-[9px] tracking-[1.5px] text-inkMute uppercase font-semibold">{label}</Text>
      <TextInput
        className="text-[15px] text-ink border-b border-borderSoft py-[6px] font-medium"
        placeholderTextColor={T.inkFaint}
        {...rest}
      />
    </View>
  );
}

export function EditProfileModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const [firstName, setFirstName] = useState(user?.first_name ?? "");
  const [lastName, setLastName] = useState(user?.last_name ?? "");
  const [phone, setPhone] = useState(user?.phone_number ?? "");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert("Completá los campos", "El nombre y el apellido son obligatorios.");
      return;
    }
    setSaving(true);
    try {
      const updated = await authService.updateProfile({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone_number: phone.trim() || undefined,
      });
      setUser(updated);
      onClose();
    } catch (e: any) {
      Alert.alert("Error", e?.response?.data?.detail ?? "No se pudo guardar. Intentá de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
        <View className="flex-row items-center justify-between px-5 py-[14px] border-b border-borderSoft">
          <TouchableOpacity onPress={onClose} hitSlop={10}>
            <MaterialCommunityIcons name="arrow-left" size={22} color={T.ink} />
          </TouchableOpacity>
          <Text className="text-[17px] font-bold text-ink tracking-[-0.4px]">Editar perfil</Text>
          <View className="w-6" />
        </View>

        <View className="p-5 gap-5">
          <Field label="Nombre" value={firstName} onChangeText={setFirstName} placeholder="Nombre" autoCapitalize="words" />
          <Field label="Apellido" value={lastName} onChangeText={setLastName} placeholder="Apellido" autoCapitalize="words" />
          <Field label="Teléfono" value={phone} onChangeText={setPhone} placeholder="+54 11 …" keyboardType="phone-pad" />

          <TouchableOpacity
            className="bg-forest rounded-[14px] py-4 items-center mt-2"
            style={{ opacity: saving ? 0.7 : 1 }}
            onPress={save}
            disabled={saving}
            activeOpacity={0.88}
          >
            {saving ? <ActivityIndicator color="#F4EFE3" /> : <Text className="text-[#F4EFE3] font-bold text-[16px]">Guardar cambios</Text>}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
