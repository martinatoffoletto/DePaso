import { View, Text } from "react-native";
import { T } from "@/constants/tokens";

function pwdStrength(pwd: string): number {
  if (!pwd) return 0;
  if (pwd.length < 5) return 1;
  if (pwd.length < 8) return 2;
  if (pwd.length < 12) return 3;
  return 4;
}

const STRENGTH_LABELS = ["", "Débil", "Regular", "Buena", "Fuerte"];
const STRENGTH_COLORS = [T.border, T.red, T.amber, T.emerald, T.emerald];

/** Barrita de fuerza de contraseña (4 segmentos + etiqueta). No renderiza nada si está vacía. */
export function PasswordStrengthBar({ password }: { password: string }) {
  if (!password) return null;
  const strength = pwdStrength(password);
  return (
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
  );
}
