import { useState } from "react";
import {
  View, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator,
} from "react-native";
import { Text } from "react-native-paper";
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
      <View style={[errStyles.screen, { paddingTop: insets.top }]}>
        <View style={errStyles.iconWrap}>
          <MaterialCommunityIcons name="wifi-off" size={48} color={T.red} />
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
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 6, paddingBottom: insets.bottom + 40 }]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.topNav}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} hitSlop={10}>
          <MaterialCommunityIcons name="arrow-left" size={18} color={T.ink} />
        </TouchableOpacity>
        <View style={styles.brandMark}>
          <MaterialCommunityIcons name="map-marker-path" size={18} color="#F4EFE3" />
        </View>
      </View>

      <View style={styles.titleBlock}>
        <Text style={styles.stepLabel}>INGRESÁ</Text>
        <Text style={styles.title}>Hola de nuevo</Text>
        <Text style={styles.subtitle}>
          Entrá a tu cuenta para seguir moviendo paquetes en AMBA.
        </Text>
      </View>

      {serverError && (
        <View style={styles.errBanner}>
          <MaterialCommunityIcons name="alert-circle-outline" size={16} color={T.red} />
          <Text style={styles.errBannerText}>{serverError}</Text>
        </View>
      )}

      <FieldLabel label="EMAIL" />
      <View style={[styles.inputWrap, { borderColor: errors.email ? T.red : email ? T.forest : T.border }]}>
        <MaterialCommunityIcons name="account-outline" size={18} color={T.inkMute} />
        <TextInput
          style={styles.input}
          placeholder="hola@ejemplo.com"
          placeholderTextColor={T.inkFaint}
          autoCapitalize="none"
          keyboardType="email-address"
          autoCorrect={false}
          value={email}
          onChangeText={t => { setEmail(t); if (errors.email) setErrors(e => ({ ...e, email: undefined })); }}
        />
      </View>
      {errors.email && <Text style={styles.fieldErr}>{errors.email}</Text>}

      <View style={styles.labelRow}>
        <FieldLabel label="CONTRASEÑA" />
        <TouchableOpacity hitSlop={8}>
          <Text style={styles.forgotLabel}>OLVIDÉ</Text>
        </TouchableOpacity>
      </View>
      <View style={[styles.inputWrap, { borderColor: errors.password ? T.red : password ? T.forest : T.border }]}>
        <MaterialCommunityIcons name="shield-outline" size={18} color={T.inkMute} />
        <TextInput
          style={styles.input}
          placeholder="••••••••"
          placeholderTextColor={T.inkFaint}
          secureTextEntry={!showPwd}
          value={password}
          onChangeText={t => { setPassword(t); if (errors.password) setErrors(e => ({ ...e, password: undefined })); }}
        />
        <TouchableOpacity onPress={() => setShowPwd(v => !v)} hitSlop={8}>
          <Text style={styles.showPwdLabel}>{showPwd ? "OCU" : "VER"}</Text>
        </TouchableOpacity>
      </View>
      {errors.password && <Text style={styles.fieldErr}>{errors.password}</Text>}

      <TouchableOpacity
        style={[styles.ctaBtn, isLoading && { opacity: 0.65 }]}
        onPress={handleLogin}
        disabled={isLoading}
        activeOpacity={0.88}
      >
        {isLoading
          ? <ActivityIndicator color="#F4EFE3" />
          : <>
              <Text style={styles.ctaBtnText}>Iniciar sesión</Text>
              <MaterialCommunityIcons name="arrow-right" size={18} color="#F4EFE3" />
            </>
        }
      </TouchableOpacity>

      <View style={styles.orRow}>
        <View style={styles.orLine} />
        <Text style={styles.orText}>O CONTINUÁ CON</Text>
        <View style={styles.orLine} />
      </View>

      <View style={styles.socialRow}>
        {[
          { label: "Apple",  dark: true },
          { label: "Google", dark: false },
        ].map((s, i) => (
          <TouchableOpacity key={i} style={styles.socialBtn} activeOpacity={0.8}>
            <View style={[styles.socialIcon, s.dark ? styles.socialIconDark : styles.socialIconLight]}>
              <Text style={[styles.socialIconText, { color: s.dark ? "#F4EFE3" : T.ink }]}>
                {s.label[0]}
              </Text>
            </View>
            <Text style={styles.socialBtnText}>{s.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.linkRow}>
        <Text style={styles.linkLabel}>¿No tenés cuenta?</Text>
        <TouchableOpacity onPress={() => router.replace("/(auth)/register")} hitSlop={8}>
          <Text style={styles.link}>Crear una</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function FieldLabel({ label }: { label: string }) {
  return <Text style={fieldLabelStyle}>{label}</Text>;
}
const fieldLabelStyle: any = {
  fontSize: 9.5, letterSpacing: 1.5, color: T.inkMute,
  textTransform: "uppercase", marginBottom: 6, fontWeight: "600",
};

const errStyles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: T.bg, alignItems: "center", justifyContent: "center", padding: 32, gap: 16 },
  iconWrap: { width: 96, height: 96, borderRadius: 48, backgroundColor: T.redBg, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 20, fontWeight: "700", color: T.ink, textAlign: "center" },
  sub: { color: T.inkSoft, textAlign: "center", lineHeight: 22 },
  btn: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: T.forest, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12, marginTop: 8 },
  btnText: { color: "#fff", fontWeight: "600", fontSize: 15 },
  back: { color: T.inkMute, fontSize: 14 },
});

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: T.bg },
  content: { paddingHorizontal: 24, gap: 0 },

  topNav: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 },
  backBtn: {
    width: 38, height: 38, borderRadius: 12,
    borderWidth: 1, borderColor: T.border,
    backgroundColor: T.card, alignItems: "center", justifyContent: "center",
  },
  brandMark: {
    width: 38, height: 38, borderRadius: 11,
    backgroundColor: T.forest, alignItems: "center", justifyContent: "center",
  },

  titleBlock: { paddingTop: 28, paddingBottom: 28 },
  stepLabel: {
    fontSize: 10, letterSpacing: 2.5, color: T.emeraldDeep,
    textTransform: "uppercase", marginBottom: 6,
  },
  title: { fontSize: 32, fontWeight: "700", color: T.ink, letterSpacing: -1.2, lineHeight: 34 },
  subtitle: { fontSize: 14, color: T.inkSoft, lineHeight: 20, marginTop: 8 },

  errBanner: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: T.redBg, borderRadius: 10,
    borderWidth: 1, borderColor: T.red,
    padding: 12, marginBottom: 16,
  },
  errBannerText: { flex: 1, color: T.red, fontSize: 13 },

  labelRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 14, marginBottom: 6 },
  forgotLabel: { fontSize: 9, letterSpacing: 1, color: T.emeraldDeep, textTransform: "uppercase", fontWeight: "600" },
  showPwdLabel: { fontSize: 10, color: T.inkMute, fontWeight: "600", letterSpacing: 0.5 },

  inputWrap: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: T.card, borderRadius: 14,
    borderWidth: 1.2, paddingHorizontal: 14, height: 52, marginBottom: 4,
  },
  input: { flex: 1, fontSize: 15, color: T.ink, fontWeight: "500" },
  fieldErr: { fontSize: 11, color: T.red, marginBottom: 6, paddingLeft: 4 },

  ctaBtn: {
    backgroundColor: T.forest, borderRadius: 16,
    height: 54, flexDirection: "row",
    alignItems: "center", justifyContent: "center", gap: 10,
    marginTop: 24, marginBottom: 8,
    shadowColor: T.forest,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 5,
  },
  ctaBtnText: { color: "#F4EFE3", fontWeight: "600", fontSize: 15 },

  orRow: { flexDirection: "row", alignItems: "center", gap: 12, marginVertical: 22 },
  orLine: { flex: 1, height: 1, backgroundColor: T.border },
  orText: { fontSize: 9, letterSpacing: 2, color: T.inkMute, textTransform: "uppercase" },

  socialRow: { flexDirection: "row", gap: 10, marginBottom: 12 },
  socialBtn: {
    flex: 1, backgroundColor: T.card,
    borderWidth: 1, borderColor: T.border,
    borderRadius: 14, paddingVertical: 14,
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
  },
  socialIcon: {
    width: 22, height: 22, borderRadius: 11,
    alignItems: "center", justifyContent: "center",
  },
  socialIconDark: { backgroundColor: T.ink },
  socialIconLight: { backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: T.border },
  socialIconText: { fontSize: 12, fontWeight: "700" },
  socialBtnText: { fontSize: 14, fontWeight: "600", color: T.ink },

  linkRow: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 6, marginTop: 12 },
  linkLabel: { color: T.inkSoft, fontSize: 13 },
  link: { color: T.forest, fontWeight: "700", fontSize: 13, textDecorationLine: "underline" },
});
