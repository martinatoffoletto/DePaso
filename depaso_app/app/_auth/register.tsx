import { useState } from "react";
import {
  View, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Image, ActivityIndicator,
} from "react-native";
import { Text } from "react-native-paper";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuthStore } from "@/src/stores/authStore";
import { UserType } from "@/src/types";

export default function RegisterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { register, isLoading } = useAuthStore();

  const [form, setForm] = useState({
    first_name: "", last_name: "", email: "",
    password: "", confirmPassword: "", phone_number: "",
    user_type: UserType.CLIENT as UserType,
  });
  const [showPwd, setShowPwd]   = useState(false);
  const [errors, setErrors]     = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);

  const update = (field: string, value: string) => {
    setForm(p => ({ ...p, [field]: value }));
    if (errors[field]) setErrors(p => ({ ...p, [field]: "" }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.first_name.trim()) e.first_name = "Obligatorio";
    if (!form.last_name.trim())  e.last_name  = "Obligatorio";
    if (!form.email.trim())      e.email      = "Obligatorio";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Email inválido";
    if (!form.password)                       e.password = "Obligatorio";
    else if (form.password.length < 8)        e.password = "Mínimo 8 caracteres";
    if (form.password !== form.confirmPassword) e.confirmPassword = "No coinciden";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setServerError(null);
    try {
      await register({
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        phone_number: form.phone_number.trim() || undefined,
        user_type: form.user_type,
      });
    } catch (error: any) {
      setServerError(error?.response?.data?.detail ?? "Error al crear la cuenta");
    }
  };

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 32 }]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {/* Logo */}
      <View style={styles.logoRow}>
        <Image source={require("../../assets/images/DePaso_icon.png")} style={styles.logo} />
        <Text style={styles.brand}>DePaso</Text>
      </View>

      <Text style={styles.title}>Crear cuenta</Text>
      <Text style={styles.subtitle}>Completá tus datos para empezar</Text>

      {serverError && (
        <View style={styles.errBanner}>
          <MaterialCommunityIcons name="alert-circle-outline" size={16} color="#DC2626" />
          <Text style={styles.errBannerText}>{serverError}</Text>
        </View>
      )}

      {/* Tipo de cuenta */}
      <View style={styles.typeRow}>
        <TouchableOpacity
          style={[styles.typeBtn, form.user_type === UserType.CLIENT && styles.typeBtnActive]}
          onPress={() => setForm(p => ({ ...p, user_type: UserType.CLIENT }))}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons
            name="package-variant-closed"
            size={22}
            color={form.user_type === UserType.CLIENT ? "#16A34A" : "#94A3B8"}
          />
          <Text style={[styles.typeText, form.user_type === UserType.CLIENT && styles.typeTextActive]}>
            Cliente
          </Text>
          <Text style={styles.typeDesc}>Enviar paquetes</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.typeBtn, form.user_type === UserType.CARRIER && styles.typeBtnActive]}
          onPress={() => setForm(p => ({ ...p, user_type: UserType.CARRIER }))}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons
            name="truck-outline"
            size={22}
            color={form.user_type === UserType.CARRIER ? "#16A34A" : "#94A3B8"}
          />
          <Text style={[styles.typeText, form.user_type === UserType.CARRIER && styles.typeTextActive]}>
            Transportista
          </Text>
          <Text style={styles.typeDesc}>Realizar envíos</Text>
        </TouchableOpacity>
      </View>

      {/* Nombre + Apellido en fila */}
      <View style={styles.row}>
        <View style={[styles.field, { flex: 1, marginRight: 8 }]}>
          <Text style={styles.label}>Nombre</Text>
          <View style={[styles.inputWrap, errors.first_name ? styles.inputErrBorder : null]}>
            <TextInput style={styles.input} placeholder="Valentina" placeholderTextColor="#CBD5E1" value={form.first_name} onChangeText={t => update("first_name", t)} />
          </View>
          {errors.first_name ? <Text style={styles.fieldErr}>{errors.first_name}</Text> : null}
        </View>
        <View style={[styles.field, { flex: 1, marginLeft: 8 }]}>
          <Text style={styles.label}>Apellido</Text>
          <View style={[styles.inputWrap, errors.last_name ? styles.inputErrBorder : null]}>
            <TextInput style={styles.input} placeholder="Rossi" placeholderTextColor="#CBD5E1" value={form.last_name} onChangeText={t => update("last_name", t)} />
          </View>
          {errors.last_name ? <Text style={styles.fieldErr}>{errors.last_name}</Text> : null}
        </View>
      </View>

      {/* Email */}
      <View style={styles.field}>
        <Text style={styles.label}>Email</Text>
        <View style={[styles.inputWrap, errors.email ? styles.inputErrBorder : null]}>
          <MaterialCommunityIcons name="email-outline" size={18} color="#94A3B8" />
          <TextInput style={styles.input} placeholder="hola@ejemplo.com" placeholderTextColor="#CBD5E1" autoCapitalize="none" keyboardType="email-address" autoCorrect={false} value={form.email} onChangeText={t => update("email", t)} />
        </View>
        {errors.email ? <Text style={styles.fieldErr}>{errors.email}</Text> : null}
      </View>

      {/* Teléfono */}
      <View style={styles.field}>
        <Text style={styles.label}>Teléfono <Text style={styles.optional}>(opcional)</Text></Text>
        <View style={styles.inputWrap}>
          <MaterialCommunityIcons name="phone-outline" size={18} color="#94A3B8" />
          <TextInput style={styles.input} placeholder="+54 11 1234-5678" placeholderTextColor="#CBD5E1" keyboardType="phone-pad" value={form.phone_number} onChangeText={t => update("phone_number", t)} />
        </View>
      </View>

      {/* Contraseña */}
      <View style={styles.field}>
        <Text style={styles.label}>Contraseña</Text>
        <View style={[styles.inputWrap, errors.password ? styles.inputErrBorder : null]}>
          <MaterialCommunityIcons name="lock-outline" size={18} color="#94A3B8" />
          <TextInput style={styles.input} placeholder="Mínimo 8 caracteres" placeholderTextColor="#CBD5E1" secureTextEntry={!showPwd} value={form.password} onChangeText={t => update("password", t)} />
          <TouchableOpacity onPress={() => setShowPwd(v => !v)} hitSlop={8}>
            <MaterialCommunityIcons name={showPwd ? "eye-off-outline" : "eye-outline"} size={18} color="#94A3B8" />
          </TouchableOpacity>
        </View>
        {errors.password ? <Text style={styles.fieldErr}>{errors.password}</Text> : null}
      </View>

      {/* Confirmar contraseña */}
      <View style={styles.field}>
        <Text style={styles.label}>Confirmar contraseña</Text>
        <View style={[styles.inputWrap, errors.confirmPassword ? styles.inputErrBorder : null]}>
          <MaterialCommunityIcons name="lock-check-outline" size={18} color="#94A3B8" />
          <TextInput style={styles.input} placeholder="Repetí tu contraseña" placeholderTextColor="#CBD5E1" secureTextEntry={!showPwd} value={form.confirmPassword} onChangeText={t => update("confirmPassword", t)} />
        </View>
        {errors.confirmPassword ? <Text style={styles.fieldErr}>{errors.confirmPassword}</Text> : null}
      </View>

      {/* Submit */}
      <TouchableOpacity
        style={[styles.submitBtn, isLoading && styles.submitDisabled]}
        onPress={handleRegister}
        disabled={isLoading}
        activeOpacity={0.88}
      >
        {isLoading
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.submitText}>Crear cuenta</Text>
        }
      </TouchableOpacity>

      {/* Login link */}
      <View style={styles.linkRow}>
        <Text style={styles.linkLabel}>¿Ya tenés cuenta?</Text>
        <TouchableOpacity onPress={() => router.replace("/_auth/login")} hitSlop={8}>
          <Text style={styles.link}>Iniciá sesión</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: "#fff" },
  content: { paddingHorizontal: 24 },

  logoRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 28 },
  logo: { width: 44, height: 44, borderRadius: 10 },
  brand: { fontSize: 22, fontWeight: "800", color: "#0F172A" },

  title: { fontSize: 26, fontWeight: "800", color: "#0F172A", letterSpacing: -0.3 },
  subtitle: { color: "#94A3B8", fontSize: 15, marginTop: 4, marginBottom: 20 },

  errBanner: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#FEF2F2", borderRadius: 10,
    borderWidth: 1, borderColor: "#FECACA",
    padding: 12, marginBottom: 16,
  },
  errBannerText: { flex: 1, color: "#DC2626", fontSize: 13 },

  typeRow: { flexDirection: "row", gap: 10, marginBottom: 20 },
  typeBtn: {
    flex: 1, alignItems: "center", gap: 4,
    backgroundColor: "#F8FAFC", borderRadius: 14,
    borderWidth: 1.5, borderColor: "#E2E8F0",
    paddingVertical: 14,
  },
  typeBtnActive: { borderColor: "#16A34A", backgroundColor: "#F0FDF4" },
  typeText: { fontSize: 14, fontWeight: "700", color: "#94A3B8" },
  typeTextActive: { color: "#15803D" },
  typeDesc: { fontSize: 11, color: "#94A3B8" },

  row: { flexDirection: "row" },
  field: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: "600", color: "#475569", marginBottom: 6 },
  optional: { fontWeight: "400", color: "#94A3B8" },
  inputWrap: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: "#F8FAFC", borderRadius: 12,
    borderWidth: 1.5, borderColor: "#E2E8F0",
    paddingHorizontal: 14, height: 48,
  },
  inputErrBorder: { borderColor: "#FCA5A5" },
  input: { flex: 1, fontSize: 15, color: "#0F172A" },
  fieldErr: { fontSize: 12, color: "#EF4444", marginTop: 4 },

  submitBtn: {
    backgroundColor: "#16A34A", borderRadius: 14,
    height: 52, alignItems: "center", justifyContent: "center",
    marginTop: 6, marginBottom: 20,
  },
  submitDisabled: { opacity: 0.65 },
  submitText: { color: "#fff", fontWeight: "700", fontSize: 16 },

  linkRow: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 6 },
  linkLabel: { color: "#94A3B8", fontSize: 14 },
  link: { color: "#16A34A", fontWeight: "700", fontSize: 14 },
});
