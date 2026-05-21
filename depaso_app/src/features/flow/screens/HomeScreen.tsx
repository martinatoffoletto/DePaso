import { View, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuthStore } from "@/src/stores/authStore";

type HomeScreenProps = {
  onStart: () => void;
};

export function HomeScreen({ onStart }: HomeScreenProps) {
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const firstName = user?.first_name ?? "Usuario";

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text variant="bodyMedium" style={styles.greeting}>Hola, {firstName} 👋</Text>
          <Text variant="headlineMedium" style={styles.title}>DePaso</Text>
        </View>
        <View style={styles.logoBadge}>
          <MaterialCommunityIcons name="leaf" size={22} color="#fff" />
        </View>
      </View>

      {/* CTA principal */}
      <TouchableOpacity style={styles.ctaCard} onPress={onStart} activeOpacity={0.88}>
        <View style={styles.ctaLeft}>
          <MaterialCommunityIcons name="magnify" size={26} color="#16A34A" />
          <View>
            <Text variant="titleMedium" style={styles.ctaTitle}>¿A dónde querés enviar?</Text>
            <Text variant="bodySmall" style={styles.ctaSub}>Tocá para elegir origen y destino</Text>
          </View>
        </View>
        <MaterialCommunityIcons name="arrow-right-circle" size={32} color="#16A34A" />
      </TouchableOpacity>

      {/* Tipos de servicio */}
      <Text variant="labelMedium" style={styles.sectionLabel}>¿QUÉ NECESITÁS?</Text>
      <View style={styles.serviceGrid}>
        {SERVICES.map(s => (
          <TouchableOpacity key={s.id} style={styles.serviceCard} onPress={onStart} activeOpacity={0.8}>
            <View style={[styles.serviceIcon, { backgroundColor: s.bg }]}>
              <MaterialCommunityIcons name={s.icon as any} size={24} color={s.color} />
            </View>
            <Text variant="labelLarge" style={styles.serviceLabel}>{s.label}</Text>
            <Text variant="bodySmall" style={styles.serviceDesc} numberOfLines={2}>{s.desc}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Eco badge */}
      <View style={styles.ecoBanner}>
        <MaterialCommunityIcons name="leaf" size={18} color="#16A34A" />
        <View style={styles.ecoTexts}>
          <Text variant="labelLarge" style={styles.ecoTitle}>Logística colaborativa</Text>
          <Text variant="bodySmall" style={styles.ecoSub}>
            Compartiendo viajes reducimos hasta 1.8 kg de CO₂ por envío en AMBA
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const SERVICES = [
  { id: "express",   icon: "lightning-bolt",      bg: "#FEF3C7", color: "#F59E0B", label: "Express",    desc: "Retiro y entrega el mismo día" },
  { id: "flete",     icon: "truck-outline",        bg: "#FEE2E2", color: "#EF4444", label: "Flete",      desc: "Muebles, mudanza y voluminosos" },
  { id: "encomienda",icon: "mailbox-outline",      bg: "#EDE9FE", color: "#7C3AED", label: "Encomienda", desc: "Programá tu envío con tiempo" },
  { id: "logistica", icon: "store-outline",        bg: "#DCFCE7", color: "#16A34A", label: "Logística",  desc: "Soluciones para comercios y pymes" },
];

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  content: { paddingHorizontal: 20, gap: 20 },

  header: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  greeting: { color: "#64748B" },
  title: { fontWeight: "800", color: "#0F172A", letterSpacing: -0.5 },
  logoBadge: { width: 48, height: 48, borderRadius: 14, backgroundColor: "#16A34A", alignItems: "center", justifyContent: "center" },

  ctaCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "#BBF7D0",
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#16A34A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  ctaLeft: { flexDirection: "row", alignItems: "center", gap: 14, flex: 1 },
  ctaTitle: { fontWeight: "700", color: "#0F172A" },
  ctaSub: { color: "#64748B", marginTop: 2 },

  sectionLabel: { color: "#94A3B8", letterSpacing: 1 },
  serviceGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  serviceCard: { width: "48%", backgroundColor: "#fff", borderRadius: 14, borderWidth: 1, borderColor: "#E2E8F0", padding: 14, gap: 8 },
  serviceIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  serviceLabel: { fontWeight: "700", color: "#0F172A" },
  serviceDesc: { color: "#64748B", lineHeight: 16 },

  ecoBanner: { flexDirection: "row", gap: 12, backgroundColor: "#F0FDF4", borderRadius: 14, padding: 16, borderWidth: 1, borderColor: "#BBF7D0", alignItems: "flex-start" },
  ecoTexts: { flex: 1, gap: 4 },
  ecoTitle: { fontWeight: "700", color: "#15803D" },
  ecoSub: { color: "#16A34A", lineHeight: 18 },
});
