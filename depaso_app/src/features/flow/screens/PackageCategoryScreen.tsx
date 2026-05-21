import { useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput as RNTextInput,
  Alert,
} from "react-native";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>["name"];

type Category = {
  id: string;
  label: string;
  description: string;
  maxKg: number;
  icon: IconName;
};

const CATEGORIES: Category[] = [
  {
    id: "xs",
    label: "Sobre / Documento",
    description: "Hasta 0.5 kg — cartas, sobres, papeles",
    maxKg: 0.5,
    icon: "email-outline",
  },
  {
    id: "s",
    label: "Caja chica",
    description: "Hasta 3 kg — libro, ropa, accesorio",
    maxKg: 3,
    icon: "package-variant",
  },
  {
    id: "m",
    label: "Caja mediana",
    description: "Hasta 10 kg — electrodoméstico chico",
    maxKg: 10,
    icon: "cube-outline",
  },
  {
    id: "l",
    label: "Caja grande",
    description: "Hasta 30 kg — TV, valija, monitor",
    maxKg: 30,
    icon: "television-play",
  },
  {
    id: "xl",
    label: "Voluminoso / Flete",
    description: "Más de 30 kg — muebles, mudanza",
    maxKg: 200,
    icon: "wardrobe-outline",
  },
];

// Clasificación IA mock (simula respuesta del backend)
function mockClassify(hasPhoto: boolean): { categoryId: string; confidence: number; weightKg: number } {
  return { categoryId: "m", confidence: 0.87, weightKg: 3.2 };
}

type PackageCategoryScreenProps = {
  initialCategoryId?: string;
  initialWeightKg?: number;
  onBack: () => void;
  onNext: (payload: { categoryId: string; weightKg: number }) => void;
};

export function PackageCategoryScreen({ initialCategoryId, initialWeightKg, onBack, onNext }: PackageCategoryScreenProps) {
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<string | null>(initialCategoryId ?? null);
  const [weightKg, setWeightKg] = useState(initialWeightKg ? String(initialWeightKg) : "");
  const [aiResult, setAiResult] = useState<{
    categoryId: string;
    confidence: number;
    weightKg: number;
  } | null>(null);
  const [classifying, setClassifying] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  const canContinue = !!selected && !!weightKg && parseFloat(weightKg) > 0;

  async function handleTakePhoto() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permiso requerido", "Necesitamos acceso a tu cámara para clasificar el paquete.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.7,
      allowsEditing: false,
    });
    if (result.canceled) return;

    setPhotoUri(result.assets[0].uri);
    setClassifying(true);

    // Simula latencia de inferencia
    setTimeout(() => {
      const ai = mockClassify(true);
      setAiResult(ai);
      setSelected(ai.categoryId);
      setWeightKg(String(ai.weightKg));
      setClassifying(false);
    }, 1400);
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={onBack} style={styles.backButton} hitSlop={12}>
          <MaterialCommunityIcons name="chevron-left" size={28} color="#0F172A" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text variant="titleMedium" style={styles.headerTitle}>
            Detalle del paquete
          </Text>
          <Text variant="labelSmall" style={styles.headerStep}>
            PASO 2 DE 4
          </Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Foto + IA */}
        <TouchableOpacity
          style={styles.photoButton}
          onPress={handleTakePhoto}
          activeOpacity={0.85}
          disabled={classifying}
        >
          {classifying ? (
            <View style={styles.classifyingContent}>
              <MaterialCommunityIcons name="brain" size={28} color="#16A34A" />
              <Text variant="labelLarge" style={styles.classifyingText}>
                Clasificando...
              </Text>
            </View>
          ) : photoUri ? (
            <View style={styles.photoResult}>
              <MaterialCommunityIcons name="check-circle-outline" size={24} color="#22C55E" />
              <Text variant="labelLarge" style={{ color: "#0F172A" }}>
                Foto tomada — tocá para reemplazar
              </Text>
            </View>
          ) : (
            <View style={styles.photoButtonContent}>
              <MaterialCommunityIcons name="camera-outline" size={28} color="#16A34A" />
              <Text variant="titleSmall" style={styles.photoButtonText}>
                Sacar foto del paquete
              </Text>
              <Text variant="bodySmall" style={styles.photoButtonSub}>
                La IA clasificará el tamaño automáticamente
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Resultado IA */}
        {aiResult && (
          <View style={styles.aiCard}>
            <MaterialCommunityIcons name="robot-outline" size={18} color="#15803D" />
            <View style={{ flex: 1 }}>
              <Text variant="labelMedium" style={styles.aiLabel}>
                CLASIFICACIÓN IA — {Math.round(aiResult.confidence * 100)}% confianza
              </Text>
              <Text variant="bodySmall" style={styles.aiSubLabel}>
                Se sugirió{" "}
                <Text style={{ fontWeight: "700" }}>
                  {CATEGORIES.find((c) => c.id === aiResult.categoryId)?.label}
                </Text>
                . Podés confirmarlo o cambiarlo abajo.
              </Text>
            </View>
          </View>
        )}

        {/* Separador */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text variant="labelSmall" style={styles.dividerText}>
            O ELEGÍ MANUALMENTE
          </Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Grilla de categorías */}
        <View style={styles.grid}>
          {CATEGORIES.map((cat) => {
            const isSelected = selected === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.categoryCard, isSelected && styles.categoryCardSelected]}
                onPress={() => {
                  setSelected(cat.id);
                  if (!weightKg) setWeightKg(String(cat.maxKg / 2));
                }}
                activeOpacity={0.75}
              >
                <MaterialCommunityIcons
                  name={cat.icon}
                  size={28}
                  color={isSelected ? "#16A34A" : "#64748B"}
                />
                <Text
                  variant="labelLarge"
                  style={[styles.catLabel, isSelected && styles.catLabelSelected]}
                >
                  {cat.label}
                </Text>
                <Text variant="bodySmall" style={styles.catDesc} numberOfLines={2}>
                  {cat.description}
                </Text>
                {isSelected && (
                  <View style={styles.selectedDot}>
                    <MaterialCommunityIcons name="check" size={12} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Peso */}
        <View style={styles.weightSection}>
          <Text variant="labelMedium" style={styles.weightLabel}>
            PESO ESTIMADO (kg)
          </Text>
          <View style={styles.weightInput}>
            <MaterialCommunityIcons name="scale-bathroom" size={20} color="#64748B" />
            <RNTextInput
              style={styles.weightTextInput}
              value={weightKg}
              onChangeText={setWeightKg}
              keyboardType="decimal-pad"
              placeholder="Ej: 3.5"
              placeholderTextColor="#CBD5E1"
            />
            <Text style={styles.weightUnit}>kg</Text>
          </View>
        </View>

        {/* CTA */}
        <TouchableOpacity
          style={[styles.cta, !canContinue && styles.ctaDisabled]}
          onPress={() => {
            if (!canContinue) return;
            onNext({ categoryId: selected!, weightKg: parseFloat(weightKg) });
          }}
          activeOpacity={0.85}
        >
          <Text style={styles.ctaText}>
            {canContinue ? "Ver modalidades de envío" : "Seleccioná una categoría"}
          </Text>
          {canContinue && (
            <MaterialCommunityIcons name="arrow-right" size={20} color="#fff" />
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  // Header
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
  // Photo button
  photoButton: {
    backgroundColor: "#F0FDF4",
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#BBF7D0",
    borderStyle: "dashed",
    paddingVertical: 24,
    alignItems: "center",
  },
  photoButtonContent: { alignItems: "center", gap: 6 },
  photoButtonText: { color: "#0F172A", fontWeight: "600" },
  photoButtonSub: { color: "#64748B" },
  classifyingContent: { alignItems: "center", gap: 8 },
  classifyingText: { color: "#16A34A" },
  photoResult: { flexDirection: "row", alignItems: "center", gap: 8 },
  // AI result
  aiCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: "#F0FDF4",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  aiLabel: { color: "#15803D", letterSpacing: 0.5 },
  aiSubLabel: { color: "#0F172A", marginTop: 2 },
  // Divider
  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginVertical: 4,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: "#E2E8F0" },
  dividerText: { color: "#94A3B8", letterSpacing: 1 },
  // Category grid
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  categoryCard: {
    width: "47%",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    padding: 14,
    gap: 6,
    position: "relative",
  },
  categoryCardSelected: {
    borderColor: "#16A34A",
    backgroundColor: "#F0FDF4",
  },
  catLabel: { color: "#0F172A", fontWeight: "600" },
  catLabelSelected: { color: "#15803D" },
  catDesc: { color: "#64748B", lineHeight: 16 },
  selectedDot: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#16A34A",
    alignItems: "center",
    justifyContent: "center",
  },
  // Weight
  weightSection: { gap: 8 },
  weightLabel: { color: "#64748B", letterSpacing: 1 },
  weightInput: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  weightTextInput: {
    flex: 1,
    fontSize: 16,
    color: "#0F172A",
    padding: 0,
  },
  weightUnit: { color: "#64748B", fontSize: 14 },
  // CTA
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
  ctaDisabled: { backgroundColor: "#94A3B8" },
  ctaText: { color: "#FFFFFF", fontWeight: "700", fontSize: 16 },
});
