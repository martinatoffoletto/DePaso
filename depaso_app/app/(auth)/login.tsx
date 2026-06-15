import { useState } from "react";
import {
  View, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Text, Alert,
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
      <View className="flex-1 bg-bg items-center justify-center p-8 gap-4" style={{ paddingTop: insets.top }}>
        <View className="w-24 h-24 rounded-full bg-redBg items-center justify-center">
          <MaterialCommunityIcons name="wifi-off" size={48} color={T.red} />
        </View>
        <Text className="text-xl font-bold text-ink text-center">Sin conexión al servidor</Text>
        <Text className="text-inkSoft text-center leading-[22px]">
          No se pudo contactar con DePaso.{"\n"}Verificá tu conexión o que el backend esté activo.
        </Text>
        <TouchableOpacity
          className="flex-row items-center gap-2 bg-forest rounded-xl px-6 py-3 mt-2"
          onPress={() => setConnError(false)}
          activeOpacity={0.85}
        >
          <MaterialCommunityIcons name="refresh" size={18} color="#fff" />
          <Text className="text-white font-semibold text-[15px]">Reintentar</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.back()} className="mt-3">
          <Text className="text-inkMute text-sm">Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-bg"
      contentContainerStyle={{ paddingHorizontal: 24, paddingTop: insets.top + 6, paddingBottom: insets.bottom + 40 }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View className="flex-row items-center justify-between mb-[6px]">
        <TouchableOpacity
          className="w-[38px] h-[38px] rounded-xl border border-border bg-card items-center justify-center"
          onPress={() => router.back()}
          hitSlop={10}
        >
          <MaterialCommunityIcons name="arrow-left" size={18} color={T.ink} />
        </TouchableOpacity>
        <View className="w-[38px] h-[38px] rounded-[11px] bg-forest items-center justify-center">
          <MaterialCommunityIcons name="map-marker-path" size={18} color="#F4EFE3" />
        </View>
      </View>

      <View className="pt-7 pb-7">
        <Text className="text-[10px] tracking-[2.5px] text-emeraldDeep uppercase mb-[6px]">INGRESÁ</Text>
        <Text className="text-[32px] font-bold text-ink tracking-[-1.2px] leading-[34px]">Hola de nuevo</Text>
        <Text className="text-sm text-inkSoft leading-5 mt-2">
          Entrá a tu cuenta para seguir moviendo paquetes en AMBA.
        </Text>
      </View>

      {serverError && (
        <View className="flex-row items-center gap-2 bg-redBg rounded-[10px] border border-red p-3 mb-4">
          <MaterialCommunityIcons name="alert-circle-outline" size={16} color={T.red} />
          <Text className="flex-1 text-red text-[13px]">{serverError}</Text>
        </View>
      )}

      <Text className="text-[9.5px] tracking-[1.5px] text-inkMute uppercase mb-[6px] font-semibold">EMAIL</Text>
      <View
        className="flex-row items-center gap-[10px] bg-card rounded-[14px] px-[14px] h-[52px] mb-1"
        style={{ borderWidth: 1.2, borderColor: errors.email ? T.red : email ? T.forest : T.border }}
      >
        <MaterialCommunityIcons name="account-outline" size={18} color={T.inkMute} />
        <TextInput
          className="flex-1 text-[15px] text-ink font-medium"
          placeholder="hola@ejemplo.com"
          placeholderTextColor={T.inkFaint}
          autoCapitalize="none"
          keyboardType="email-address"
          autoCorrect={false}
          value={email}
          onChangeText={t => { setEmail(t); if (errors.email) setErrors(e => ({ ...e, email: undefined })); }}
        />
      </View>
      {errors.email && <Text className="text-[11px] text-red mb-[6px] pl-1">{errors.email}</Text>}

      <View className="flex-row justify-between items-center mt-[14px] mb-[6px]">
        <Text className="text-[9.5px] tracking-[1.5px] text-inkMute uppercase font-semibold">CONTRASEÑA</Text>
        <TouchableOpacity hitSlop={8} onPress={() => router.push("/(auth)/forgot-password")}>
          <Text className="text-[9px] tracking-[1px] text-emeraldDeep uppercase font-semibold">OLVIDÉ</Text>
        </TouchableOpacity>
      </View>
      <View
        className="flex-row items-center gap-[10px] bg-card rounded-[14px] px-[14px] h-[52px] mb-1"
        style={{ borderWidth: 1.2, borderColor: errors.password ? T.red : password ? T.forest : T.border }}
      >
        <MaterialCommunityIcons name="shield-outline" size={18} color={T.inkMute} />
        <TextInput
          className="flex-1 text-[15px] text-ink font-medium"
          placeholder="••••••••"
          placeholderTextColor={T.inkFaint}
          secureTextEntry={!showPwd}
          value={password}
          onChangeText={t => { setPassword(t); if (errors.password) setErrors(e => ({ ...e, password: undefined })); }}
        />
        <TouchableOpacity onPress={() => setShowPwd(v => !v)} hitSlop={8}>
          <Text className="text-[10px] text-inkMute font-semibold tracking-[0.5px]">{showPwd ? "OCU" : "VER"}</Text>
        </TouchableOpacity>
      </View>
      {errors.password && <Text className="text-[11px] text-red mb-[6px] pl-1">{errors.password}</Text>}

      <TouchableOpacity
        className={`rounded-2xl h-[54px] flex-row items-center justify-center gap-[10px] mt-6 mb-2 ${isLoading ? "opacity-65" : ""}`}
        style={{ backgroundColor: T.forest, shadowColor: T.forest, shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.4, shadowRadius: 20, elevation: 5 }}
        onPress={handleLogin}
        disabled={isLoading}
        activeOpacity={0.88}
      >
        {isLoading
          ? <ActivityIndicator color="#F4EFE3" />
          : <>
              <Text className="text-[#F4EFE3] font-semibold text-[15px]">Iniciar sesión</Text>
              <MaterialCommunityIcons name="arrow-right" size={18} color="#F4EFE3" />
            </>
        }
      </TouchableOpacity>

      <View className="flex-row items-center gap-3 my-[22px]">
        <View className="flex-1 h-px bg-border" />
        <Text className="text-[9px] tracking-[2px] text-inkMute uppercase">O CONTINUÁ CON</Text>
        <View className="flex-1 h-px bg-border" />
      </View>

      <View className="flex-row gap-[10px] mb-3">
        {[
          { label: "Apple",  dark: true },
          { label: "Google", dark: false },
        ].map((s, i) => (
          <TouchableOpacity key={i} className="flex-1 bg-card border border-border rounded-[14px] py-[14px] flex-row items-center justify-center gap-2" activeOpacity={0.8} onPress={() => Alert.alert("No disponible", "El inicio de sesión con Apple y Google estará disponible próximamente.")}>
            <View className={`w-[22px] h-[22px] rounded-full items-center justify-center ${s.dark ? "bg-ink" : "bg-white border border-border"}`}>
              <Text className="text-[12px] font-bold" style={{ color: s.dark ? "#F4EFE3" : T.ink }}>{s.label[0]}</Text>
            </View>
            <Text className="text-sm font-semibold text-ink">{s.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View className="flex-row justify-center items-center gap-[6px] mt-3">
        <Text className="text-inkSoft text-[13px]">¿No tenés cuenta?</Text>
        <TouchableOpacity onPress={() => router.replace("/(auth)/register")} hitSlop={8}>
          <Text className="text-forest font-bold text-[13px] underline">Crear una</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
