import { useState } from "react";
import {
  View, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Text,
} from "react-native";
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

function FieldLabel({ label }: { label: string }) {
  return (
    <Text className="text-[9.5px] tracking-[1.5px] text-inkMute uppercase mb-[6px] font-semibold">
      {label}
    </Text>
  );
}

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
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: insets.bottom + 110 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-row items-center justify-between pt-[6px]">
          <TouchableOpacity
            className="w-[38px] h-[38px] rounded-xl border border-border bg-card items-center justify-center"
            onPress={() => router.back()}
            hitSlop={10}
          >
            <MaterialCommunityIcons name="arrow-left" size={18} color={T.ink} />
          </TouchableOpacity>
          <View className="flex-row gap-[6px] items-center">
            <View className="w-[18px] h-[6px] rounded-[4px] bg-forest" />
            <View className="w-[6px] h-[6px] rounded-[4px] bg-border" />
            <View className="w-[6px] h-[6px] rounded-[4px] bg-border" />
            <Text className="text-[10px] tracking-[1.5px] text-inkMute ml-1">01/03</Text>
          </View>
          <View className="w-[38px]" />
        </View>

        <View className="pt-5 pb-[22px]">
          <Text className="text-[10px] tracking-[2.5px] text-emeraldDeep uppercase mb-[6px]">PASO 01 · TUS DATOS</Text>
          <Text className="text-[28px] font-bold text-ink tracking-[-1px] leading-[30px]">Creá tu cuenta DePaso</Text>
          <Text className="text-[13.5px] text-inkSoft leading-[19px] mt-[6px]">En 3 pasos cortos. Después podés empezar a enviar.</Text>
        </View>

        {serverError && (
          <View className="flex-row items-center gap-2 bg-redBg rounded-[10px] border border-red p-3 mb-4">
            <MaterialCommunityIcons name="alert-circle-outline" size={16} color={T.red} />
            <Text className="flex-1 text-red text-[13px]">{serverError}</Text>
          </View>
        )}

        <FieldLabel label="¿CÓMO VAS A USAR DEPASO?" />
        <View className="flex-row gap-2 mb-[18px]">
          {([
            { type: UserType.CLIENT,  icon: "cube-outline" as const,  name: "Envío paquetes" },
            { type: UserType.CARRIER, icon: "truck-outline" as const,  name: "Soy cadete" },
          ] as const).map((r) => {
            const active = form.user_type === r.type;
            return (
              <TouchableOpacity
                key={r.type}
                className="flex-1 flex-row items-center gap-2 rounded-[14px] py-3 px-3 relative"
                style={{ backgroundColor: active ? T.forest : T.card, borderWidth: 1.2, borderColor: active ? T.forest : T.border }}
                onPress={() => setForm(p => ({ ...p, user_type: r.type }))}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons name={r.icon} size={18} color={active ? "#F4EFE3" : T.inkSoft} />
                <Text className="text-[13px] font-semibold" style={{ color: active ? "#F4EFE3" : T.inkSoft }}>{r.name}</Text>
                {active && (
                  <View className="absolute top-2 right-2 w-4 h-4 rounded-full bg-lime items-center justify-center">
                    <MaterialCommunityIcons name="check" size={10} color={T.forest} />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <View className="flex-row gap-[10px] mb-0">
          <View className="flex-1">
            <FieldLabel label="NOMBRE" />
            <View
              className="flex-row items-center gap-[10px] bg-card rounded-[14px] px-[14px] h-[52px] mb-1"
              style={{ borderWidth: 1.2, borderColor: errors.first_name ? T.red : form.first_name ? T.forest : T.border }}
            >
              <TextInput
                className="flex-1 text-[15px] text-ink font-medium"
                placeholder="Valentina"
                placeholderTextColor={T.inkFaint}
                value={form.first_name}
                onChangeText={t => update("first_name", t)}
              />
            </View>
            {errors.first_name ? <Text className="text-[11px] text-red mb-[6px] pl-1">{errors.first_name}</Text> : null}
          </View>
          <View className="flex-1">
            <FieldLabel label="APELLIDO" />
            <View
              className="flex-row items-center gap-[10px] bg-card rounded-[14px] px-[14px] h-[52px] mb-1"
              style={{ borderWidth: 1.2, borderColor: errors.last_name ? T.red : form.last_name ? T.forest : T.border }}
            >
              <TextInput
                className="flex-1 text-[15px] text-ink font-medium"
                placeholder="Rossi"
                placeholderTextColor={T.inkFaint}
                value={form.last_name}
                onChangeText={t => update("last_name", t)}
              />
            </View>
            {errors.last_name ? <Text className="text-[11px] text-red mb-[6px] pl-1">{errors.last_name}</Text> : null}
          </View>
        </View>

        <FieldLabel label="EMAIL" />
        <View
          className="flex-row items-center gap-[10px] bg-card rounded-[14px] px-[14px] h-[52px] mb-1"
          style={{ borderWidth: 1.2, borderColor: errors.email ? T.red : form.email ? T.forest : T.border }}
        >
          <MaterialCommunityIcons name="email-outline" size={18} color={T.inkMute} />
          <TextInput
            className="flex-1 text-[15px] text-ink font-medium"
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
        {errors.email ? <Text className="text-[11px] text-red mb-[6px] pl-1">{errors.email}</Text> : null}

        <View className="h-[10px]" />
        <FieldLabel label="CELULAR (opcional)" />
        <View className="flex-row gap-2 mb-1">
          <View
            className="flex-row items-center gap-2 bg-card rounded-[14px] px-3 h-[52px]"
            style={{ borderWidth: 1.2, borderColor: T.border }}
          >
            <View className="w-[22px] h-[14px] rounded-sm overflow-hidden flex-col">
              <View className="flex-1 bg-[#75AADB]" />
              <View className="flex-1 bg-[#F4EFE3]" />
              <View className="flex-1 bg-[#75AADB]" />
            </View>
            <Text className="text-sm font-medium text-ink">+54</Text>
            <MaterialCommunityIcons name="chevron-down" size={14} color={T.inkMute} />
          </View>
          <View
            className="flex-1 flex-row items-center gap-[10px] bg-card rounded-[14px] px-[14px] h-[52px]"
            style={{ borderWidth: 1.2, borderColor: form.phone_number ? T.forest : T.border }}
          >
            <TextInput
              className="flex-1 text-[15px] text-ink font-medium"
              placeholder="11 5821-9043"
              placeholderTextColor={T.inkFaint}
              keyboardType="phone-pad"
              value={form.phone_number}
              onChangeText={t => update("phone_number", t)}
            />
          </View>
        </View>

        <View className="h-[10px]" />
        <FieldLabel label="CONTRASEÑA" />
        <View
          className="flex-row items-center gap-[10px] bg-card rounded-[14px] px-[14px] h-[52px] mb-1"
          style={{ borderWidth: 1.2, borderColor: errors.password ? T.red : form.password ? T.forest : T.border }}
        >
          <MaterialCommunityIcons name="lock-outline" size={18} color={T.inkMute} />
          <TextInput
            className="flex-1 text-[15px] text-ink font-medium"
            placeholder="Mínimo 8 caracteres"
            placeholderTextColor={T.inkFaint}
            secureTextEntry={!showPwd}
            value={form.password}
            onChangeText={t => update("password", t)}
          />
          <TouchableOpacity onPress={() => setShowPwd(v => !v)} hitSlop={8}>
            <Text className="text-[10px] text-inkMute font-semibold tracking-[0.5px]">{showPwd ? "OCU" : "VER"}</Text>
          </TouchableOpacity>
        </View>
        {errors.password ? <Text className="text-[11px] text-red mb-[6px] pl-1">{errors.password}</Text> : null}

        {form.password.length > 0 && (
          <View className="flex-row items-center gap-2 mt-[-2px] mb-1 pl-1">
            <View className="flex-row gap-[3px]">
              {[1, 2, 3, 4].map((i) => (
                <View key={i} className="w-[30px] h-1 rounded-[4px]" style={{ backgroundColor: i <= strength ? STRENGTH_COLORS[strength] : T.border }} />
              ))}
            </View>
            <Text className="text-[9px] tracking-[1.5px] font-bold uppercase" style={{ color: STRENGTH_COLORS[strength] }}>
              {STRENGTH_LABELS[strength]}
            </Text>
          </View>
        )}

        <View className="h-[10px]" />
        <FieldLabel label="CONFIRMAR CONTRASEÑA" />
        <View
          className="flex-row items-center gap-[10px] bg-card rounded-[14px] px-[14px] h-[52px] mb-1"
          style={{ borderWidth: 1.2, borderColor: errors.confirmPassword ? T.red : form.confirmPassword ? T.forest : T.border }}
        >
          <MaterialCommunityIcons name="lock-check-outline" size={18} color={T.inkMute} />
          <TextInput
            className="flex-1 text-[15px] text-ink font-medium"
            placeholder="Repetí tu contraseña"
            placeholderTextColor={T.inkFaint}
            secureTextEntry={!showPwd}
            value={form.confirmPassword}
            onChangeText={t => update("confirmPassword", t)}
          />
        </View>
        {errors.confirmPassword ? <Text className="text-[11px] text-red mb-[6px] pl-1">{errors.confirmPassword}</Text> : null}

        <TouchableOpacity
          className="flex-row items-start gap-[10px] mt-[18px]"
          onPress={() => setAccepted(v => !v)}
          activeOpacity={0.8}
        >
          <View
            className="w-5 h-5 rounded-md shrink-0 mt-px items-center justify-center"
            style={{ borderWidth: 1.5, borderColor: accepted ? T.forest : T.border, backgroundColor: accepted ? T.forest : T.card }}
          >
            {accepted && <MaterialCommunityIcons name="check" size={12} color="#F4EFE3" />}
          </View>
          <Text className="flex-1 text-xs text-inkSoft leading-[18px]">
            {"Acepto los "}
            <Text className="text-forest font-semibold">términos</Text>
            {" y la "}
            <Text className="text-forest font-semibold">política de privacidad</Text>
            {" de DePaso."}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <View
        className="absolute bottom-0 left-0 right-0 px-6 pt-4 bg-bg border-t border-border"
        style={{ paddingBottom: insets.bottom + 16 }}
      >
        <TouchableOpacity
          className={`rounded-2xl h-[54px] flex-row items-center justify-center gap-[10px] mb-2 ${isLoading ? "opacity-65" : ""}`}
          style={{ backgroundColor: T.forest, shadowColor: T.forest, shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.4, shadowRadius: 20, elevation: 5 }}
          onPress={handleRegister}
          disabled={isLoading}
          activeOpacity={0.88}
        >
          {isLoading
            ? <ActivityIndicator color="#F4EFE3" />
            : <>
                <Text className="text-[#F4EFE3] font-semibold text-[15px]">Continuar al paso 2</Text>
                <MaterialCommunityIcons name="arrow-right" size={18} color="#F4EFE3" />
              </>
          }
        </TouchableOpacity>
        <View className="flex-row justify-center items-center gap-[6px]">
          <Text className="text-inkSoft text-xs">¿Ya tenés cuenta?</Text>
          <TouchableOpacity onPress={() => router.replace("/(auth)/login")} hitSlop={8}>
            <Text className="text-forest font-bold text-xs underline">Iniciá sesión</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
