import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Text } from "react-native-paper";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuthStore } from "@/src/stores/authStore";
import { T } from "@/constants/tokens";

// Waypoint mark approximation for RN (origin ring + arc dots + destination filled circle)
function WaypointMark({ size = 68 }: { size?: number }) {
  const s = size;
  return (
    <View style={{ width: s, height: s, alignItems: "center", justifyContent: "center", position: "relative" }}>
      {/* Origin ring */}
      <View style={{
        position: "absolute", bottom: 6, left: s * 0.18,
        width: s * 0.18, height: s * 0.18, borderRadius: s * 0.09,
        backgroundColor: "#F4EFE3",
      }} />
      <View style={{
        position: "absolute", bottom: 6, left: s * 0.18 + s * 0.05,
        width: s * 0.08, height: s * 0.08, borderRadius: s * 0.04,
        backgroundColor: T.forest,
      }} />
      {/* Route dots */}
      {[0, 1, 2, 3].map((i) => (
        <View key={i} style={{
          position: "absolute",
          bottom: s * 0.18 + i * s * 0.09,
          left: s * 0.22 + i * s * 0.07,
          width: 4, height: 4, borderRadius: 2,
          backgroundColor: "rgba(244,239,227,0.5)",
        }} />
      ))}
      {/* Destination pin */}
      <View style={{
        position: "absolute", top: 6, right: s * 0.1,
        width: s * 0.32, height: s * 0.32, borderRadius: s * 0.16,
        backgroundColor: T.lime,
        alignItems: "center", justifyContent: "center",
      }}>
        <View style={{ width: s * 0.1, height: s * 0.1, borderRadius: s * 0.05, backgroundColor: T.forest }} />
      </View>
    </View>
  );
}

const FEATURES = [
  { icon: "lightning-bolt" as const, title: "Mismo día",    sub: "En 3h o menos" },
  { icon: "leaf"           as const, title: "−1.8 kg CO₂",  sub: "Por envío" },
  { icon: "map-marker-path" as const, title: "En vivo",      sub: "Seguí tu envío" },
];

export default function Index() {
  // Auth gating lives in the root layout (Stack.Protected); this screen only
  // shows the splash while the token is restored, then the welcome.
  const isLoading = useAuthStore((s) => s.isLoading);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  if (isLoading) {
    return (
      <View style={[styles.splash, { paddingTop: insets.top }]}>
        <View style={styles.splashMark}>
          <WaypointMark size={56} />
        </View>
        <Text style={styles.splashWordmark}>
          de<Text style={styles.splashDot}>·</Text>paso
        </Text>
        <Text style={styles.splashSub}>LOGÍSTICA COLABORATIVA · BA</Text>
        <View style={styles.splashProgress}>
          <View style={styles.splashBar} />
        </View>
        <Text style={styles.splashBarLabel}>CARGANDO RUTAS</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Brand section */}
      <View style={styles.brand}>
        <View style={styles.markBox}>
          <WaypointMark size={68} />
        </View>
        <Text style={styles.tagline}>
          {"LOGÍSTICA COLABORATIVA · AMBA"}
        </Text>
        <Text style={styles.headline}>
          {"Mandá liviano.\n"}
          <Text style={styles.headlineLime}>{"Llegá lejos."}</Text>
        </Text>
        <Text style={styles.desc}>
          Compartimos viajes en Buenos Aires para que envíes más barato y con menos CO₂.
        </Text>
      </View>

      {/* Feature cards */}
      <View style={[styles.featureRow, { marginBottom: insets.bottom > 0 ? 0 : 20 }]}>
        {FEATURES.map((f, i) => (
          <View key={i} style={styles.featureCard}>
            <MaterialCommunityIcons name={f.icon} size={18} color={T.lime} style={{ marginBottom: 8 }} />
            <Text style={styles.featureTitle}>{f.title}</Text>
            <Text style={styles.featureSub}>{f.sub}</Text>
          </View>
        ))}
      </View>

      {/* CTAs */}
      <View style={[styles.ctas, { paddingBottom: insets.bottom + 28 }]}>
        <TouchableOpacity
          style={styles.primaryCta}
          onPress={() => router.push("/(auth)/register")}
          activeOpacity={0.88}
        >
          <Text style={styles.primaryCtaText}>Crear cuenta</Text>
          <MaterialCommunityIcons name="arrow-right" size={18} color={T.forest} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryCta}
          onPress={() => router.push("/(auth)/login")}
          activeOpacity={0.75}
        >
          <Text style={styles.secondaryCtaText}>Ya tengo cuenta · Ingresar</Text>
        </TouchableOpacity>

        <Text style={styles.legal}>
          AL CONTINUAR ACEPTÁS LOS TÉRMINOS Y LA PRIVACIDAD
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Splash / loading
  splash: {
    flex: 1, backgroundColor: T.forest,
    alignItems: "center", justifyContent: "center", gap: 6,
  },
  splashMark: { marginBottom: 20 },
  splashWordmark: {
    fontSize: 48, fontWeight: "700", color: "#F4EFE3",
    letterSpacing: -2, lineHeight: 48,
  },
  splashDot: { color: T.lime },
  splashSub: {
    fontSize: 10, letterSpacing: 3.5, color: "rgba(244,239,227,0.75)",
    textTransform: "uppercase", marginTop: 6,
  },
  splashProgress: {
    width: 120, height: 3, borderRadius: 2,
    backgroundColor: "rgba(244,239,227,0.15)",
    marginTop: 32, overflow: "hidden",
  },
  splashBar: { width: "65%", height: "100%", backgroundColor: T.lime },
  splashBarLabel: {
    fontSize: 9, letterSpacing: 2.5, color: "rgba(244,239,227,0.75)",
    textTransform: "uppercase", marginTop: 8,
  },

  // Welcome
  container: { flex: 1, backgroundColor: T.forest },

  brand: { flex: 1, paddingHorizontal: 32, paddingTop: 32 },
  markBox: { marginBottom: 22 },
  tagline: {
    fontSize: 10, letterSpacing: 3,
    color: "rgba(244,239,227,0.8)", textTransform: "uppercase", marginBottom: 10,
  },
  headline: {
    fontSize: 40, fontWeight: "700", color: "#F4EFE3",
    letterSpacing: -2, lineHeight: 42,
  },
  headlineLime: { color: T.lime },
  desc: {
    fontSize: 15, color: "rgba(244,239,227,0.65)",
    marginTop: 14, lineHeight: 22, maxWidth: "90%",
  },

  featureRow: { flexDirection: "row", paddingHorizontal: 24, gap: 10 },
  featureCard: {
    flex: 1,
    backgroundColor: "rgba(244,239,227,0.06)",
    borderWidth: 1, borderColor: "rgba(244,239,227,0.1)",
    borderRadius: 14, padding: 12,
  },
  featureTitle: { fontSize: 13, fontWeight: "600", color: "#F4EFE3", letterSpacing: -0.2 },
  featureSub: {
    fontSize: 9, letterSpacing: 1,
    color: "rgba(244,239,227,0.75)", textTransform: "uppercase", marginTop: 2,
  },

  ctas: { paddingHorizontal: 24, gap: 10, marginTop: 16 },
  primaryCta: {
    backgroundColor: "#F4EFE3",
    borderRadius: 16, paddingVertical: 16,
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
  },
  primaryCtaText: { color: T.forest, fontSize: 15, fontWeight: "600" },
  secondaryCta: {
    borderWidth: 1, borderColor: "rgba(244,239,227,0.2)",
    borderRadius: 16, paddingVertical: 15,
    alignItems: "center",
  },
  secondaryCtaText: { color: "#F4EFE3", fontSize: 14, fontWeight: "500" },
  legal: {
    fontSize: 9, letterSpacing: 1.5, textAlign: "center",
    color: "rgba(244,239,227,0.35)", textTransform: "uppercase", marginTop: 4,
  },
});
