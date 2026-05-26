import { useState } from "react";
import {
  View, StyleSheet, TouchableOpacity, ScrollView,
  TextInput as RNTextInput, Alert, Image,
} from "react-native";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { T } from "@/constants/tokens";

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>["name"];

type Category = {
  id: string;
  label: string;
  description: string;
  maxKg: number;
  icon: IconName;
};

const CATEGORIES: Category[] = [
  { id: "xs", label: "Sobre / Documento", description: "Hasta 0.5 kg — cartas, sobres, papeles", maxKg: 0.5, icon: "email-outline" },
  { id: "s",  label: "Caja chica",        description: "Hasta 3 kg — libro, ropa, accesorio",   maxKg: 3,   icon: "package-variant" },
  { id: "m",  label: "Caja mediana",      description: "Hasta 10 kg — electrodoméstico chico",  maxKg: 10,  icon: "cube-outline" },
  { id: "l",  label: "Caja grande",       description: "Hasta 30 kg — TV, valija, monitor",     maxKg: 30,  icon: "television-play" },
  { id: "xl", label: "Voluminoso / Flete",description: "Más de 30 kg — muebles, mudanza",       maxKg: 200, icon: "wardrobe-outline" },
];

function mockClassify(): { categoryId: string; confidence: number; weightKg: number } {
  return { categoryId: "m", confidence: 0.87, weightKg: 3.2 };
}

function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <View style={dotStyles.row}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[dotStyles.dot, { width: i === current - 1 ? 18 : 6, backgroundColor: i < current ? T.forest : T.border }]}
        />
      ))}
      <Text style={dotStyles.counter}>{String(current).padStart(2, "0")}/{String(total).padStart(2, "0")}</Text>
    </View>
  );
}
const dotStyles = StyleSheet.create({
  row: { flexDirection: "row", gap: 6, alignItems: "center" },
  dot: { height: 6, borderRadius: 4 },
  counter: { fontSize: 10, letterSpacing: 1.5, color: T.inkMute, marginLeft: 4 },
});

// 4-corner scan bracket overlay
function ScanCorners() {
  const corners: Array<{ top?: number; bottom?: number; left?: number; right?: number }> = [
    { top: 0, left: 0 },
    { top: 0, right: 0 },
    { bottom: 0, left: 0 },
    { bottom: 0, right: 0 },
  ];
  return (
    <>
      {corners.map((pos, i) => (
        <View key={i} style={[scanStyles.corner, pos, {
          borderTopWidth:    pos.top    !== undefined ? 2.5 : 0,
          borderBottomWidth: pos.bottom !== undefined ? 2.5 : 0,
          borderLeftWidth:   pos.left   !== undefined ? 2.5 : 0,
          borderRightWidth:  pos.right  !== undefined ? 2.5 : 0,
          borderTopLeftRadius:     i === 0 ? 6 : 0,
          borderTopRightRadius:    i === 1 ? 6 : 0,
          borderBottomLeftRadius:  i === 2 ? 6 : 0,
          borderBottomRightRadius: i === 3 ? 6 : 0,
        }]} />
      ))}
    </>
  );
}
const scanStyles = StyleSheet.create({
  corner: { position: "absolute", width: 20, height: 20, borderColor: T.emerald },
});

type PackageCategoryScreenProps = {
  initialCategoryId?: string;
  initialWeightKg?: number;
  initialDescription?: string;
  initialPhotoUri?: string | null;
  onBack: () => void;
  onNext: (payload: { categoryId: string; weightKg: number; description: string; photoUri: string | null }) => void;
};

export function PackageCategoryScreen({ initialCategoryId, initialWeightKg, initialDescription, initialPhotoUri, onBack, onNext }: PackageCategoryScreenProps) {
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<string | null>(initialCategoryId ?? null);
  const [weightKg, setWeightKg] = useState(initialWeightKg ? String(initialWeightKg) : "");
  const [description, setDescription] = useState(initialDescription ?? "");
  const [aiResult, setAiResult] = useState<{ categoryId: string; confidence: number; weightKg: number } | null>(null);
  const [classifying, setClassifying] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(initialPhotoUri ?? null);

  const canContinue = !!selected && !!weightKg && parseFloat(weightKg) > 0;

  async function handleTakePhoto() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permiso requerido", "Necesitamos acceso a tu cámara para clasificar el paquete.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7, allowsEditing: false });
    if (result.canceled) return;
    setPhotoUri(result.assets[0].uri);
    setClassifying(true);
    setTimeout(() => {
      const ai = mockClassify();
      setAiResult(ai);
      setSelected(ai.categoryId);
      setWeightKg(String(ai.weightKg));
      setClassifying(false);
    }, 1400);
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Step header */}
      <View style={styles.stepHeader}>
        <TouchableOpacity style={styles.headerBtn} onPress={onBack} hitSlop={10}>
          <MaterialCommunityIcons name="arrow-left" size={18} color={T.ink} />
        </TouchableOpacity>
        <StepDots current={2} total={4} />
        <View style={styles.headerBtn}>
          <MaterialCommunityIcons name="creation" size={16} color={T.ink} />
        </View>
      </View>

      <View style={styles.stepTitleBlock}>
        <Text style={styles.stepSub}>PASO 02 · DETECCIÓN AUTOMÁTICA</Text>
        <Text style={styles.stepTitle}>Clasificación{"\n"}del paquete</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Photo card */}
        <View style={styles.photoCard}>
          {photoUri ? (
            <View style={styles.photoWrapper}>
              <Image source={{ uri: photoUri }} style={styles.photoImg} resizeMode="cover" />
              <View style={styles.scanCornersContainer}>
                <ScanCorners />
              </View>
              <TouchableOpacity style={styles.retakeBtn} onPress={handleTakePhoto} activeOpacity={0.85}>
                <MaterialCommunityIcons name="camera-retake-outline" size={14} color={T.ink} />
                <Text style={styles.retakeBtnText}>Otra</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.photoOverlay} onPress={handleTakePhoto} activeOpacity={0.85}>
                <MaterialCommunityIcons name="camera-retake-outline" size={18} color="#fff" />
                <Text style={styles.photoOverlayText}>Reemplazar foto</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.photoPlaceholder}
              onPress={handleTakePhoto}
              activeOpacity={0.85}
              disabled={classifying}
            >
              <View style={styles.scanCornersContainer}>
                <ScanCorners />
              </View>
              {classifying ? (
                <View style={styles.classifyingContent}>
                  <MaterialCommunityIcons name="brain" size={28} color={T.emerald} />
                  <Text style={styles.classifyingText}>Clasificando...</Text>
                </View>
              ) : (
                <View style={styles.photoPromptContent}>
                  <MaterialCommunityIcons name="camera-outline" size={28} color={T.emeraldDeep} />
                  <Text style={styles.photoPromptTitle}>Foto del paquete</Text>
                  <Text style={styles.photoPromptSub}>La IA detecta el tamaño automáticamente</Text>
                </View>
              )}
              <View style={styles.photoLabel}>
                <Text style={styles.photoLabelText}>FOTO DEL PAQUETE</Text>
              </View>
            </TouchableOpacity>
          )}

          {/* AI tag bar */}
          {(aiResult || classifying) && (
            <View style={styles.aiBar}>
              <View style={styles.aiBarIcon}>
                <MaterialCommunityIcons name="creation" size={14} color={T.lime} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.aiBarLabel}>ANÁLISIS DE VISIÓN · 1.4s</Text>
                <Text style={styles.aiBarText}>
                  {aiResult
                    ? `Detectamos ${CATEGORIES.find((c) => c.id === aiResult.categoryId)?.label.toLowerCase() ?? "un paquete"}`
                    : "Analizando imagen..."}
                </Text>
              </View>
              {aiResult && (
                <View style={styles.aiConfidence}>
                  <View style={styles.aiConfidenceDot} />
                  <Text style={styles.aiConfidenceNum}>{Math.round(aiResult.confidence * 100)}%</Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Category section */}
        <View>
          <Text style={styles.catSectionTitle}>Confirmá la categoría</Text>

          {/* AI-suggested (primary) */}
          {aiResult && (
            <TouchableOpacity
              style={[styles.catPrimary, selected === aiResult.categoryId && styles.catPrimarySelected]}
              onPress={() => setSelected(aiResult.categoryId)}
              activeOpacity={0.8}
            >
              <View style={styles.catPrimaryIcon}>
                <MaterialCommunityIcons
                  name={CATEGORIES.find((c) => c.id === aiResult.categoryId)?.icon ?? "cube-outline"}
                  size={22} color={T.forest}
                />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.catPrimaryTitleRow}>
                  <Text style={styles.catPrimaryTitle}>
                    {CATEGORIES.find((c) => c.id === aiResult.categoryId)?.label ?? aiResult.categoryId}
                  </Text>
                  <View style={styles.aiTag}>
                    <Text style={styles.aiTagText}>IA</Text>
                  </View>
                </View>
                <Text style={styles.catPrimaryDesc}>
                  {CATEGORIES.find((c) => c.id === aiResult.categoryId)?.description ?? ""}
                </Text>
              </View>
              <View style={styles.catCheck}>
                <MaterialCommunityIcons name="check" size={14} color="#F4EFE3" />
              </View>
            </TouchableOpacity>
          )}

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>{aiResult ? "O CAMBIÁ A" : "ELEGÍ MANUALMENTE"}</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Category grid */}
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
                  <MaterialCommunityIcons name={cat.icon} size={26} color={isSelected ? T.forest : T.inkSoft} />
                  <Text style={[styles.catLabel, isSelected && styles.catLabelSelected]}>{cat.label}</Text>
                  <Text style={styles.catDesc} numberOfLines={2}>{cat.description}</Text>
                  {isSelected && (
                    <View style={styles.selectedDot}>
                      <MaterialCommunityIcons name="check" size={12} color="#fff" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Description */}
        <View style={styles.fieldSection}>
          <Text style={styles.fieldLabel}>DESCRIPCIÓN (opcional)</Text>
          <View style={[styles.fieldInput, { alignItems: "flex-start", paddingVertical: 10 }]}>
            <MaterialCommunityIcons name="text-box-outline" size={20} color={T.inkMute} style={{ marginTop: 2 }} />
            <RNTextInput
              style={[styles.fieldTextInput, { minHeight: 56 }]}
              value={description}
              onChangeText={setDescription}
              placeholder="Ej: Laptop en caja original, frágil"
              placeholderTextColor={T.inkFaint}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* Weight */}
        <View style={styles.fieldSection}>
          <Text style={styles.fieldLabel}>PESO ESTIMADO (kg)</Text>
          <View style={styles.fieldInput}>
            <MaterialCommunityIcons name="scale-bathroom" size={20} color={T.inkMute} />
            <RNTextInput
              style={styles.fieldTextInput}
              value={weightKg}
              onChangeText={setWeightKg}
              keyboardType="decimal-pad"
              placeholder="Ej: 3.5"
              placeholderTextColor={T.inkFaint}
            />
            <Text style={styles.fieldUnit}>kg</Text>
          </View>
        </View>

        {/* CTA */}
        <TouchableOpacity
          style={[styles.cta, !canContinue && styles.ctaDisabled]}
          onPress={() => { if (!canContinue) return; onNext({ categoryId: selected!, weightKg: parseFloat(weightKg), description, photoUri }); }}
          activeOpacity={0.85}
        >
          <Text style={styles.ctaText}>
            {canContinue ? "Ver modalidades de envío" : "Seleccioná una categoría"}
          </Text>
          {canContinue && <MaterialCommunityIcons name="arrow-right" size={20} color="#fff" />}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },

  stepHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4,
  },
  headerBtn: {
    width: 38, height: 38, borderRadius: 12,
    borderWidth: 1, borderColor: T.border,
    backgroundColor: T.card, alignItems: "center", justifyContent: "center",
  },
  stepTitleBlock: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 14 },
  stepSub: { fontSize: 10, letterSpacing: 2.5, color: T.emeraldDeep, textTransform: "uppercase", marginBottom: 4 },
  stepTitle: { fontSize: 26, fontWeight: "700", color: T.ink, letterSpacing: -0.8, lineHeight: 30 },

  content: { paddingHorizontal: 16, gap: 16 },

  // Photo card
  photoCard: {
    backgroundColor: T.card, borderRadius: 22,
    borderWidth: 1, borderColor: T.border, padding: 12, overflow: "hidden",
  },
  photoWrapper: { borderRadius: 14, overflow: "hidden", position: "relative" },
  photoImg: { width: "100%", height: 170 },
  scanCornersContainer: { position: "absolute", top: 18, right: 18, bottom: 18, left: 18 },
  retakeBtn: {
    position: "absolute", top: 10, right: 10,
    backgroundColor: "rgba(244,239,227,0.94)", borderRadius: 10,
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 10, paddingVertical: 8,
  },
  retakeBtnText: { fontSize: 12, fontWeight: "500", color: T.ink },
  photoOverlay: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    backgroundColor: "rgba(0,0,0,0.45)", paddingVertical: 10,
  },
  photoOverlayText: { color: "#fff", fontSize: 13, fontWeight: "600" },

  photoPlaceholder: {
    height: 170, borderRadius: 14,
    backgroundColor: "#E8DEC2",
    alignItems: "center", justifyContent: "center", position: "relative",
  },
  photoPromptContent: { alignItems: "center", gap: 6 },
  photoPromptTitle: { fontSize: 14, fontWeight: "600", color: T.ink },
  photoPromptSub: { fontSize: 12, color: T.inkSoft },
  classifyingContent: { alignItems: "center", gap: 8 },
  classifyingText: { fontSize: 14, fontWeight: "600", color: T.emerald },
  photoLabel: {
    position: "absolute", bottom: 10, left: 10,
    backgroundColor: "rgba(244,239,227,0.75)", borderRadius: 6,
    paddingHorizontal: 7, paddingVertical: 3,
  },
  photoLabelText: { fontSize: 9, letterSpacing: 2, color: T.forestDeep },

  aiBar: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingTop: 12, paddingBottom: 4, paddingHorizontal: 4,
  },
  aiBarIcon: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: T.forest,
    alignItems: "center", justifyContent: "center",
  },
  aiBarLabel: { fontSize: 9, letterSpacing: 1.5, color: T.inkMute, textTransform: "uppercase" },
  aiBarText: { fontSize: 12.5, color: T.ink, fontWeight: "500", marginTop: 1 },
  aiConfidence: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: T.mint, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
  },
  aiConfidenceDot: { width: 5, height: 5, borderRadius: 5, backgroundColor: T.emeraldDeep },
  aiConfidenceNum: { fontSize: 10, letterSpacing: 0.5, color: T.forest, fontWeight: "700" },

  // Category section
  catSectionTitle: { fontSize: 15, fontWeight: "600", color: T.ink, letterSpacing: -0.3, marginBottom: 10 },

  catPrimary: {
    backgroundColor: T.card, borderRadius: 16,
    borderWidth: 1.5, borderColor: T.border,
    padding: 14, flexDirection: "row", alignItems: "center", gap: 12, position: "relative",
  },
  catPrimarySelected: { borderColor: T.forest },
  catPrimaryIcon: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: T.mint, alignItems: "center", justifyContent: "center",
  },
  catPrimaryTitleRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 2 },
  catPrimaryTitle: { fontSize: 16, fontWeight: "700", color: T.ink, letterSpacing: -0.3 },
  aiTag: {
    backgroundColor: T.forest, borderRadius: 5,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  aiTagText: { fontSize: 8, letterSpacing: 1, color: T.lime, fontWeight: "700", textTransform: "uppercase" },
  catPrimaryDesc: { fontSize: 11.5, color: T.inkMute },
  catCheck: {
    width: 22, height: 22, borderRadius: 22,
    backgroundColor: T.forest, alignItems: "center", justifyContent: "center",
  },

  divider: { flexDirection: "row", alignItems: "center", gap: 10, marginVertical: 12 },
  dividerLine: { flex: 1, height: 1, backgroundColor: T.border },
  dividerText: { fontSize: 9, letterSpacing: 1.5, color: T.inkMute, textTransform: "uppercase" },

  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  categoryCard: {
    width: "47%", backgroundColor: T.card, borderRadius: 14,
    borderWidth: 1.5, borderColor: T.border, padding: 14, gap: 6, position: "relative",
  },
  categoryCardSelected: { borderColor: T.forest, backgroundColor: T.mint },
  catLabel: { fontWeight: "600", color: T.ink },
  catLabelSelected: { color: T.forest },
  catDesc: { fontSize: 12, color: T.inkSoft, lineHeight: 16 },
  selectedDot: {
    position: "absolute", top: 10, right: 10,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: T.forest, alignItems: "center", justifyContent: "center",
  },

  fieldSection: { gap: 8 },
  fieldLabel: { fontSize: 10, color: T.inkSoft, letterSpacing: 1, textTransform: "uppercase", fontWeight: "600" },
  fieldInput: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: T.card, borderRadius: 12,
    borderWidth: 1, borderColor: T.border,
    paddingHorizontal: 14, paddingVertical: 12,
  },
  fieldTextInput: { flex: 1, fontSize: 16, color: T.ink, padding: 0 },
  fieldUnit: { color: T.inkSoft, fontSize: 14 },

  cta: {
    flexDirection: "row", backgroundColor: T.forest,
    borderRadius: 14, paddingVertical: 16,
    alignItems: "center", justifyContent: "center", gap: 8, marginTop: 4,
  },
  ctaDisabled: { backgroundColor: T.inkMute },
  ctaText: { color: "#FFFFFF", fontWeight: "700", fontSize: 16 },
});
