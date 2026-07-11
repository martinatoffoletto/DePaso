import { useState } from "react";
import { Modal, View, TextInput, TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from "react-native";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { T } from "@/constants/tokens";
import { authService } from "@/src/shared/session/auth";

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <View className="gap-1">
      <Text className="text-[9px] tracking-[1.5px] text-inkMute uppercase font-semibold">{label}</Text>
      <TextInput
        className="text-[15px] text-ink border-b border-borderSoft py-[6px] font-medium"
        value={value}
        onChangeText={onChange}
        secureTextEntry
        placeholder="••••••••"
        placeholderTextColor={T.inkFaint}
      />
    </View>
  );
}

export function ChangePasswordModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!current) {
      Alert.alert("Falta tu contraseña actual", "Ingresala para confirmar el cambio.");
      return;
    }
    if (next.length < 8) {
      Alert.alert("Contraseña corta", "La nueva contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (next !== confirm) {
      Alert.alert("No coinciden", "La confirmación no coincide con la nueva contraseña.");
      return;
    }
    setSaving(true);
    try {
      await authService.changePassword({ current_password: current, new_password: next });
      Alert.alert("Listo", "Tu contraseña se actualizó.");
      setCurrent(""); setNext(""); setConfirm("");
      onClose();
    } catch (e: any) {
      Alert.alert("Error", e?.response?.data?.detail ?? "No se pudo cambiar la contraseña.");
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
          <Text className="text-[17px] font-bold text-ink tracking-[-0.4px]">Cambiar contraseña</Text>
          <View className="w-6" />
        </View>

        <View className="p-5 gap-5">
          <Field label="Contraseña actual" value={current} onChange={setCurrent} />
          <Field label="Nueva contraseña" value={next} onChange={setNext} />
          <Field label="Repetir nueva contraseña" value={confirm} onChange={setConfirm} />

          <TouchableOpacity
            className="bg-forest rounded-[14px] py-4 items-center mt-2"
            style={{ opacity: saving ? 0.7 : 1 }}
            onPress={save}
            disabled={saving}
            activeOpacity={0.88}
          >
            {saving ? <ActivityIndicator color="#F4EFE3" /> : <Text className="text-[#F4EFE3] font-bold text-[16px]">Actualizar</Text>}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
