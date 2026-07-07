import { useState } from "react";
import {
  View, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Text,
  KeyboardAvoidingView, Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuthStore } from "@/src/stores/authStore";
import { T } from "@/constants/tokens";

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
      if (!error?.response) setConnError(true);
      else setServerError(error?.response?.data?.detail ?? "Email o contraseña incorrectos");
    }
  };

  if (connError) {
    return (
      <View style={{ flex: 1, backgroundColor: T.bg }}>
        <View style={{ backgroundColor: T.forest, paddingTop: insets.top + 12, paddingHorizontal: 24, paddingBottom: 32 }}>
          <TouchableOpacity
            style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: "rgba(244,239,227,0.12)", borderWidth: 1, borderColor: "rgba(244,239,227,0.18)", alignItems: "center", justifyContent: "center", marginBottom: 28 }}
            onPress={() => router.back()} hitSlop={10}
          >
            <MaterialCommunityIcons name="arrow-left" size={18} color="#F4EFE3" />
          </TouchableOpacity>
          <Text style={{ fontSize: 36, fontWeight: "800", color: "#F4EFE3", letterSpacing: -1.3, lineHeight: 40 }}>Sin conexión</Text>
        </View>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 40, gap: 16 }}>
          <View style={{ width: 72, height: 72, borderRadius: 24, backgroundColor: T.cardSoft, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: T.border }}>
            <MaterialCommunityIcons name="wifi-off" size={34} color={T.inkMute} />
          </View>
          <Text style={{ fontSize: 17, fontWeight: "700", color: T.ink, textAlign: "center", letterSpacing: -0.3 }}>No se pudo contactar con DePaso</Text>
          <Text style={{ fontSize: 14, color: T.inkSoft, textAlign: "center", lineHeight: 21 }}>
            Verificá tu conexión a internet o que el servidor esté activo.
          </Text>
          <TouchableOpacity
            style={{ flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: T.forest, borderRadius: 14, paddingHorizontal: 24, paddingVertical: 14, marginTop: 4 }}
            onPress={() => setConnError(false)} activeOpacity={0.85}
          >
            <MaterialCommunityIcons name="refresh" size={17} color="#F4EFE3" />
            <Text style={{ color: "#F4EFE3", fontWeight: "600", fontSize: 15 }}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: T.bg }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      {/* ── Hero ── */}
      <View style={{ backgroundColor: T.forest, paddingTop: insets.top + 12, paddingHorizontal: 24, paddingBottom: 36 }}>
        <TouchableOpacity
          style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: "rgba(244,239,227,0.12)", borderWidth: 1, borderColor: "rgba(244,239,227,0.18)", alignItems: "center", justifyContent: "center", marginBottom: 32 }}
          onPress={() => router.back()} hitSlop={10}
        >
          <MaterialCommunityIcons name="arrow-left" size={18} color="#F4EFE3" />
        </TouchableOpacity>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 18 }}>
          <View style={{ width: 40, height: 40, borderRadius: 13, backgroundColor: "rgba(244,239,227,0.12)", alignItems: "center", justifyContent: "center" }}>
            <MaterialCommunityIcons name="map-marker-path" size={20} color="#F4EFE3" />
          </View>
          <Text style={{ fontSize: 11, letterSpacing: 3.5, color: "rgba(244,239,227,0.4)", textTransform: "uppercase", fontWeight: "700" }}>
            DEPASO
          </Text>
        </View>

        <Text style={{ fontSize: 38, fontWeight: "800", color: "#F4EFE3", letterSpacing: -1.5, lineHeight: 42 }}>
          {"Hola,\nbienvenido."}
        </Text>
        <Text style={{ fontSize: 14, color: "rgba(244,239,227,0.55)", marginTop: 10, lineHeight: 20 }}>
          Ingresá para seguir moviendo paquetes en AMBA.
        </Text>
      </View>

      {/* ── Form ── */}
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 28, paddingBottom: insets.bottom + 48 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {serverError && (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: T.redBg, borderRadius: 12, borderWidth: 1, borderColor: T.red, padding: 14, marginBottom: 20 }}>
            <MaterialCommunityIcons name="alert-circle-outline" size={18} color={T.red} />
            <Text style={{ flex: 1, color: T.red, fontSize: 13, lineHeight: 18 }}>{serverError}</Text>
          </View>
        )}

        {/* Email */}
        <Text style={{ fontSize: 9.5, letterSpacing: 1.5, color: T.inkMute, textTransform: "uppercase", fontWeight: "700", marginBottom: 8 }}>
          Email
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: T.card, borderRadius: 16, paddingHorizontal: 16, height: 56, marginBottom: 4, borderWidth: 1.2, borderColor: errors.email ? T.red : email ? T.forest : T.border }}>
          <MaterialCommunityIcons name="email-outline" size={19} color={errors.email ? T.red : T.inkMute} />
          <TextInput
            style={{ flex: 1, fontSize: 15, color: T.ink, fontWeight: "500" }}
            placeholder="hola@ejemplo.com"
            placeholderTextColor={T.inkFaint}
            autoCapitalize="none"
            keyboardType="email-address"
            autoCorrect={false}
            value={email}
            onChangeText={t => { setEmail(t); if (errors.email) setErrors(e => ({ ...e, email: undefined })); }}
          />
        </View>
        {errors.email && <Text style={{ fontSize: 11, color: T.red, marginBottom: 8, paddingLeft: 4 }}>{errors.email}</Text>}

        {/* Password */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 20, marginBottom: 8 }}>
          <Text style={{ fontSize: 9.5, letterSpacing: 1.5, color: T.inkMute, textTransform: "uppercase", fontWeight: "700" }}>
            Contraseña
          </Text>
          <TouchableOpacity hitSlop={10} onPress={() => router.push("/(auth)/forgot-password")}>
            <Text style={{ fontSize: 11, color: T.emeraldDeep, fontWeight: "600" }}>Olvidé mi contraseña</Text>
          </TouchableOpacity>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: T.card, borderRadius: 16, paddingHorizontal: 16, height: 56, marginBottom: 4, borderWidth: 1.2, borderColor: errors.password ? T.red : password ? T.forest : T.border }}>
          <MaterialCommunityIcons name="lock-outline" size={19} color={errors.password ? T.red : T.inkMute} />
          <TextInput
            style={{ flex: 1, fontSize: 15, color: T.ink, fontWeight: "500" }}
            placeholder="••••••••"
            placeholderTextColor={T.inkFaint}
            secureTextEntry={!showPwd}
            value={password}
            onChangeText={t => { setPassword(t); if (errors.password) setErrors(e => ({ ...e, password: undefined })); }}
          />
          <TouchableOpacity onPress={() => setShowPwd(v => !v)} hitSlop={10}>
            <MaterialCommunityIcons name={showPwd ? "eye-off-outline" : "eye-outline"} size={19} color={T.inkMute} />
          </TouchableOpacity>
        </View>
        {errors.password && <Text style={{ fontSize: 11, color: T.red, marginBottom: 8, paddingLeft: 4 }}>{errors.password}</Text>}

        {/* CTA */}
        <TouchableOpacity
          style={{ backgroundColor: T.forest, borderRadius: 18, height: 58, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, marginTop: 28, shadowColor: T.forest, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.35, shadowRadius: 20, elevation: 6, opacity: isLoading ? 0.7 : 1 }}
          onPress={handleLogin}
          disabled={isLoading}
          activeOpacity={0.88}
        >
          {isLoading
            ? <ActivityIndicator color="#F4EFE3" />
            : <>
                <Text style={{ color: "#F4EFE3", fontWeight: "700", fontSize: 16 }}>Iniciar sesión</Text>
                <MaterialCommunityIcons name="arrow-right" size={18} color="#F4EFE3" />
              </>
          }
        </TouchableOpacity>

        {/* Sign up */}
        <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 6, marginTop: 24 }}>
          <Text style={{ color: T.inkSoft, fontSize: 14 }}>¿No tenés cuenta?</Text>
          <TouchableOpacity onPress={() => router.replace("/(auth)/register")} hitSlop={8}>
            <Text style={{ color: T.forest, fontWeight: "700", fontSize: 14 }}>Crear una</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
