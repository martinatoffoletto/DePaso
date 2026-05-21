import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuthStore } from "@/src/stores/authStore";

const ROLE_LABEL: Record<string, string> = {
  client: "Cliente",
  carrier: "Transportista",
};

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuthStore();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text variant="headlineSmall" style={styles.title}>
          Perfil
        </Text>
      </View>

      {/* Avatar + info */}
      <View style={styles.avatarSection}>
        <View style={styles.avatar}>
          <MaterialCommunityIcons name="account" size={44} color="#94A3B8" />
        </View>
        <Text variant="titleLarge" style={styles.name}>
          {user?.first_name} {user?.last_name}
        </Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {ROLE_LABEL[user?.user_type ?? "client"] ?? user?.user_type}
          </Text>
        </View>
      </View>

      {/* Info rows */}
      <View style={styles.card}>
        <InfoRow icon="email-outline" label="Email" value={user?.email ?? "—"} />
        <View style={styles.rowDivider} />
        <InfoRow
          icon="phone-outline"
          label="Teléfono"
          value={user?.phone_number ?? "No registrado"}
        />
        <View style={styles.rowDivider} />
        <InfoRow
          icon="star-outline"
          label="Reputación"
          value={`${user?.rating ?? 5.0} / 5.0`}
        />
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutButton} onPress={logout} activeOpacity={0.8}>
        <MaterialCommunityIcons name="logout" size={20} color="#EF4444" />
        <Text style={styles.logoutText}>Cerrar sesión</Text>
      </TouchableOpacity>
    </View>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  label: string;
  value: string;
}) {
  return (
    <View style={styles.infoRow}>
      <MaterialCommunityIcons name={icon} size={20} color="#64748B" />
      <View style={styles.infoRowText}>
        <Text variant="labelSmall" style={styles.infoLabel}>
          {label.toUpperCase()}
        </Text>
        <Text variant="bodyMedium" style={styles.infoValue}>
          {value}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
  },
  title: { fontWeight: "700", color: "#0F172A" },
  avatarSection: { alignItems: "center", paddingVertical: 32, gap: 8 },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  name: { fontWeight: "700", color: "#0F172A" },
  badge: {
    backgroundColor: "#EFF6FF",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  badgeText: { color: "#2563EB", fontWeight: "600", fontSize: 13 },
  card: {
    marginHorizontal: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    overflow: "hidden",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  infoRowText: { flex: 1 },
  infoLabel: { color: "#94A3B8", letterSpacing: 0.5 },
  infoValue: { color: "#0F172A", marginTop: 1 },
  rowDivider: { height: 1, backgroundColor: "#F1F5F9", marginLeft: 50 },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginHorizontal: 20,
    marginTop: 24,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  logoutText: { color: "#EF4444", fontWeight: "600", fontSize: 15 },
});
