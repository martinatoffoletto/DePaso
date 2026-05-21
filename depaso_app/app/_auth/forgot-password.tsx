import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert } from "react-native";
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
    } catch (err: any) {
      Alert.alert("Error", "No se pudo procesar la solicitud. Intentá de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  if (sent) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.successEmoji}>📧</Text>
          <Text style={styles.successTitle}>Email enviado</Text>
          <Text style={styles.successText}>Si existe una cuenta con {email}, vas a recibir un link para restablecer tu contraseña.</Text>
          <TouchableOpacity style={styles.primaryButton} onPress={() => router.push("/_auth/login")} activeOpacity={0.8}>
            <Text style={styles.primaryButtonText}>Volver al login</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backText}>← Volver</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.headerEmoji}>🔑</Text>
          <Text style={styles.title}>¿Olvidaste tu contraseña?</Text>
          <Text style={styles.subtitle}>Ingresá tu email y te enviamos un link para restablecerla</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput style={[styles.input, error ? styles.inputError : null]} placeholder="tu@email.com" placeholderTextColor="#9CA3AF" value={email} onChangeText={t => { setEmail(t); setError(""); }} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} autoComplete="email" />
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </View>

          <TouchableOpacity style={[styles.primaryButton, isLoading && styles.buttonDisabled]} onPress={handleSubmit} disabled={isLoading} activeOpacity={0.8}>
            {isLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.primaryButtonText}>Enviar link de recuperación</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F172A" },
  scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingVertical: 48 },
  centerContent: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 24 },
  backButton: { marginBottom: 24 },
  backText: { color: "#60A5FA", fontSize: 16, fontWeight: "500" },
  header: { alignItems: "center", marginBottom: 40 },
  headerEmoji: { fontSize: 48, marginBottom: 16 },
  title: { fontSize: 24, fontWeight: "700", color: "#FFF", marginBottom: 8, textAlign: "center" },
  subtitle: { fontSize: 16, color: "#94A3B8", textAlign: "center", lineHeight: 24 },
  form: { marginBottom: 24 },
  inputGroup: { marginBottom: 24 },
  label: { fontSize: 14, fontWeight: "600", color: "#CBD5E1", marginBottom: 8 },
  input: { backgroundColor: "#1E293B", borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: "#FFF", borderWidth: 1, borderColor: "#334155" },
  inputError: { borderColor: "#EF4444" },
  errorText: { color: "#EF4444", fontSize: 12, marginTop: 4 },
  primaryButton: { backgroundColor: "#3B82F6", borderRadius: 12, paddingVertical: 16, alignItems: "center", shadowColor: "#3B82F6", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  buttonDisabled: { opacity: 0.6 },
  primaryButtonText: { color: "#FFF", fontSize: 16, fontWeight: "700" },
  successEmoji: { fontSize: 64, marginBottom: 24 },
  successTitle: { fontSize: 24, fontWeight: "700", color: "#FFF", marginBottom: 12 },
  successText: { fontSize: 16, color: "#94A3B8", textAlign: "center", lineHeight: 24, marginBottom: 32, paddingHorizontal: 16 },
});
