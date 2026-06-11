import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert } from "react-native";
import { useRouter } from "expo-router";
import { authService } from "@/src/services/auth";

export default function ResetPasswordScreen() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!token.trim()) { setError("Ingresá el código de recuperación"); return; }
    if (password.length < 8) { setError("La contraseña debe tener al menos 8 caracteres"); return; }
    if (password !== confirm) { setError("Las contraseñas no coinciden"); return; }

    setIsLoading(true);
    setError("");
    try {
      await authService.resetPassword({ token: token.trim(), new_password: password });
      Alert.alert("Listo", "Tu contraseña fue restablecida. Iniciá sesión con la nueva.", [
        { text: "Ir al login", onPress: () => router.replace("/(auth)/login") },
      ]);
    } catch {
      setError("Código inválido o vencido. Pedí uno nuevo desde \"¿Olvidaste tu contraseña?\"");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView className="flex-1 bg-[#0F172A]" behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingVertical: 48 }} keyboardShouldPersistTaps="handled">
        <TouchableOpacity className="mb-6" onPress={() => router.back()}>
          <Text className="text-[#60A5FA] text-base font-medium">← Volver</Text>
        </TouchableOpacity>

        <View className="items-center mb-10">
          <Text className="text-[48px] mb-4">🔐</Text>
          <Text className="text-2xl font-bold text-white mb-2 text-center">Restablecer contraseña</Text>
          <Text className="text-base text-[#94A3B8] text-center leading-6">
            Pegá el código que recibiste y elegí tu nueva contraseña
          </Text>
        </View>

        <View className="mb-4">
          <Text className="text-sm font-semibold text-[#CBD5E1] mb-2">Código de recuperación</Text>
          <TextInput
            className={`bg-[#1E293B] rounded-xl px-4 py-[14px] text-base text-white border ${error ? "border-[#EF4444]" : "border-[#334155]"}`}
            placeholder="Código recibido"
            placeholderTextColor="#9CA3AF"
            value={token}
            onChangeText={t => { setToken(t); setError(""); }}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <View className="mb-4">
          <Text className="text-sm font-semibold text-[#CBD5E1] mb-2">Nueva contraseña</Text>
          <TextInput
            className={`bg-[#1E293B] rounded-xl px-4 py-[14px] text-base text-white border ${error ? "border-[#EF4444]" : "border-[#334155]"}`}
            placeholder="Mínimo 8 caracteres"
            placeholderTextColor="#9CA3AF"
            value={password}
            onChangeText={t => { setPassword(t); setError(""); }}
            secureTextEntry
            autoCapitalize="none"
          />
        </View>

        <View className="mb-6">
          <Text className="text-sm font-semibold text-[#CBD5E1] mb-2">Repetir contraseña</Text>
          <TextInput
            className={`bg-[#1E293B] rounded-xl px-4 py-[14px] text-base text-white border ${error ? "border-[#EF4444]" : "border-[#334155]"}`}
            placeholder="Repetí la nueva contraseña"
            placeholderTextColor="#9CA3AF"
            value={confirm}
            onChangeText={t => { setConfirm(t); setError(""); }}
            secureTextEntry
            autoCapitalize="none"
          />
          {error ? <Text className="text-[#EF4444] text-xs mt-2">{error}</Text> : null}
        </View>

        <TouchableOpacity
          className={`bg-[#3B82F6] rounded-xl py-4 items-center ${isLoading ? "opacity-60" : ""}`}
          onPress={handleSubmit}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          {isLoading
            ? <ActivityIndicator color="#FFF" />
            : <Text className="text-white font-bold text-base">Restablecer contraseña</Text>
          }
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
