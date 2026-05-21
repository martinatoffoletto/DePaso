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

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { login, isLoading } = useAuthStore();

  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd]   = useState(false);
  const [errors, setErrors]     = useState<{ email?: string; password?: string }>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [connError, setConnError]     = useState(false);

  const validate = () => {
    const e: typeof errors = {};
    if (!email.trim()) e.email = "El email es obligatorio";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Email inválido";
    if (!password) e.password = "La contraseña es obligatoria";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setServerError(null);
    setConnError(false);
    try {
      await login(email.trim().toLowerCase(), password);
    } catch (error: any) {
      if (!error?.response) {
        setConnError(true);
      } else {
        setServerError(error?.response?.data?.detail ?? "Email o contraseña incorrectos");
      }
    }
  };

  if (connError) {
    return (
      <View style={[errStyles.screen, { paddingTop: insets.top }]}>
        <View style={errStyles.iconWrap}>
          <MaterialCommunityIcons name="wifi-off" size={52} color="#EF4444" />
        </View>
        <Text style={errStyles.title}>Sin conexión al servidor</Text>
        <Text style={errStyles.sub}>
          No se pudo contactar con DePaso.{"\n"}Verificá tu conexión o que el backend esté activo.
        </Text>
        <TouchableOpacity style={errStyles.btn} onPress={() => setConnError(false)} activeOpacity={0.85}>
          <MaterialCommunityIcons name="refresh" size={18} color="#fff" />
          <Text style={errStyles.btnText}>Reintentar</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 12 }}>
          <Text style={errStyles.back}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

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

      <Text style={styles.title}>Bienvenido de vuelta</Text>
      <Text style={styles.subtitle}>Ingresá a tu cuenta para continuar</Text>

      {serverError && (
        <View style={styles.errBanner}>
          <MaterialCommunityIcons name="alert-circle-outline" size={16} color="#DC2626" />
          <Text style={styles.errBannerText}>{serverError}</Text>
        </View>
      )}

      {/* Email */}
      <View style={styles.field}>
        <Text style={styles.label}>Email</Text>
        <View style={[styles.inputWrap, errors.email ? styles.inputErrBorder : null]}>
          <MaterialCommunityIcons name="email-outline" size={18} color="#94A3B8" />
          <TextInput
            style={styles.input}
            placeholder="hola@ejemplo.com"
            placeholderTextColor="#CBD5E1"
            autoCapitalize="none"
            keyboardType="email-address"
            autoCorrect={false}
            value={email}
            onChangeText={t => { setEmail(t); if (errors.email) setErrors(e => ({ ...e, email: undefined })); }}
          />
        </View>
        {errors.email && <Text style={styles.fieldErr}>{errors.email}</Text>}
      </View>

      {/* Password */}
      <View style={styles.field}>
        <Text style={styles.label}>Contraseña</Text>
        <View style={[styles.inputWrap, errors.password ? styles.inputErrBorder : null]}>
          <MaterialCommunityIcons name="lock-outline" size={18} color="#94A3B8" />
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor="#CBD5E1"
            secureTextEntry={!showPwd}
            value={password}
            onChangeText={t => { setPassword(t); if (errors.password) setErrors(e => ({ ...e, password: undefined })); }}
          />
          <TouchableOpacity onPress={() => setShowPwd(v => !v)} hitSlop={8}>
            <MaterialCommunityIcons name={showPwd ? "eye-off-outline" : "eye-outline"} size={18} color="#94A3B8" />
          </TouchableOpacity>
        </View>
        {errors.password && <Text style={styles.fieldErr}>{errors.password}</Text>}
      </View>

      {/* Submit */}
      <TouchableOpacity
        style={[styles.submitBtn, isLoading && styles.submitDisabled]}
        onPress={handleLogin}
        disabled={isLoading}
        activeOpacity={0.88}
      >
        {isLoading
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.submitText}>Iniciar sesión</Text>
        }
      </TouchableOpacity>

      {/* Register link */}
      <View style={styles.linkRow}>
        <Text style={styles.linkLabel}>¿No tenés cuenta?</Text>
        <TouchableOpacity onPress={() => router.replace("/_auth/register")} hitSlop={8}>
          <Text style={styles.link}>Registrate</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const errStyles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#fff", alignItems: "center", justifyContent: "center", padding: 32, gap: 16 },
  iconWrap: { width: 96, height: 96, borderRadius: 48, backgroundColor: "#FEF2F2", alignItems: "center", justifyContent: "center" },
  title: { fontSize: 20, fontWeight: "700", color: "#0F172A", textAlign: "center" },
  sub: { color: "#64748B", textAlign: "center", lineHeight: 22 },
  btn: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#16A34A", borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12, marginTop: 8 },
  btnText: { color: "#fff", fontWeight: "600", fontSize: 15 },
  back: { color: "#94A3B8", fontSize: 14 },
});

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: "#fff" },
  content: { paddingHorizontal: 24 },

  logoRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 32 },
  logo: { width: 44, height: 44, borderRadius: 10 },
  brand: { fontSize: 22, fontWeight: "800", color: "#0F172A" },

  title: { fontSize: 26, fontWeight: "800", color: "#0F172A", letterSpacing: -0.3 },
  subtitle: { color: "#94A3B8", fontSize: 15, marginTop: 4, marginBottom: 28 },

  errBanner: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#FEF2F2", borderRadius: 10,
    borderWidth: 1, borderColor: "#FECACA",
    padding: 12, marginBottom: 16,
  },
  errBannerText: { flex: 1, color: "#DC2626", fontSize: 13 },

  field: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: "600", color: "#475569", marginBottom: 6 },
  inputWrap: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: "#F8FAFC", borderRadius: 12,
    borderWidth: 1.5, borderColor: "#E2E8F0",
    paddingHorizontal: 14, height: 50,
  },
  inputErrBorder: { borderColor: "#FCA5A5" },
  input: { flex: 1, fontSize: 15, color: "#0F172A" },
  fieldErr: { fontSize: 12, color: "#EF4444", marginTop: 4 },

  submitBtn: {
    backgroundColor: "#16A34A", borderRadius: 14,
    height: 52, alignItems: "center", justifyContent: "center",
    marginTop: 8, marginBottom: 24,
  },
  submitDisabled: { opacity: 0.65 },
  submitText: { color: "#fff", fontWeight: "700", fontSize: 16 },

  linkRow: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 6 },
  linkLabel: { color: "#94A3B8", fontSize: 14 },
  link: { color: "#16A34A", fontWeight: "700", fontSize: 14 },
});
