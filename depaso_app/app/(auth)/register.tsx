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
import { carriersService } from "@/src/services/carriers";
import { TransportType, UserType } from "@/src/types";
import { T } from "@/constants/tokens";

const VEHICLES: { type: TransportType; label: string; icon: any; capacityKg: number }[] = [
  { type: TransportType.PEDESTRIAN, label: "A pie",     icon: "walk",          capacityKg: 5 },
  { type: TransportType.BIKE,       label: "Bici",      icon: "bike",          capacityKg: 8 },
  { type: TransportType.MOTORCYCLE, label: "Moto",      icon: "motorbike",     capacityKg: 15 },
  { type: TransportType.CAR,        label: "Auto",      icon: "car",           capacityKg: 80 },
  { type: TransportType.VAN,        label: "Camioneta", icon: "van-utility",   capacityKg: 600 },
  { type: TransportType.TRUCK,      label: "Camión",    icon: "truck",         capacityKg: 2000 },
];

function pwdStrength(pwd: string): number {
  if (!pwd) return 0;
  if (pwd.length < 5) return 1;
  if (pwd.length < 8) return 2;
  if (pwd.length < 12) return 3;
  return 4;
}

const STRENGTH_LABELS = ["", "Débil", "Regular", "Buena", "Fuerte"];
const STRENGTH_COLORS = [T.border, T.red, T.amber, T.emerald, T.emerald];

function Label({ text }: { text: string }) {
  return (
    <Text style={{ fontSize: 9.5, letterSpacing: 1.5, color: T.inkMute, textTransform: "uppercase", fontWeight: "700", marginBottom: 8 }}>
      {text}
    </Text>
  );
}

function Field({ icon, placeholder, value, onChangeText, secureTextEntry, keyboardType, autoCapitalize, error, right }: any) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: T.card, borderRadius: 16, paddingHorizontal: 14, height: 52, borderWidth: 1.2, borderColor: error ? T.red : value ? T.forest : T.border }}>
      {icon && <MaterialCommunityIcons name={icon} size={18} color={error ? T.red : T.inkMute} />}
      <TextInput
        style={{ flex: 1, fontSize: 15, color: T.ink, fontWeight: "500" }}
        placeholder={placeholder}
        placeholderTextColor={T.inkFaint}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType ?? "default"}
        autoCapitalize={autoCapitalize ?? "sentences"}
        autoCorrect={false}
      />
      {right}
    </View>
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
  const [vehicleType, setVehicleType] = useState<TransportType>(TransportType.MOTORCYCLE);
  const [licensePlate, setLicensePlate] = useState("");

  const isCarrier = form.user_type === UserType.CARRIER;
  const needsPlate = ![TransportType.PEDESTRIAN, TransportType.BIKE].includes(vehicleType);
  const strength = pwdStrength(form.password);

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
    if (isCarrier && needsPlate && !licensePlate.trim()) e.license_plate = "Obligatorio";
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
      if (isCarrier) {
        const me = useAuthStore.getState().user;
        const vehicle = VEHICLES.find(v => v.type === vehicleType)!;
        if (me) {
          await carriersService.createProfile({
            user_id: me.id,
            company_name: `${form.first_name.trim()} ${form.last_name.trim()}`,
            vehicle_type: vehicleType,
            license_plate: needsPlate
              ? licensePlate.trim().toUpperCase()
              : `NP-${me.id}-${Date.now() % 10000}`,
            capacity_kg: vehicle.capacityKg,
          });
        }
      }
    } catch (error: any) {
      setServerError(error?.response?.data?.detail ?? "Error al crear la cuenta");
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: T.bg }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      {/* ── Hero ── */}
      <View style={{ backgroundColor: T.forest, paddingTop: insets.top + 12, paddingHorizontal: 24, paddingBottom: 28 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <TouchableOpacity
            style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: "rgba(244,239,227,0.12)", borderWidth: 1, borderColor: "rgba(244,239,227,0.18)", alignItems: "center", justifyContent: "center" }}
            onPress={() => router.back()} hitSlop={10}
          >
            <MaterialCommunityIcons name="arrow-left" size={18} color="#F4EFE3" />
          </TouchableOpacity>
          {/* Step dots */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
            <View style={{ width: 20, height: 6, borderRadius: 4, backgroundColor: "#F4EFE3" }} />
            <View style={{ width: 6, height: 6, borderRadius: 4, backgroundColor: "rgba(244,239,227,0.25)" }} />
            <View style={{ width: 6, height: 6, borderRadius: 4, backgroundColor: "rgba(244,239,227,0.25)" }} />
            <Text style={{ fontSize: 10, letterSpacing: 1.5, color: "rgba(244,239,227,0.7)", marginLeft: 4 }}>01/03</Text>
          </View>
          <View style={{ width: 38 }} />
        </View>

        <Text style={{ fontSize: 10, letterSpacing: 2.5, color: "rgba(244,239,227,0.75)", textTransform: "uppercase", marginBottom: 6, fontWeight: "700" }}>
          TUS DATOS
        </Text>
        <Text style={{ fontSize: 32, fontWeight: "800", color: "#F4EFE3", letterSpacing: -1.2, lineHeight: 36 }}>
          Creá tu cuenta
        </Text>
        <Text style={{ fontSize: 13.5, color: "rgba(244,239,227,0.8)", marginTop: 8, lineHeight: 19 }}>
          En 3 pasos. Después empezás a enviar.
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: insets.bottom + 120 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {serverError && (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: T.redBg, borderRadius: 12, borderWidth: 1, borderColor: T.red, padding: 14, marginBottom: 20 }}>
            <MaterialCommunityIcons name="alert-circle-outline" size={18} color={T.red} />
            <Text style={{ flex: 1, color: T.red, fontSize: 13 }}>{serverError}</Text>
          </View>
        )}

        {/* ── Role selector ── */}
        <Label text="¿Cómo vas a usar DePaso?" />
        <View style={{ flexDirection: "row", gap: 10, marginBottom: 22 }}>
          {([
            { type: UserType.CLIENT,  icon: "cube-outline" as const,  title: "Envío paquetes", sub: "Clientes y empresas" },
            { type: UserType.CARRIER, icon: "truck-outline" as const,  title: "Soy cadete",     sub: "Reparto y entregas" },
          ] as const).map((r) => {
            const active = form.user_type === r.type;
            return (
              <TouchableOpacity
                key={r.type}
                style={{ flex: 1, borderRadius: 18, padding: 16, backgroundColor: active ? T.forest : T.card, borderWidth: 1.5, borderColor: active ? T.forest : T.border, gap: 10 }}
                onPress={() => setForm(p => ({ ...p, user_type: r.type }))}
                activeOpacity={0.8}
              >
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <View style={{ width: 36, height: 36, borderRadius: 11, alignItems: "center", justifyContent: "center", backgroundColor: active ? "rgba(244,239,227,0.15)" : T.cardSoft }}>
                    <MaterialCommunityIcons name={r.icon} size={18} color={active ? "#F4EFE3" : T.inkSoft} />
                  </View>
                  {active && (
                    <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: T.lime, alignItems: "center", justifyContent: "center" }}>
                      <MaterialCommunityIcons name="check" size={12} color={T.forest} />
                    </View>
                  )}
                </View>
                <View>
                  <Text style={{ fontSize: 14, fontWeight: "700", color: active ? "#F4EFE3" : T.ink, letterSpacing: -0.2 }}>{r.title}</Text>
                  <Text style={{ fontSize: 11.5, color: active ? "rgba(244,239,227,0.6)" : T.inkMute, marginTop: 2 }}>{r.sub}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Carrier: vehicle + plate ── */}
        {isCarrier && (
          <View style={{ marginBottom: 22 }}>
            <Label text="Tu vehículo" />
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
              {VEHICLES.map(v => {
                const active = vehicleType === v.type;
                return (
                  <TouchableOpacity
                    key={v.type}
                    style={{ flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 9, backgroundColor: active ? T.forest : T.card, borderWidth: 1.2, borderColor: active ? T.forest : T.border }}
                    onPress={() => setVehicleType(v.type)}
                    activeOpacity={0.8}
                  >
                    <MaterialCommunityIcons name={v.icon} size={14} color={active ? T.lime : T.inkSoft} />
                    <Text style={{ fontSize: 12.5, fontWeight: "600", color: active ? "#F4EFE3" : T.inkSoft }}>{v.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {needsPlate && (
              <>
                <Label text="Patente" />
                <Field
                  icon="card-text-outline"
                  placeholder="AB123CD"
                  value={licensePlate}
                  onChangeText={(t: string) => { setLicensePlate(t); if (errors.license_plate) setErrors(p => ({ ...p, license_plate: "" })); }}
                  autoCapitalize="characters"
                  error={errors.license_plate}
                />
                {errors.license_plate ? <Text style={{ fontSize: 11, color: T.red, marginTop: 4, paddingLeft: 4 }}>{errors.license_plate}</Text> : null}
                <View style={{ height: 10 }} />
              </>
            )}
            <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 10, backgroundColor: T.mint, borderRadius: 12, borderWidth: 1, borderColor: T.border, padding: 12, marginTop: 4 }}>
              <MaterialCommunityIcons name="shield-check-outline" size={16} color={T.forest} style={{ marginTop: 1 }} />
              <Text style={{ flex: 1, fontSize: 12, color: T.forest, lineHeight: 17, fontWeight: "500" }}>
                Tu cuenta de cadete queda pendiente de verificación antes de poder aceptar pedidos.
              </Text>
            </View>
          </View>
        )}

        {/* ── Name ── */}
        <View style={{ flexDirection: "row", gap: 10, marginBottom: 14 }}>
          <View style={{ flex: 1 }}>
            <Label text="Nombre" />
            <Field placeholder="Valentina" value={form.first_name} onChangeText={(t: string) => update("first_name", t)} error={errors.first_name} />
            {errors.first_name ? <Text style={{ fontSize: 11, color: T.red, marginTop: 4, paddingLeft: 4 }}>{errors.first_name}</Text> : null}
          </View>
          <View style={{ flex: 1 }}>
            <Label text="Apellido" />
            <Field placeholder="Rossi" value={form.last_name} onChangeText={(t: string) => update("last_name", t)} error={errors.last_name} />
            {errors.last_name ? <Text style={{ fontSize: 11, color: T.red, marginTop: 4, paddingLeft: 4 }}>{errors.last_name}</Text> : null}
          </View>
        </View>

        {/* ── Email ── */}
        <Label text="Email" />
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: T.card, borderRadius: 16, paddingHorizontal: 14, height: 52, borderWidth: 1.2, borderColor: errors.email ? T.red : form.email ? T.forest : T.border, marginBottom: 4 }}>
          <MaterialCommunityIcons name="email-outline" size={18} color={errors.email ? T.red : T.inkMute} />
          <TextInput
            style={{ flex: 1, fontSize: 15, color: T.ink, fontWeight: "500" }}
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
        {errors.email ? <Text style={{ fontSize: 11, color: T.red, marginBottom: 8, paddingLeft: 4 }}>{errors.email}</Text> : null}

        {/* ── Phone ── */}
        <View style={{ height: 16 }} />
        <Label text="Celular (opcional)" />
        <View style={{ flexDirection: "row", gap: 8, marginBottom: 4 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: T.card, borderRadius: 16, paddingHorizontal: 12, height: 52, borderWidth: 1.2, borderColor: T.border }}>
            <View style={{ width: 22, height: 14, borderRadius: 3, overflow: "hidden", flexDirection: "column" }}>
              <View style={{ flex: 1, backgroundColor: "#75AADB" }} />
              <View style={{ flex: 1, backgroundColor: "#F4EFE3" }} />
              <View style={{ flex: 1, backgroundColor: "#75AADB" }} />
            </View>
            <Text style={{ fontSize: 14, fontWeight: "600", color: T.ink }}>+54</Text>
          </View>
          <View style={{ flex: 1, flexDirection: "row", alignItems: "center", backgroundColor: T.card, borderRadius: 16, paddingHorizontal: 14, height: 52, borderWidth: 1.2, borderColor: form.phone_number ? T.forest : T.border }}>
            <TextInput
              style={{ flex: 1, fontSize: 15, color: T.ink, fontWeight: "500" }}
              placeholder="11 5821-9043"
              placeholderTextColor={T.inkFaint}
              keyboardType="phone-pad"
              value={form.phone_number}
              onChangeText={t => update("phone_number", t)}
            />
          </View>
        </View>

        {/* ── Password ── */}
        <View style={{ height: 16 }} />
        <Label text="Contraseña" />
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: T.card, borderRadius: 16, paddingHorizontal: 14, height: 52, borderWidth: 1.2, borderColor: errors.password ? T.red : form.password ? T.forest : T.border, marginBottom: 4 }}>
          <MaterialCommunityIcons name="lock-outline" size={18} color={errors.password ? T.red : T.inkMute} />
          <TextInput
            style={{ flex: 1, fontSize: 15, color: T.ink, fontWeight: "500" }}
            placeholder="Mínimo 8 caracteres"
            placeholderTextColor={T.inkFaint}
            secureTextEntry={!showPwd}
            value={form.password}
            onChangeText={t => update("password", t)}
          />
          <TouchableOpacity onPress={() => setShowPwd(v => !v)} hitSlop={10}>
            <MaterialCommunityIcons name={showPwd ? "eye-off-outline" : "eye-outline"} size={18} color={T.inkMute} />
          </TouchableOpacity>
        </View>
        {errors.password ? <Text style={{ fontSize: 11, color: T.red, marginBottom: 6, paddingLeft: 4 }}>{errors.password}</Text> : null}
        {form.password.length > 0 && (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 2, paddingLeft: 2 }}>
            <View style={{ flexDirection: "row", gap: 4 }}>
              {[1, 2, 3, 4].map(i => (
                <View key={i} style={{ width: 28, height: 4, borderRadius: 3, backgroundColor: i <= strength ? STRENGTH_COLORS[strength] : T.border }} />
              ))}
            </View>
            <Text style={{ fontSize: 10, letterSpacing: 1, fontWeight: "700", color: STRENGTH_COLORS[strength], textTransform: "uppercase" }}>
              {STRENGTH_LABELS[strength]}
            </Text>
          </View>
        )}

        {/* ── Confirm password ── */}
        <View style={{ height: 14 }} />
        <Label text="Repetí la contraseña" />
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: T.card, borderRadius: 16, paddingHorizontal: 14, height: 52, borderWidth: 1.2, borderColor: errors.confirmPassword ? T.red : form.confirmPassword ? T.forest : T.border, marginBottom: 4 }}>
          <MaterialCommunityIcons name="lock-check-outline" size={18} color={errors.confirmPassword ? T.red : T.inkMute} />
          <TextInput
            style={{ flex: 1, fontSize: 15, color: T.ink, fontWeight: "500" }}
            placeholder="Repetí tu contraseña"
            placeholderTextColor={T.inkFaint}
            secureTextEntry={!showPwd}
            value={form.confirmPassword}
            onChangeText={t => update("confirmPassword", t)}
          />
          {form.confirmPassword && form.password === form.confirmPassword && (
            <MaterialCommunityIcons name="check-circle-outline" size={18} color={T.emerald} />
          )}
        </View>
        {errors.confirmPassword ? <Text style={{ fontSize: 11, color: T.red, marginBottom: 6, paddingLeft: 4 }}>{errors.confirmPassword}</Text> : null}

        {/* ── Terms ── */}
        <TouchableOpacity
          style={{ flexDirection: "row", alignItems: "flex-start", gap: 12, marginTop: 20 }}
          onPress={() => setAccepted(v => !v)}
          activeOpacity={0.8}
        >
          <View style={{ width: 22, height: 22, borderRadius: 7, borderWidth: 1.5, borderColor: accepted ? T.forest : T.border, backgroundColor: accepted ? T.forest : T.card, alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
            {accepted && <MaterialCommunityIcons name="check" size={13} color="#F4EFE3" />}
          </View>
          <Text style={{ flex: 1, fontSize: 13, color: T.inkSoft, lineHeight: 19 }}>
            {"Acepto los "}
            <Text style={{ color: T.forest, fontWeight: "600" }}>términos</Text>
            {" y la "}
            <Text style={{ color: T.forest, fontWeight: "600" }}>política de privacidad</Text>
            {" de DePaso."}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ── Sticky CTA ── */}
      <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, paddingHorizontal: 24, paddingTop: 16, paddingBottom: insets.bottom + 16, backgroundColor: T.bg, borderTopWidth: 1, borderTopColor: T.border }}>
        <TouchableOpacity
          style={{ backgroundColor: T.forest, borderRadius: 18, height: 56, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 10, shadowColor: T.forest, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 5, opacity: isLoading ? 0.7 : 1 }}
          onPress={handleRegister}
          disabled={isLoading}
          activeOpacity={0.88}
        >
          {isLoading
            ? <ActivityIndicator color="#F4EFE3" />
            : <>
                <Text style={{ color: "#F4EFE3", fontWeight: "700", fontSize: 15 }}>Continuar al paso 2</Text>
                <MaterialCommunityIcons name="arrow-right" size={18} color="#F4EFE3" />
              </>
          }
        </TouchableOpacity>
        <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 6 }}>
          <Text style={{ color: T.inkSoft, fontSize: 13 }}>¿Ya tenés cuenta?</Text>
          <TouchableOpacity onPress={() => router.replace("/(auth)/login")} hitSlop={8}>
            <Text style={{ color: T.forest, fontWeight: "700", fontSize: 13 }}>Iniciá sesión</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
