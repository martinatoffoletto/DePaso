import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/src/stores/authStore";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { forgotPassword } = useAuthStore();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!email.trim()) { setError("El email es obligatorio"); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError("Email inválido"); return; }

    setIsLoading(true);
    setError("");
    try {
      await forgotPassword(email.trim().toLowerCase());
      setSent(true);
    } catch {
      Alert.alert("Error", "No se pudo procesar la solicitud. Intentá de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  if (sent) {
    return (
      <View className="flex-1 bg-[#0F172A] justify-center items-center px-6">
        <Text className="text-[64px] mb-6">📧</Text>
        <Text className="text-2xl font-bold text-white mb-3 text-center">Email enviado</Text>
        <Text className="text-base text-[#94A3B8] text-center leading-6 mb-8 px-4">
          Si existe una cuenta con {email}, vas a recibir un link para restablecer tu contraseña.
        </Text>
        <TouchableOpacity
          className="bg-[#3B82F6] rounded-xl py-4 px-8 items-center"
          onPress={() => router.push("/(auth)/reset-password" as any)}
          activeOpacity={0.8}
        >
          <Text className="text-white font-bold text-base">Ya tengo el código</Text>
        </TouchableOpacity>
        <TouchableOpacity className="mt-4" onPress={() => router.push("/(auth)/login")} activeOpacity={0.8}>
          <Text className="text-[#60A5FA] text-base font-medium">Volver al login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView className="flex-1 bg-[#0F172A]" behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingVertical: 48 }} keyboardShouldPersistTaps="handled">
        <TouchableOpacity className="mb-6" onPress={() => router.back()}>
          <Text className="text-[#60A5FA] text-base font-medium">← Volver</Text>
        </TouchableOpacity>

        <View className="items-center mb-10">
          <Text className="text-[48px] mb-4">🔑</Text>
          <Text className="text-2xl font-bold text-white mb-2 text-center">¿Olvidaste tu contraseña?</Text>
          <Text className="text-base text-[#94A3B8] text-center leading-6">
            Ingresá tu email y te enviamos un link para restablecerla
          </Text>
        </View>

        <View className="mb-6">
          <Text className="text-sm font-semibold text-[#CBD5E1] mb-2">Email</Text>
          <TextInput
            className={`bg-[#1E293B] rounded-xl px-4 py-[14px] text-base text-white border ${error ? "border-[#EF4444]" : "border-[#334155]"}`}
            placeholder="tu@email.com"
            placeholderTextColor="#9CA3AF"
            value={email}
            onChangeText={t => { setEmail(t); setError(""); }}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
          />
          {error ? <Text className="text-[#EF4444] text-xs mt-1">{error}</Text> : null}
        </View>

        <TouchableOpacity
          className={`bg-[#3B82F6] rounded-xl py-4 items-center ${isLoading ? "opacity-60" : ""}`}
          onPress={handleSubmit}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          {isLoading
            ? <ActivityIndicator color="#FFF" />
            : <Text className="text-white font-bold text-base">Enviar link de recuperación</Text>
          }
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
