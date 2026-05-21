import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/src/stores/authStore";
import { UserType } from "@/src/types";

export default function RegisterScreen() {
  const router = useRouter();
  const { register, isLoading } = useAuthStore();
  const [form, setForm] = useState({ first_name: "", last_name: "", email: "", password: "", confirmPassword: "", phone_number: "", user_type: UserType.CLIENT as UserType });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateField = (field: string, value: string) => { setForm(prev => ({ ...prev, [field]: value })); if (errors[field]) setErrors(prev => ({ ...prev, [field]: "" })); };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.first_name.trim()) e.first_name = "Obligatorio";
    if (!form.last_name.trim()) e.last_name = "Obligatorio";
    if (!form.email.trim()) e.email = "Obligatorio";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Email inválido";
    if (!form.password) e.password = "Obligatorio";
    else if (form.password.length < 8) e.password = "Mínimo 8 caracteres";
    if (form.password !== form.confirmPassword) e.confirmPassword = "No coinciden";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    try {
      await register({ first_name: form.first_name.trim(), last_name: form.last_name.trim(), email: form.email.trim().toLowerCase(), password: form.password, phone_number: form.phone_number.trim() || undefined, user_type: form.user_type });
    } catch (error: any) {
      Alert.alert("Error", error?.response?.data?.detail || "Error al crear la cuenta");
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.logo}>🚀 DePaso</Text>
          <Text style={styles.title}>Crear cuenta</Text>
          <Text style={styles.subtitle}>Completá tus datos para empezar</Text>
        </View>

        <View style={styles.typeSelector}>
          <TouchableOpacity style={[styles.typeButton, form.user_type === UserType.CLIENT && styles.typeButtonActive]} onPress={() => updateField("user_type", UserType.CLIENT)}>
            <Text style={styles.typeEmoji}>📦</Text>
            <Text style={[styles.typeText, form.user_type === UserType.CLIENT && styles.typeTextActive]}>Cliente</Text>
            <Text style={styles.typeDesc}>Enviar paquetes</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.typeButton, form.user_type === UserType.CARRIER && styles.typeButtonActive]} onPress={() => updateField("user_type", UserType.CARRIER)}>
            <Text style={styles.typeEmoji}>🚗</Text>
            <Text style={[styles.typeText, form.user_type === UserType.CARRIER && styles.typeTextActive]}>Transportista</Text>
            <Text style={styles.typeDesc}>Realizar envíos</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.form}>
          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Nombre</Text>
              <TextInput style={[styles.input, errors.first_name ? styles.inputError : null]} placeholder="Juan" placeholderTextColor="#9CA3AF" value={form.first_name} onChangeText={t => updateField("first_name", t)} autoComplete="given-name" />
              {errors.first_name && <Text style={styles.errorText}>{errors.first_name}</Text>}
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>Apellido</Text>
              <TextInput style={[styles.input, errors.last_name ? styles.inputError : null]} placeholder="Pérez" placeholderTextColor="#9CA3AF" value={form.last_name} onChangeText={t => updateField("last_name", t)} autoComplete="family-name" />
              {errors.last_name && <Text style={styles.errorText}>{errors.last_name}</Text>}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput style={[styles.input, errors.email ? styles.inputError : null]} placeholder="tu@email.com" placeholderTextColor="#9CA3AF" value={form.email} onChangeText={t => updateField("email", t)} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} autoComplete="email" />
            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Teléfono (opcional)</Text>
            <TextInput style={styles.input} placeholder="+54 11 1234-5678" placeholderTextColor="#9CA3AF" value={form.phone_number} onChangeText={t => updateField("phone_number", t)} keyboardType="phone-pad" autoComplete="tel" />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Contraseña</Text>
            <View style={styles.passwordContainer}>
              <TextInput style={[styles.input, styles.passwordInput, errors.password ? styles.inputError : null]} placeholder="Mínimo 8 caracteres" placeholderTextColor="#9CA3AF" value={form.password} onChangeText={t => updateField("password", t)} secureTextEntry={!showPassword} autoComplete="new-password" />
              <TouchableOpacity style={styles.eyeButton} onPress={() => setShowPassword(!showPassword)}>
                <Text style={{ fontSize: 20 }}>{showPassword ? "🙈" : "👁️"}</Text>
              </TouchableOpacity>
            </View>
            {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirmar contraseña</Text>
            <TextInput style={[styles.input, errors.confirmPassword ? styles.inputError : null]} placeholder="Repetí tu contraseña" placeholderTextColor="#9CA3AF" value={form.confirmPassword} onChangeText={t => updateField("confirmPassword", t)} secureTextEntry={!showPassword} />
            {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
          </View>

          <TouchableOpacity style={[styles.primaryButton, isLoading && styles.buttonDisabled]} onPress={handleRegister} disabled={isLoading} activeOpacity={0.8}>
            {isLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.primaryButtonText}>Crear Cuenta</Text>}
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>¿Ya tenés cuenta? </Text>
          <TouchableOpacity onPress={() => router.push("/_auth/login")}><Text style={styles.link}>Iniciá sesión</Text></TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F172A" },
  scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingVertical: 48 },
  header: { alignItems: "center", marginBottom: 24 },
  logo: { fontSize: 36, fontWeight: "800", color: "#FFF", marginBottom: 12 },
  title: { fontSize: 24, fontWeight: "700", color: "#FFF", marginBottom: 8 },
  subtitle: { fontSize: 16, color: "#94A3B8" },
  typeSelector: { flexDirection: "row", gap: 12, marginBottom: 28 },
  typeButton: { flex: 1, backgroundColor: "#1E293B", borderRadius: 16, paddingVertical: 16, alignItems: "center", borderWidth: 2, borderColor: "#334155" },
  typeButtonActive: { borderColor: "#3B82F6", backgroundColor: "#1E3A5F" },
  typeEmoji: { fontSize: 28, marginBottom: 8 },
  typeText: { fontSize: 15, fontWeight: "700", color: "#94A3B8" },
  typeTextActive: { color: "#FFF" },
  typeDesc: { fontSize: 12, color: "#64748B", marginTop: 4 },
  form: { marginBottom: 24 },
  row: { flexDirection: "row" },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: "600", color: "#CBD5E1", marginBottom: 8 },
  input: { backgroundColor: "#1E293B", borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: "#FFF", borderWidth: 1, borderColor: "#334155" },
  inputError: { borderColor: "#EF4444" },
  passwordContainer: { position: "relative" },
  passwordInput: { paddingRight: 50 },
  eyeButton: { position: "absolute", right: 16, top: 14 },
  errorText: { color: "#EF4444", fontSize: 12, marginTop: 4 },
  primaryButton: { backgroundColor: "#3B82F6", borderRadius: 12, paddingVertical: 16, alignItems: "center", marginTop: 8, shadowColor: "#3B82F6", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  buttonDisabled: { opacity: 0.6 },
  primaryButtonText: { color: "#FFF", fontSize: 16, fontWeight: "700" },
  footer: { flexDirection: "row", justifyContent: "center", alignItems: "center" },
  footerText: { color: "#94A3B8", fontSize: 14 },
  link: { color: "#60A5FA", fontSize: 14, fontWeight: "600" },
});
