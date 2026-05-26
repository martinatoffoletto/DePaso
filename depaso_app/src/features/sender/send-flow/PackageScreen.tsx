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

type Category = { id: string; label: string; sub: string; icon: IconName };
const CATEGORIES: Category[] = [
  { id: "xs", label: "Sobre",   sub: "≤ 0.5 kg", icon: "email-outline" },
  { id: "s",  label: "Chica",   sub: "≤ 3 kg",   icon: "package-variant" },
  { id: "m",  label: "Mediana", sub: "≤ 10 kg",  icon: "cube-outline" },
  { id: "l",  label: "Grande",  sub: "≤ 30 kg",  icon: "television-play" },
  { id: "xl", label: "Flete",   sub: "> 30 kg",  icon: "wardrobe-outline" },
];

const AI_MOCK = { categoryId: "m", confidence: 0.94, label: "Paquete mediano", dim: { l: "24", w: "18", h: "12", kg: "1.4" } };

function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <View style={dotStyles.row}>
      {Array.from({ length: total }).map((_, i) => (
        <View key={i} style={[dotStyles.dot, { width: i === current - 1 ? 18 : 6, backgroundColor: i < current ? T.forest : T.border }]} />
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

function ScanCorners() {
  const corners: Array<{ top?: number; bottom?: number; left?: number; right?: number }> = [
    { top: 0, left: 0 }, { top: 0, right: 0 }, { bottom: 0, left: 0 }, { bottom: 0, right: 0 },
  ];
  return (
    <>
      {corners.map((pos, i) => (
        <View key={i} style={[scanStyles.corner, pos, {
          borderTopWidth:    pos.top    !== undefined ? 2.5 : 0,
          borderBottomWidth: pos.bottom !== undefined ? 2.5 : 0,
          borderLeftWidth:   pos.left   !== undefined ? 2.5 : 0,
          borderRightWidth:  pos.right  !== undefined ? 2.5 : 0,
          borderTopLeftRadius:    i === 0 ? 6 : 0,
          borderTopRightRadius:   i === 1 ? 6 : 0,
          borderBottomLeftRadius: i === 2 ? 6 : 0,
          borderBottomRightRadius: i === 3 ? 6 : 0,
        }]} />
      ))}
    </>
  );
}
const scanStyles = StyleSheet.create({ corner: { position: "absolute", width: 20, height: 20, borderColor: T.emerald } });

export type PackagePayload = {
  categoryId: string;
  weightKg: number;
  description: string;
  photoUri: string | null;
};

type Props = {
  initial?: Partial<PackagePayload>;
  onBack: () => void;
  onNext: (payload: PackagePayload) => void;
};

export function PackageScreen({ initial, onBack, onNext }: Props) {
  const insets = useSafeAreaInsets();
  const [photoUri, setPhotoUri] = useState<string | null>(initial?.photoUri ?? null);
  const [aiActive, setAiActive] = useState(false);
  const [classifying, setClassifying] = useState(false);
  const [selected, setSelected] = useState<string>(initial?.categoryId ?? "m");
  const [dimL, setDimL] = useState("24");
  const [dimW, setDimW] = useState("18");
  const [dimH, setDimH] = useState("12");
  const [dimKg, setDimKg] = useState(initial?.weightKg ? String(initial.weightKg) : "1.4");
  const [description, setDescription] = useState(initial?.description ?? "");

  const selectedCat = CATEGORIES.find((c) => c.id === selected) ?? CATEGORIES[2];
  const canContinue = description.trim().length > 0;

  async function pickWithCamera() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permiso requerido", "Necesitamos acceso a tu cámara.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7, allowsEditing: false });
    if (result.canceled) return;
    applyPhoto(result.assets[0].uri);
  }

  async function pickFromGallery() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permiso requerido", "Necesitamos acceso a la galería.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: "images", quality: 0.7 });
    if (result.canceled) return;
    applyPhoto(result.assets[0].uri);
  }

  function applyPhoto(uri: string) {
    setPhotoUri(uri);
    setClassifying(true);
    setTimeout(() => {
      setAiActive(true);
      setSelected(AI_MOCK.categoryId);
      setDimL(AI_MOCK.dim.l);
      setDimW(AI_MOCK.dim.w);
      setDimH(AI_MOCK.dim.h);
      setDimKg(AI_MOCK.dim.kg);
      setClassifying(false);
    }, 1400);
  }

  function handlePhoto() {
    Alert.alert("Foto del paquete", "¿Cómo querés agregar la foto?", [
      { text: "Sacar foto",        onPress: pickWithCamera  },
      { text: "Elegir de galería", onPress: pickFromGallery },
      { text: "Cancelar", style: "cancel" },
    ]);
  }

  function handleNext() {
    const kg = parseFloat(dimKg);
    onNext({ categoryId: selected, weightKg: isNaN(kg) ? 1 : kg, description, photoUri });
  }

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      {/* Step header */}
      <View style={s.stepHeader}>
        <TouchableOpacity style={s.headerBtn} onPress={onBack} hitSlop={10}>
          <MaterialCommunityIcons name="arrow-left" size={18} color={T.ink} />
        </TouchableOpacity>
        <StepDots current={1} total={4} />
        <View style={s.headerBtn}>
          <MaterialCommunityIcons name="creation" size={16} color={T.ink} />
        </View>
      </View>

      <View style={s.stepTitleBlock}>
        <Text style={s.stepSub}>EL PAQUETE</Text>
        <Text style={s.stepTitle}>Mostranos qué{"\n"}vas a enviar</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 100 }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Photo card */}
        <View style={s.photoCard}>
          {photoUri ? (
            <View style={s.photoWrapper}>
              <Image source={{ uri: photoUri }} style={s.photoImg} resizeMode="cover" />
              <View style={s.scanCornersWrap}><ScanCorners /></View>
              <TouchableOpacity style={s.retakeBtn} onPress={handlePhoto} activeOpacity={0.85}>
                <MaterialCommunityIcons name="image-edit-outline" size={14} color={T.ink} />
                <Text style={s.retakeBtnText}>Cambiar</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={s.photoPlaceholder} onPress={handlePhoto} activeOpacity={0.85} disabled={classifying}>
              <View style={s.scanCornersWrap}><ScanCorners /></View>
              {classifying ? (
                <View style={s.photoPrompt}>
                  <MaterialCommunityIcons name="brain" size={28} color={T.emerald} />
                  <Text style={s.photoPromptTitle}>Clasificando...</Text>
                </View>
              ) : (
                <View style={s.photoPrompt}>
                  <MaterialCommunityIcons name="camera-outline" size={28} color={T.emeraldDeep} />
                  <Text style={s.photoPromptTitle}>Adjuntá una foto</Text>
                  <Text style={s.photoPromptSub}>La IA detecta el tamaño automáticamente</Text>
                </View>
              )}
              <View style={s.photoLabel}><Text style={s.photoLabelText}>FOTO DEL PAQUETE</Text></View>
            </TouchableOpacity>
          )}

          {/* AI bar */}
          {(aiActive || classifying) && (
            <View style={s.aiBar}>
              <View style={s.aiBarIcon}>
                <MaterialCommunityIcons name="creation" size={14} color={T.lime} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.aiBarLabel}>ANÁLISIS DE VISIÓN · 1.4s</Text>
                <Text style={s.aiBarText}>
                  {aiActive ? `Detectamos ${AI_MOCK.label.toLowerCase()}` : "Analizando imagen..."}
                </Text>
              </View>
              {aiActive && (
                <View style={s.aiConf}>
                  <View style={s.aiConfDot} />
                  <Text style={s.aiConfNum}>{AI_MOCK.confidence * 100}%</Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Confirmá la categoría */}
        <View>
          <Text style={s.sectionTitle}>Confirmá la categoría</Text>

          {/* Primary selected card */}
          <View style={s.catPrimary}>
            <View style={s.catPrimaryIcon}>
              <MaterialCommunityIcons name={selectedCat.icon} size={22} color={T.forest} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={s.catPrimaryTitleRow}>
                <Text style={s.catPrimaryTitle}>{selectedCat.label}</Text>
                {aiActive && <View style={s.aiTag}><Text style={s.aiTagText}>IA</Text></View>}
              </View>
              <Text style={s.catPrimaryDesc}>{selectedCat.sub}</Text>
            </View>
            <View style={s.catCheck}>
              <MaterialCommunityIcons name="check" size={14} color="#F4EFE3" />
            </View>
          </View>

          <View style={s.divider}>
            <View style={s.dividerLine} />
            <Text style={s.dividerText}>O CAMBIÁ A</Text>
            <View style={s.dividerLine} />
          </View>

          {/* 3-col compact chip grid */}
          <View style={s.chipGrid}>
            {CATEGORIES.filter((c) => c.id !== selected).map((cat) => (
              <TouchableOpacity key={cat.id} style={s.chip} onPress={() => setSelected(cat.id)} activeOpacity={0.75}>
                <MaterialCommunityIcons name={cat.icon} size={18} color={T.inkSoft} />
                <Text style={s.chipLabel}>{cat.label}</Text>
                <Text style={s.chipSub}>{cat.sub}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Dimensions card — oculto para Flete */}
        {selected !== "xl" && <View style={s.dimsCard}>
          <View style={s.dimsHeader}>
            <Text style={s.dimsLabel}>MEDIDAS · IA</Text>
            <Text style={s.dimsEdit}>EDITAR</Text>
          </View>
          <View style={s.dimsRow}>
            {[
              { l: "LARGO", v: dimL, set: setDimL, u: "cm" },
              { l: "ANCHO", v: dimW, set: setDimW, u: "cm" },
              { l: "ALTO",  v: dimH, set: setDimH, u: "cm" },
              { l: "PESO",  v: dimKg, set: setDimKg, u: "kg" },
            ].map((d) => (
              <View key={d.l} style={s.dimBox}>
                <Text style={s.dimBoxLabel}>{d.l}</Text>
                <View style={s.dimBoxRow}>
                  <RNTextInput
                    style={s.dimBoxInput}
                    value={d.v}
                    onChangeText={d.set}
                    keyboardType="decimal-pad"
                  />
                  <Text style={s.dimBoxUnit}>{d.u}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>}

        {/* Description — obligatoria */}
        <View style={s.descSection}>
          <Text style={s.fieldLabel}>DESCRIPCIÓN</Text>
          <View style={s.fieldInput}>
            <MaterialCommunityIcons name="text-box-outline" size={18} color={T.inkMute} style={{ marginTop: 2 }} />
            <RNTextInput
              style={[s.fieldTextInput, { minHeight: 48 }]}
              value={description}
              onChangeText={setDescription}
              placeholder="Ej: Laptop en caja original, frágil"
              placeholderTextColor={T.inkFaint}
              multiline
              textAlignVertical="top"
            />
          </View>
        </View>
      </ScrollView>

      {/* Sticky CTA */}
      <View style={[s.ctaWrap, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={[s.cta, !canContinue && s.ctaDisabled]}
          onPress={handleNext}
          activeOpacity={0.88}
          disabled={!canContinue}
        >
          <Text style={s.ctaText}>{canContinue ? "Continuar · Dirección" : "Agregá una descripción"}</Text>
          {canContinue && <MaterialCommunityIcons name="arrow-right" size={18} color="#F4EFE3" />}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
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

  photoCard: { backgroundColor: T.card, borderRadius: 22, borderWidth: 1, borderColor: T.border, padding: 12, overflow: "hidden" },
  photoWrapper: { borderRadius: 14, overflow: "hidden", position: "relative" },
  photoImg: { width: "100%", height: 170 },
  scanCornersWrap: { position: "absolute", top: 18, right: 18, bottom: 18, left: 18 },
  retakeBtn: {
    position: "absolute", top: 10, right: 10,
    backgroundColor: "rgba(244,239,227,0.94)", borderRadius: 10,
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 10, paddingVertical: 8,
  },
  retakeBtnText: { fontSize: 12, fontWeight: "500", color: T.ink },
  photoPlaceholder: { height: 170, borderRadius: 14, backgroundColor: "#E8DEC2", alignItems: "center", justifyContent: "center", position: "relative" },
  photoPrompt: { alignItems: "center", gap: 6 },
  photoPromptTitle: { fontSize: 14, fontWeight: "600", color: T.ink },
  photoPromptSub: { fontSize: 12, color: T.inkSoft },
  photoLabel: { position: "absolute", bottom: 10, left: 10, backgroundColor: "rgba(244,239,227,0.75)", borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  photoLabelText: { fontSize: 9, letterSpacing: 2, color: T.forestDeep },

  aiBar: { flexDirection: "row", alignItems: "center", gap: 10, paddingTop: 12, paddingBottom: 4, paddingHorizontal: 4 },
  aiBarIcon: { width: 28, height: 28, borderRadius: 8, backgroundColor: T.forest, alignItems: "center", justifyContent: "center" },
  aiBarLabel: { fontSize: 9, letterSpacing: 1.5, color: T.inkMute, textTransform: "uppercase" },
  aiBarText: { fontSize: 12.5, color: T.ink, fontWeight: "500", marginTop: 1 },
  aiConf: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: T.mint, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  aiConfDot: { width: 5, height: 5, borderRadius: 5, backgroundColor: T.emeraldDeep },
  aiConfNum: { fontSize: 10, letterSpacing: 0.5, color: T.forest, fontWeight: "700" },

  sectionTitle: { fontSize: 15, fontWeight: "600", color: T.ink, letterSpacing: -0.3, marginBottom: 10 },

  catPrimary: { backgroundColor: T.card, borderRadius: 16, borderWidth: 1.5, borderColor: T.forest, padding: 14, flexDirection: "row", alignItems: "center", gap: 12 },
  catPrimaryIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: T.mint, alignItems: "center", justifyContent: "center" },
  catPrimaryTitleRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 2 },
  catPrimaryTitle: { fontSize: 16, fontWeight: "700", color: T.ink, letterSpacing: -0.3 },
  aiTag: { backgroundColor: T.forest, borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2 },
  aiTagText: { fontSize: 8, letterSpacing: 1, color: T.lime, fontWeight: "700", textTransform: "uppercase" },
  catPrimaryDesc: { fontSize: 11.5, color: T.inkMute },
  catCheck: { width: 22, height: 22, borderRadius: 22, backgroundColor: T.forest, alignItems: "center", justifyContent: "center" },

  divider: { flexDirection: "row", alignItems: "center", gap: 10, marginVertical: 12 },
  dividerLine: { flex: 1, height: 1, backgroundColor: T.border },
  dividerText: { fontSize: 9, letterSpacing: 1.5, color: T.inkMute, textTransform: "uppercase" },

  chipGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { width: "30.5%", backgroundColor: T.card, borderRadius: 14, borderWidth: 1, borderColor: T.border, padding: 10, gap: 4 },
  chipLabel: { fontSize: 12.5, fontWeight: "600", color: T.ink },
  chipSub: { fontSize: 9, letterSpacing: 1, color: T.inkMute, textTransform: "uppercase" },

  dimsCard: { backgroundColor: T.cardSoft, borderRadius: 16, borderWidth: 1, borderColor: T.border, borderStyle: "dashed", padding: 14 },
  dimsHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  dimsLabel: { fontSize: 10, letterSpacing: 1.5, color: T.inkMute, textTransform: "uppercase" },
  dimsEdit: { fontSize: 9, letterSpacing: 1, color: T.emeraldDeep, textTransform: "uppercase", fontWeight: "700" },
  dimsRow: { flexDirection: "row", gap: 8 },
  dimBox: { flex: 1, backgroundColor: T.card, borderRadius: 10, padding: 8, borderWidth: 1, borderColor: T.borderSoft },
  dimBoxLabel: { fontSize: 8, letterSpacing: 1, color: T.inkMute, marginBottom: 3, textTransform: "uppercase" },
  dimBoxRow: { flexDirection: "row", alignItems: "baseline", gap: 2 },
  dimBoxInput: { fontSize: 17, fontWeight: "700", color: T.ink, letterSpacing: -0.4, padding: 0, flex: 1 },
  dimBoxUnit: { fontSize: 10, color: T.inkMute, fontWeight: "500" },

  descSection: { gap: 8 },
  fieldLabel: { fontSize: 10, color: T.inkSoft, letterSpacing: 1, textTransform: "uppercase", fontWeight: "600" },
  fieldInput: { flexDirection: "row", alignItems: "flex-start", gap: 10, backgroundColor: T.card, borderRadius: 12, borderWidth: 1, borderColor: T.border, paddingHorizontal: 14, paddingVertical: 12 },
  fieldTextInput: { flex: 1, fontSize: 15, color: T.ink, padding: 0 },

  ctaWrap: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    paddingHorizontal: 16, paddingTop: 24,
    backgroundColor: "rgba(244,239,227,0.0)",
  },
  cta: {
    backgroundColor: T.forest, borderRadius: 16, height: 54,
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
    shadowColor: T.forest, shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.4, shadowRadius: 20, elevation: 5,
  },
  ctaDisabled: { backgroundColor: T.inkMute, shadowOpacity: 0 },
  ctaText: { color: "#F4EFE3", fontWeight: "600", fontSize: 15 },
});
