import { View, StyleSheet, TouchableOpacity, Image, ActivityIndicator } from "react-native";
import { Text } from "react-native-paper";
import { Redirect, useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuthStore } from "@/src/stores/authStore";

export default function Index() {
  const { isAuthenticated, isLoading } = useAuthStore();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  if (isLoading) {
    return (
      <View style={styles.splash}>
        <Image source={require("../assets/images/DePaso_icon.png")} style={styles.splashIcon} />
        <Text style={styles.splashBrand}>DePaso</Text>
        <ActivityIndicator color="rgba(255,255,255,0.6)" style={{ marginTop: 40 }} />
      </View>
    );
  }

  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 24 }]}>
      {/* Hero verde */}
      <View style={[styles.hero, { paddingTop: insets.top + 32 }]}>
        <Image source={require("../assets/images/DePaso_icon.png")} style={styles.heroIcon} />
        <Text style={styles.heroBrand}>DePaso</Text>
        <Text style={styles.heroTagline}>Logística colaborativa para el AMBA</Text>
      </View>

      {/* Features */}
      <View style={styles.features}>
        <FeatureRow icon="leaf" text="Reducís hasta 1.8 kg de CO₂ por envío colaborativo" />
        <FeatureRow icon="lightning-bolt" text="Match automático con el transportista ideal" />
        <FeatureRow icon="map-marker-path" text="Seguí tu paquete en tiempo real" />
      </View>

      {/* CTAs */}
      <View style={styles.ctas}>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => router.push("/_auth/register")}
          activeOpacity={0.88}
        >
          <Text style={styles.primaryBtnText}>Crear cuenta gratis</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => router.push("/_auth/login")}
          activeOpacity={0.75}
        >
          <Text style={styles.secondaryBtnText}>Ya tengo una cuenta · <Text style={styles.secondaryBtnLink}>Iniciar sesión</Text></Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function FeatureRow({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={fStyles.row}>
      <View style={fStyles.iconWrap}>
        <MaterialCommunityIcons name={icon as any} size={20} color="#16A34A" />
      </View>
      <Text style={fStyles.text}>{text}</Text>
    </View>
  );
}

const fStyles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 14 },
  iconWrap: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: "#F0FDF4", alignItems: "center", justifyContent: "center",
  },
  text: { flex: 1, color: "#475569", fontSize: 14, lineHeight: 20 },
});

const styles = StyleSheet.create({
  // Splash
  splash: {
    flex: 1, backgroundColor: "#16A34A",
    alignItems: "center", justifyContent: "center", gap: 12,
  },
  splashIcon: { width: 88, height: 88, borderRadius: 20 },
  splashBrand: { fontSize: 32, fontWeight: "800", color: "#fff", letterSpacing: -0.5 },

  // Landing
  container: { flex: 1, backgroundColor: "#fff" },

  hero: {
    backgroundColor: "#16A34A", alignItems: "center",
    paddingBottom: 36, paddingHorizontal: 24, gap: 8,
  },
  heroIcon: { width: 80, height: 80, borderRadius: 18, marginBottom: 4 },
  heroBrand: { fontSize: 30, fontWeight: "800", color: "#fff", letterSpacing: -0.5 },
  heroTagline: { fontSize: 14, color: "rgba(255,255,255,0.82)", textAlign: "center" },

  features: { flex: 1, paddingHorizontal: 24, paddingTop: 32, gap: 20 },

  ctas: { paddingHorizontal: 24, gap: 12 },
  primaryBtn: {
    backgroundColor: "#16A34A", borderRadius: 14,
    paddingVertical: 16, alignItems: "center",
  },
  primaryBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  secondaryBtn: { alignItems: "center", paddingVertical: 10 },
  secondaryBtnText: { color: "#94A3B8", fontSize: 14 },
  secondaryBtnLink: { color: "#16A34A", fontWeight: "600" },
});
