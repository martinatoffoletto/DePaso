import { useState } from "react";
import { View, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>["name"];

type OfferMode = "dedicada" | "colaborativa";

type Offer = {
  id: OfferMode;
  label: string;
  subtitle: string;
  priceArs: number;
  etaMinutes: number;
  co2SavedKg: number;
  icon: IconName;
  accentColor: string;
  accentBg: string;
};

const OFFERS: Offer[] = [
  {
    id: "dedicada",
    label: "Dedicada",
    subtitle: "Conductor exclusivo para tu envío",
    priceArs: 6900,
    etaMinutes: 28,
    co2SavedKg: 0,
    icon: "lightning-bolt",
    accentColor: "#F59E0B",
    accentBg: "#FFFBEB",
  },
  {
    id: "colaborativa",
    label: "Colaborativa",
    subtitle: "Aprovecha un trayecto existente",
    priceArs: 3900,
    etaMinutes: 54,
    co2SavedKg: 1.8,
    icon: "account-group-outline",
    accentColor: "#22C55E",
    accentBg: "#F0FDF4",
  },
];

type OfferSelectionScreenProps = {
  origin: string;
  destination: string;
  packageLabel: string;
  initialMode?: OfferMode;
  onBack: () => void;
  onNext: (mode: OfferMode) => void;
};

export function OfferSelectionScreen({
  origin,
  destination,
  packageLabel,
  initialMode,
  onBack,
  onNext,
}: OfferSelectionScreenProps) {
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<OfferMode>(initialMode ?? "colaborativa");

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={onBack} style={styles.backButton} hitSlop={12}>
          <MaterialCommunityIcons name="chevron-left" size={28} color="#0F172A" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text variant="titleMedium" style={styles.headerTitle}>
            Modalidad de envío
          </Text>
          <Text variant="labelSmall" style={styles.headerStep}>
            PASO 3 DE 4
          </Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Route summary */}
        <View style={styles.routeCard}>
          <View style={styles.routeRow}>
            <View style={[styles.routeDot, { backgroundColor: "#0EA5E9" }]} />
            <Text variant="bodyMedium" style={styles.routeText} numberOfLines={1}>
              {origin}
            </Text>
          </View>
          <View style={styles.routeConnector} />
          <View style={styles.routeRow}>
            <View style={[styles.routeDot, { backgroundColor: "#EF4444", borderRadius: 3 }]} />
            <Text variant="bodyMedium" style={styles.routeText} numberOfLines={1}>
              {destination}
            </Text>
          </View>
          <View style={styles.packageTag}>
            <MaterialCommunityIcons name="cube-outline" size={14} color="#64748B" />
            <Text variant="labelSmall" style={styles.packageTagText}>
              {packageLabel}
            </Text>
          </View>
        </View>

        {/* Offer cards */}
        <View style={styles.offersContainer}>
          {OFFERS.map((offer) => {
            const isSelected = selected === offer.id;
            return (
              <TouchableOpacity
                key={offer.id}
                style={[
                  styles.offerCard,
                  isSelected && {
                    borderColor: offer.accentColor,
                    backgroundColor: offer.accentBg,
                  },
                ]}
                onPress={() => setSelected(offer.id)}
                activeOpacity={0.8}
              >
                {/* Icon */}
                <View
                  style={[
                    styles.offerIcon,
                    { backgroundColor: isSelected ? offer.accentColor : "#F1F5F9" },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={offer.icon}
                    size={24}
                    color={isSelected ? "#FFFFFF" : "#64748B"}
                  />
                </View>

                {/* Info */}
                <View style={styles.offerInfo}>
                  <Text
                    variant="titleMedium"
                    style={[styles.offerLabel, isSelected && { color: "#0F172A" }]}
                  >
                    {offer.label}
                  </Text>
                  <Text variant="bodySmall" style={styles.offerSubtitle}>
                    {offer.subtitle}
                  </Text>

                  <View style={styles.offerChips}>
                    <View style={styles.chip}>
                      <MaterialCommunityIcons name="clock-outline" size={13} color="#64748B" />
                      <Text variant="labelSmall" style={styles.chipText}>
                        {offer.etaMinutes} min
                      </Text>
                    </View>
                    {offer.co2SavedKg > 0 && (
                      <View style={[styles.chip, { backgroundColor: "#F0FDF4" }]}>
                        <MaterialCommunityIcons name="leaf" size={13} color="#22C55E" />
                        <Text variant="labelSmall" style={[styles.chipText, { color: "#16A34A" }]}>
                          -{offer.co2SavedKg} kg CO₂
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Price */}
                <View style={styles.offerPrice}>
                  <Text variant="titleLarge" style={styles.priceAmount}>
                    ${(offer.priceArs / 1000).toFixed(1)}k
                  </Text>
                  <Text variant="labelSmall" style={styles.priceLabel}>
                    ARS
                  </Text>
                </View>

                {/* Selected indicator */}
                {isSelected && (
                  <View style={[styles.selectedBadge, { backgroundColor: offer.accentColor }]}>
                    <MaterialCommunityIcons name="check" size={12} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* CTA */}
        <TouchableOpacity
          style={styles.cta}
          onPress={() => onNext(selected)}
          activeOpacity={0.85}
        >
          <Text style={styles.ctaText}>Confirmar y buscar conductor</Text>
          <MaterialCommunityIcons name="arrow-right" size={20} color="#fff" />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  backButton: { width: 40, alignItems: "flex-start" },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: { fontWeight: "700", color: "#0F172A" },
  headerStep: { color: "#94A3B8", letterSpacing: 1, marginTop: 2 },
  content: { padding: 20, gap: 16, paddingBottom: 40 },
  // Route summary
  routeCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 16,
    gap: 6,
  },
  routeRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  routeDot: { width: 10, height: 10, borderRadius: 5 },
  routeText: { color: "#0F172A", flex: 1 },
  routeConnector: {
    width: 2,
    height: 12,
    backgroundColor: "#E2E8F0",
    marginLeft: 4,
  },
  packageTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  packageTagText: { color: "#64748B" },
  // Offers
  offersContainer: { gap: 12 },
  offerCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    padding: 16,
    gap: 14,
    position: "relative",
  },
  offerIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  offerInfo: { flex: 1, gap: 4 },
  offerLabel: { fontWeight: "700", color: "#0F172A" },
  offerSubtitle: { color: "#64748B" },
  offerChips: { flexDirection: "row", gap: 6, marginTop: 4 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F1F5F9",
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  chipText: { color: "#64748B" },
  offerPrice: { alignItems: "flex-end" },
  priceAmount: { fontWeight: "800", color: "#0F172A" },
  priceLabel: { color: "#94A3B8" },
  selectedBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  cta: {
    flexDirection: "row",
    backgroundColor: "#0F172A",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 4,
  },
  ctaText: { color: "#FFFFFF", fontWeight: "700", fontSize: 16 },
});
