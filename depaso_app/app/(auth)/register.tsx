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
import { UserType } from "@/src/types";
import { T } from "@/constants/tokens";

function pwdStrength(pwd: string): number {
  if (!pwd) return 0;
  if (pwd.length < 5) return 1;
  if (pwd.length < 8) return 2;
  if (pwd.length < 12) return 3;
  return 4;
}

const STRENGTH_LABELS = ["", "DÉBIL", "REGULAR", "BUENA", "FUERTE"];
const STRENGTH_COLORS = [T.border, T.red, T.amber, T.emerald, T.emerald];

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
  const [accepted, setAccepted] = useState(false);

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
    if (!form.password)                         e.password = "Obligatorio";
    else if (form.password.length < 8)          e.password = "Mínimo 8 caracteres";
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
        last_name:  form.last_name.trim(),
        email:      form.email.trim().toLowerCase(),
        password:   form.password,
        phone_number: form.phone_number.trim() || undefined,
        user_type:  form.user_type,
      });
    } catch (error: any) {
      setServerError(error?.response?.data?.detail ?? "Error al crear la cuenta");
    }
  };

  const strength = pwdStrength(form.password);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 110 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topNav}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} hitSlop={10}>
            <MaterialCommunityIcons name="arrow-left" size={18} color={T.ink} />
          </TouchableOpacity>
          <View style={styles.stepDots}>
            <View style={[styles.stepDot, { width: 18, backgroundColor: T.forest }]} />
            <View style={styles.stepDot} />
            <View style={styles.stepDot} />
            <Text style={styles.stepCounter}>01/03</Text>
          </View>
          <View style={{ width: 38 }} />
        </View>

        <View style={styles.titleBlock}>
          <Text style={styles.stepLabel}>PASO 01 · TUS DATOS</Text>
          <Text style={styles.title}>Creá tu cuenta DePaso</Text>
          <Text style={styles.subtitle}>En 3 pasos cortos. Después podés empezar a enviar.</Text>
        </View>

        {serverError && (
          <View style={styles.errBanner}>
            <MaterialCommunityIcons name="alert-circle-outline" size={16} color={T.red} />
            <Text style={styles.errBannerText}>{serverError}</Text>
          </View>
        )}

        <FieldLabel label="¿CÓMO VAS A USAR DEPASO?" />
        <View style={styles.roleRow}>
          {([
            { type: UserType.CLIENT,  icon: "cube-outline" as const,  name: "Envío paquetes" },
            { type: UserType.CARRIER, icon: "truck-outline" as const,  name: "Soy cadete" },
          ] as const).map((r) => {
            const active = form.user_type === r.type;
            return (
              <TouchableOpacity
                key={r.type}
                style={[styles.roleBtn, active && styles.roleBtnActive]}
                onPress={() => setForm(p => ({ ...p, user_type: r.type }))}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons name={r.icon} size={18} color={active ? "#F4EFE3" : T.inkSoft} />
                <Text style={[styles.roleBtnText, active && styles.roleBtnTextActive]}>{r.name}</Text>
                {active && (
                  <View style={styles.roleCheck}>
                    <MaterialCommunityIcons name="check" size={10} color={T.forest} />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.nameRow}>
          <View style={styles.nameField}>
            <FieldLabel label="NOMBRE" />
            <View style={[styles.inputWrap, { borderColor: errors.first_name ? T.red : form.first_name ? T.forest : T.border }]}>
              <TextInput
                style={styles.input}
                placeholder="Valentina"
                placeholderTextColor={T.inkFaint}
                value={form.first_name}
                onChangeText={t => update("first_name", t)}
              />
            </View>
            {errors.first_name ? <Text style={styles.fieldErr}>{errors.first_name}</Text> : null}
          </View>
          <View style={styles.nameField}>
            <FieldLabel label="APELLIDO" />
            <View style={[styles.inputWrap, { borderColor: errors.last_name ? T.red : form.last_name ? T.forest : T.border }]}>
              <TextInput
                style={styles.input}
                placeholder="Rossi"
                placeholderTextColor={T.inkFaint}
                value={form.last_name}
                onChangeText={t => update("last_name", t)}
              />
            </View>
            {errors.last_name ? <Text style={styles.fieldErr}>{errors.last_name}</Text> : null}
          </View>
        </View>

        <FieldLabel label="EMAIL" />
        <View style={[styles.inputWrap, { borderColor: errors.email ? T.red : form.email ? T.forest : T.border }]}>
          <MaterialCommunityIcons name="email-outline" size={18} color={T.inkMute} />
          <TextInput
            style={styles.input}
            placeholder="tu@email.com"
            placeholderTextColor={T.inkFaint}
            autoCapitalize="none"
            keyboardType="email-address"
            autoCorrect={false}
            value={form.email}
            onChangeText={t => update("email", t)}
          />
          {form.email.includes("@") && !errors.email && (
            <MaterialCommunityIcons name="check-circle-outline" size={18} color={T.emerald} />
          )}
        </View>
        {errors.email ? <Text style={styles.fieldErr}>{errors.email}</Text> : null}

        <View style={styles.fieldSpacer} />
        <FieldLabel label="CELULAR (opcional)" />
        <View style={styles.phoneRow}>
          <View style={styles.countryChip}>
            <View style={styles.flagAR}>
              <View style={[styles.flagStripe, { backgroundColor: "#75AADB" }]} />
              <View style={[styles.flagStripe, { backgroundColor: "#F4EFE3" }]} />
              <View style={[styles.flagStripe, { backgroundColor: "#75AADB" }]} />
            </View>
            <Text style={styles.countryCode}>+54</Text>
            <MaterialCommunityIcons name="chevron-down" size={14} color={T.inkMute} />
          </View>
          <View style={[styles.inputWrap, { flex: 1, borderColor: form.phone_number ? T.forest : T.border }]}>
            <TextInput
              style={styles.input}
              placeholder="11 5821-9043"
              placeholderTextColor={T.inkFaint}
              keyboardType="phone-pad"
              value={form.phone_number}
              onChangeText={t => update("phone_number", t)}
            />
          </View>
        </View>

        <View style={styles.fieldSpacer} />
        <FieldLabel label="CONTRASEÑA" />
        <View style={[styles.inputWrap, { borderColor: errors.password ? T.red : form.password ? T.forest : T.border }]}>
          <MaterialCommunityIcons name="lock-outline" size={18} color={T.inkMute} />
          <TextInput
            style={styles.input}
            placeholder="Mínimo 8 caracteres"
            placeholderTextColor={T.inkFaint}
            secureTextEntry={!showPwd}
            value={form.password}
            onChangeText={t => update("password", t)}
          />
          <TouchableOpacity onPress={() => setShowPwd(v => !v)} hitSlop={8}>
            <Text style={styles.showPwdLabel}>{showPwd ? "OCU" : "VER"}</Text>
          </TouchableOpacity>
        </View>
        {errors.password ? <Text style={styles.fieldErr}>{errors.password}</Text> : null}

        {form.password.length > 0 && (
          <View style={styles.strengthRow}>
            <View style={styles.strengthBars}>
              {[1, 2, 3, 4].map((i) => (
                <View key={i} style={[styles.strengthBar, { backgroundColor: i <= strength ? STRENGTH_COLORS[strength] : T.border }]} />
              ))}
            </View>
            <Text style={[styles.strengthLabel, { color: STRENGTH_COLORS[strength] }]}>
              {STRENGTH_LABELS[strength]}
            </Text>
          </View>
        )}

        <View style={styles.fieldSpacer} />
        <FieldLabel label="CONFIRMAR CONTRASEÑA" />
        <View style={[styles.inputWrap, { borderColor: errors.confirmPassword ? T.red : form.confirmPassword ? T.forest : T.border }]}>
          <MaterialCommunityIcons name="lock-check-outline" size={18} color={T.inkMute} />
          <TextInput
            style={styles.input}
            placeholder="Repetí tu contraseña"
            placeholderTextColor={T.inkFaint}
            secureTextEntry={!showPwd}
            value={form.confirmPassword}
            onChangeText={t => update("confirmPassword", t)}
          />
        </View>
        {errors.confirmPassword ? <Text style={styles.fieldErr}>{errors.confirmPassword}</Text> : null}

        <TouchableOpacity
          style={styles.tcRow}
          onPress={() => setAccepted(v => !v)}
          activeOpacity={0.8}
        >
          <View style={[styles.tcCheckbox, accepted && styles.tcCheckboxChecked]}>
            {accepted && <MaterialCommunityIcons name="check" size={12} color="#F4EFE3" />}
          </View>
          <Text style={styles.tcText}>
            {"Acepto los "}
            <Text style={styles.tcLink}>términos</Text>
            {" y la "}
            <Text style={styles.tcLink}>política de privacidad</Text>
            {" de DePaso."}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={[styles.ctaBtn, isLoading && { opacity: 0.65 }]}
          onPress={handleRegister}
          disabled={isLoading}
          activeOpacity={0.88}
        >
          {isLoading
            ? <ActivityIndicator color="#F4EFE3" />
            : <>
                <Text style={styles.ctaBtnText}>Continuar al paso 2</Text>
                <MaterialCommunityIcons name="arrow-right" size={18} color="#F4EFE3" />
              </>
          }
        </TouchableOpacity>
        <View style={styles.loginLinkRow}>
          <Text style={styles.loginLinkLabel}>¿Ya tenés cuenta?</Text>
          <TouchableOpacity onPress={() => router.replace("/(auth)/login")} hitSlop={8}>
            <Text style={styles.loginLink}>Iniciá sesión</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

function FieldLabel({ label }: { label: string }) {
  return <Text style={fieldLabelStyle}>{label}</Text>;
}
const fieldLabelStyle: any = {
  fontSize: 9.5, letterSpacing: 1.5, color: T.inkMute,
  textTransform: "uppercase", marginBottom: 6, fontWeight: "600",
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 24 },

  topNav: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingTop: 6, paddingBottom: 0,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 12,
    borderWidth: 1, borderColor: T.border,
    backgroundColor: T.card, alignItems: "center", justifyContent: "center",
  },
  stepDots: { flexDirection: "row", gap: 6, alignItems: "center" },
  stepDot: { width: 6, height: 6, borderRadius: 4, backgroundColor: T.border },
  stepCounter: { fontSize: 10, letterSpacing: 1.5, color: T.inkMute, marginLeft: 4 },

  titleBlock: { paddingTop: 20, paddingBottom: 22 },
  stepLabel: { fontSize: 10, letterSpacing: 2.5, color: T.emeraldDeep, textTransform: "uppercase", marginBottom: 6 },
  title: { fontSize: 28, fontWeight: "700", color: T.ink, letterSpacing: -1, lineHeight: 30 },
  subtitle: { fontSize: 13.5, color: T.inkSoft, lineHeight: 19, marginTop: 6 },

  errBanner: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: T.redBg, borderRadius: 10,
    borderWidth: 1, borderColor: T.red,
    padding: 12, marginBottom: 16,
  },
  errBannerText: { flex: 1, color: T.red, fontSize: 13 },

  roleRow: { flexDirection: "row", gap: 8, marginBottom: 18 },
  roleBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: T.card, borderWidth: 1.2, borderColor: T.border,
    borderRadius: 14, paddingVertical: 12, paddingHorizontal: 12,
    position: "relative",
  },
  roleBtnActive: { backgroundColor: T.forest, borderColor: T.forest },
  roleBtnText: { fontSize: 13, fontWeight: "600", color: T.inkSoft },
  roleBtnTextActive: { color: "#F4EFE3" },
  roleCheck: {
    position: "absolute", top: 8, right: 8,
    width: 16, height: 16, borderRadius: 16,
    backgroundColor: T.lime, alignItems: "center", justifyContent: "center",
  },

  nameRow: { flexDirection: "row", gap: 10, marginBottom: 0 },
  nameField: { flex: 1 },

  inputWrap: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: T.card, borderRadius: 14,
    borderWidth: 1.2, paddingHorizontal: 14, height: 52, marginBottom: 4,
  },
  input: { flex: 1, fontSize: 15, color: T.ink, fontWeight: "500" },
  fieldErr: { fontSize: 11, color: T.red, marginBottom: 6, paddingLeft: 4 },
  fieldSpacer: { height: 10 },
  showPwdLabel: { fontSize: 10, color: T.inkMute, fontWeight: "600", letterSpacing: 0.5 },

  phoneRow: { flexDirection: "row", gap: 8, marginBottom: 4 },
  countryChip: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: T.card, borderWidth: 1.2, borderColor: T.border,
    borderRadius: 14, paddingHorizontal: 12, height: 52,
  },
  flagAR: { width: 22, height: 14, borderRadius: 3, overflow: "hidden", flexDirection: "column" },
  flagStripe: { flex: 1 },
  countryCode: { fontSize: 14, fontWeight: "500", color: T.ink },

  strengthRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: -2, marginBottom: 4, paddingLeft: 4 },
  strengthBars: { flexDirection: "row", gap: 3 },
  strengthBar: { width: 30, height: 4, borderRadius: 4 },
  strengthLabel: { fontSize: 9, letterSpacing: 1.5, fontWeight: "700", textTransform: "uppercase" },

  tcRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginTop: 18 },
  tcCheckbox: {
    width: 20, height: 20, borderRadius: 6,
    borderWidth: 1.5, borderColor: T.border,
    backgroundColor: T.card, flexShrink: 0, marginTop: 1,
    alignItems: "center", justifyContent: "center",
  },
  tcCheckboxChecked: { backgroundColor: T.forest, borderColor: T.forest },
  tcText: { flex: 1, fontSize: 12, color: T.inkSoft, lineHeight: 18 },
  tcLink: { color: T.forest, fontWeight: "600" },

  footer: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    paddingHorizontal: 24, paddingTop: 16,
    backgroundColor: T.bg, borderTopWidth: 1, borderTopColor: T.border,
  },
  ctaBtn: {
    backgroundColor: T.forest, borderRadius: 16,
    height: 54, flexDirection: "row",
    alignItems: "center", justifyContent: "center", gap: 10,
    marginBottom: 8,
    shadowColor: T.forest,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 5,
  },
  ctaBtnText: { color: "#F4EFE3", fontWeight: "600", fontSize: 15 },
  loginLinkRow: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 6 },
  loginLinkLabel: { color: T.inkSoft, fontSize: 12 },
  loginLink: { color: T.forest, fontWeight: "700", fontSize: 12, textDecorationLine: "underline" },
});
