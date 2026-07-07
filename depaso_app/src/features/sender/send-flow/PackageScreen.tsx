import { useState } from "react";
import {
  View, TouchableOpacity, ScrollView,
  TextInput as RNTextInput, Alert, Image, Text,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { visionService } from "@/src/services/vision";
import { DimensioningModal } from "./DimensioningModal";
import type { DimensionEstimate } from "@/src/utils/dimensioning";
import { T } from "@/constants/tokens";

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>["name"];

type Category = { id: string; label: string; sub: string; icon: IconName };
const CATEGORIES: Category[] = [
  { id: "s",  label: "Pequeño", sub: "≤ 3 kg",   icon: "email-outline" },
  { id: "m",  label: "Mediana", sub: "≤ 10 kg",  icon: "cube-outline" },
  { id: "l",  label: "Grande",  sub: "≤ 30 kg",  icon: "television-play" },
  { id: "xl", label: "Flete",   sub: "> 30 kg",  icon: "wardrobe-outline" },
];

const CATEGORY_AI_LABEL: Record<string, string> = {
  s: "un paquete pequeño o documento", m: "una carga mediana",
  l: "una carga grande o voluminosa", xl: "una mudanza o flete",
};

function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <View className="flex-row gap-[6px] items-center">
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          className="h-[6px] rounded-[4px]"
          style={{ width: i === current - 1 ? 18 : 6, backgroundColor: i < current ? T.forest : T.border }}
        />
      ))}
      <Text className="text-[10px] tracking-[1.5px] text-inkMute ml-1">
        {String(current).padStart(2, "0")}/{String(total).padStart(2, "0")}
      </Text>
    </View>
  );
}

function ScanCorners() {
  const corners: { top?: number; bottom?: number; left?: number; right?: number }[] = [
    { top: 0, left: 0 }, { top: 0, right: 0 }, { bottom: 0, left: 0 }, { bottom: 0, right: 0 },
  ];
  return (
    <>
      {corners.map((pos, i) => (
        <View key={i} style={[{
          position: "absolute", width: 20, height: 20, borderColor: T.emerald,
          borderTopWidth:    pos.top    !== undefined ? 2.5 : 0,
          borderBottomWidth: pos.bottom !== undefined ? 2.5 : 0,
          borderLeftWidth:   pos.left   !== undefined ? 2.5 : 0,
          borderRightWidth:  pos.right  !== undefined ? 2.5 : 0,
          borderTopLeftRadius:    i === 0 ? 6 : 0,
          borderTopRightRadius:   i === 1 ? 6 : 0,
          borderBottomLeftRadius: i === 2 ? 6 : 0,
          borderBottomRightRadius: i === 3 ? 6 : 0,
        }, pos]} />
      ))}
    </>
  );
}

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
  const [classificationId, setClassificationId] = useState<number | null>(null);
  const [aiConfidence, setAiConfidence] = useState<number | null>(null);
  const [selected, setSelected] = useState<string>(initial?.categoryId ?? "m");
  const [showDim, setShowDim] = useState(false);
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

  async function applyPhoto(uri: string) {
    setPhotoUri(uri);
    setClassifying(true);
    try {
      // resize client-side: faster upload, the model only needs 224x224
      const resized = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 640 } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG },
      );
      const result = await visionService.classifyPackage(resized.uri);
      setClassificationId(result.classification_id);
      setAiConfidence(result.confidence);
      if (!result.needs_manual) {
        setAiActive(true);
        setSelected(result.category);
      } else {
        // low confidence (RF-VIS-02): keep manual selection, inform the user
        setAiActive(false);
        Alert.alert(
          "No estamos seguros",
          "La IA no pudo clasificar el paquete con confianza. Elegí la categoría manualmente.",
        );
      }
    } catch {
      setAiActive(false);
      Alert.alert("Error", "No se pudo clasificar la imagen. Elegí la categoría manualmente.");
    } finally {
      setClassifying(false);
    }
  }

  function applyDimEstimate(est: DimensionEstimate) {
    // Dimensioning suggests a category and fills the visible-face dimensions.
    setSelected(est.category);
    setDimL(String(Math.max(est.widthCm, est.heightCm)));
    setDimW(String(Math.min(est.widthCm, est.heightCm)));
    setShowDim(false);
  }

  function handlePhoto() {
    Alert.alert("Foto del paquete", "¿Cómo querés agregar la foto?", [
      { text: "Sacar foto",        onPress: pickWithCamera  },
      { text: "Elegir de galería", onPress: pickFromGallery },
      { text: "Cancelar", style: "cancel" },
    ]);
  }

  function handleNext() {
    if (classificationId !== null) {
      // RF-VIS-04: record whether the user kept the AI suggestion or corrected it
      const accepted = aiActive && selected === selectedCat.id;
      visionService
        .sendFeedback(classificationId, accepted, accepted ? undefined : selected)
        .catch(() => {});
    }
    const kg = parseFloat(dimKg);
    onNext({ categoryId: selected, weightKg: isNaN(kg) ? 1 : kg, description, photoUri });
  }

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      {/* Step header */}
      <View className="flex-row items-center justify-between px-5 pt-2 pb-1">
        <TouchableOpacity
          className="w-[38px] h-[38px] rounded-xl border border-border bg-card items-center justify-center"
          onPress={onBack}
          hitSlop={10}
        >
          <MaterialCommunityIcons name="arrow-left" size={18} color={T.ink} />
        </TouchableOpacity>
        <StepDots current={1} total={4} />
        <View className="w-[38px] h-[38px] rounded-xl border border-border bg-card items-center justify-center">
          <MaterialCommunityIcons name="creation" size={16} color={T.ink} />
        </View>
      </View>

      <View className="px-5 pt-1 pb-[14px]">
        <Text className="text-[10px] tracking-[2.5px] text-emeraldDeep uppercase mb-1">EL PAQUETE</Text>
        <Text className="text-[26px] font-bold text-ink tracking-[-0.8px] leading-[30px]">Mostranos qué{"\n"}vas a enviar</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 16, paddingBottom: insets.bottom + 100 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Photo card */}
        <View className="bg-card rounded-[22px] border border-border p-3 overflow-hidden">
          {photoUri ? (
            <View className="rounded-2xl overflow-hidden">
              <Image source={{ uri: photoUri }} className="w-full h-[170px]" resizeMode="cover" />
              <View className="absolute top-[18px] right-[18px] bottom-[18px] left-[18px]">
                <ScanCorners />
              </View>
              <TouchableOpacity
                className="absolute top-[10px] right-[10px] rounded-[10px] flex-row items-center gap-[6px] px-[10px] py-2"
                style={{ backgroundColor: "rgba(244,239,227,0.94)" }}
                onPress={handlePhoto}
                activeOpacity={0.85}
              >
                <MaterialCommunityIcons name="image-edit-outline" size={14} color={T.ink} />
                <Text className="text-xs font-medium text-ink">Cambiar</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              className="h-[170px] rounded-2xl bg-[#E8DEC2] items-center justify-center"
              onPress={handlePhoto}
              activeOpacity={0.85}
              disabled={classifying}
            >
              <View className="absolute top-[18px] right-[18px] bottom-[18px] left-[18px]">
                <ScanCorners />
              </View>
              {classifying ? (
                <View className="items-center gap-[6px]">
                  <MaterialCommunityIcons name="brain" size={28} color={T.emerald} />
                  <Text className="text-sm font-semibold text-ink">Clasificando...</Text>
                </View>
              ) : (
                <View className="items-center gap-[6px]">
                  <MaterialCommunityIcons name="camera-outline" size={28} color={T.emeraldDeep} />
                  <Text className="text-sm font-semibold text-ink">Adjuntá una foto</Text>
                  <Text className="text-xs text-inkSoft">La IA detecta el tamaño automáticamente</Text>
                </View>
              )}
              <View
                className="absolute bottom-[10px] left-[10px] rounded-md px-[7px] py-[3px]"
                style={{ backgroundColor: "rgba(244,239,227,0.75)" }}
              >
                <Text className="text-[9px] tracking-[2px] text-forestDeep">FOTO DEL PAQUETE</Text>
              </View>
            </TouchableOpacity>
          )}

          {/* AI bar */}
          {(aiActive || classifying) && (
            <View className="flex-row items-center gap-[10px] pt-3 pb-1 px-1">
              <View className="w-7 h-7 rounded-lg bg-forest items-center justify-center">
                <MaterialCommunityIcons name="creation" size={14} color={T.lime} />
              </View>
              <View className="flex-1">
                <Text className="text-[9px] tracking-[1.5px] text-inkMute uppercase">ANÁLISIS DE VISIÓN</Text>
                <Text className="text-[12.5px] text-ink font-medium mt-px">
                  {aiActive ? `Detectamos ${CATEGORY_AI_LABEL[selected] ?? "un paquete"}` : "Analizando imagen..."}
                </Text>
              </View>
              {aiActive && aiConfidence !== null && (
                <View className="flex-row items-center gap-1 bg-mint px-2 py-1 rounded-lg">
                  <View className="w-[5px] h-[5px] rounded-full bg-emeraldDeep" />
                  <Text className="text-[10px] tracking-[0.5px] text-forest font-bold">{Math.round(aiConfidence * 100)}%</Text>
                </View>
              )}
            </View>
          )}

          {/* Dimensionado por objeto de referencia (asistencia a la categoría) */}
          {photoUri && (
            <TouchableOpacity
              onPress={() => setShowDim(true)}
              className="flex-row items-center justify-center gap-2 mt-3 py-3 rounded-xl border border-forest bg-mint"
              activeOpacity={0.85}
            >
              <MaterialCommunityIcons name="ruler-square" size={18} color={T.forest} />
              <Text className="text-[13px] font-semibold text-forest">Medir con objeto de referencia</Text>
            </TouchableOpacity>
          )}
        </View>

        {showDim && photoUri && (
          <DimensioningModal
            photoUri={photoUri}
            onClose={() => setShowDim(false)}
            onResult={applyDimEstimate}
          />
        )}

        {/* Confirmá la categoría */}
        <View>
          <Text className="text-[15px] font-semibold text-ink tracking-[-0.3px] mb-[10px]">Confirmá la categoría</Text>

          <View className="bg-card rounded-2xl p-[14px] flex-row items-center gap-3" style={{ borderWidth: 1.5, borderColor: T.forest }}>
            <View className="w-11 h-11 rounded-xl bg-mint items-center justify-center">
              <MaterialCommunityIcons name={selectedCat.icon} size={22} color={T.forest} />
            </View>
            <View className="flex-1">
              <View className="flex-row items-center gap-[6px] mb-0.5">
                <Text className="text-[16px] font-bold text-ink tracking-[-0.3px]">{selectedCat.label}</Text>
                {aiActive && (
                  <View className="bg-forest rounded-[5px] px-[6px] py-0.5">
                    <Text className="text-[8px] tracking-[1px] text-lime font-bold uppercase">IA</Text>
                  </View>
                )}
              </View>
              <Text className="text-[11.5px] text-inkMute">{selectedCat.sub}</Text>
            </View>
            <View className="w-[22px] h-[22px] rounded-full bg-forest items-center justify-center">
              <MaterialCommunityIcons name="check" size={14} color="#F4EFE3" />
            </View>
          </View>

          <View className="flex-row items-center gap-[10px] my-3">
            <View className="flex-1 h-px bg-border" />
            <Text className="text-[9px] tracking-[1.5px] text-inkMute uppercase">O CAMBIÁ A</Text>
            <View className="flex-1 h-px bg-border" />
          </View>

          <View className="flex-row flex-wrap gap-2">
            {CATEGORIES.filter((c) => c.id !== selected).map((cat) => (
              <TouchableOpacity
                key={cat.id}
                className="bg-card rounded-2xl border border-border p-[10px] gap-1"
                style={{ width: "30.5%" }}
                onPress={() => setSelected(cat.id)}
                activeOpacity={0.75}
              >
                <MaterialCommunityIcons name={cat.icon} size={18} color={T.inkSoft} />
                <Text className="text-[12.5px] font-semibold text-ink">{cat.label}</Text>
                <Text className="text-[9px] tracking-[1px] text-inkMute uppercase">{cat.sub}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Dimensions card — oculto para Flete */}
        {selected !== "xl" && (
          <View
            className="bg-cardSoft rounded-2xl p-[14px]"
            style={{ borderWidth: 1, borderColor: T.border, borderStyle: "dashed" }}
          >
            <View className="flex-row items-center justify-between mb-[10px]">
              <Text className="text-[10px] tracking-[1.5px] text-inkMute uppercase">MEDIDAS · IA</Text>
              <Text className="text-[9px] tracking-[1px] text-emeraldDeep uppercase font-bold">EDITAR</Text>
            </View>
            <View className="flex-row gap-2">
              {[
                { l: "LARGO", v: dimL, set: setDimL, u: "cm" },
                { l: "ANCHO", v: dimW, set: setDimW, u: "cm" },
                { l: "ALTO",  v: dimH, set: setDimH, u: "cm" },
                { l: "PESO",  v: dimKg, set: setDimKg, u: "kg" },
              ].map((d) => (
                <View key={d.l} className="flex-1 bg-card rounded-[10px] p-2 border border-borderSoft">
                  <Text className="text-[8px] tracking-[1px] text-inkMute mb-[3px] uppercase">{d.l}</Text>
                  <View className="flex-row items-baseline gap-0.5">
                    <RNTextInput
                      className="text-[17px] font-bold text-ink flex-1"
                      style={{ letterSpacing: -0.4, padding: 0 }}
                      value={d.v}
                      onChangeText={d.set}
                      keyboardType="decimal-pad"
                    />
                    <Text className="text-[10px] text-inkMute font-medium">{d.u}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Description — obligatoria */}
        <View className="gap-2">
          <Text className="text-[10px] text-inkSoft tracking-[1px] uppercase font-semibold">DESCRIPCIÓN</Text>
          <View className="flex-row items-start gap-[10px] bg-card rounded-xl border border-border px-[14px] py-3">
            <MaterialCommunityIcons name="text-box-outline" size={18} color={T.inkMute} style={{ marginTop: 2 }} />
            <RNTextInput
              className="flex-1 text-[15px] text-ink"
              style={{ minHeight: 48, padding: 0 }}
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
      <View className="absolute bottom-0 left-0 right-0 px-4 pt-6" style={{ paddingBottom: insets.bottom + 16 }}>
        <TouchableOpacity
          className={`rounded-2xl h-[54px] flex-row items-center justify-center gap-[10px] ${!canContinue ? "bg-inkMute" : "bg-forest"}`}
          style={canContinue ? { shadowColor: T.forest, shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.4, shadowRadius: 20, elevation: 5 } : undefined}
          onPress={handleNext}
          activeOpacity={0.88}
          disabled={!canContinue}
        >
          <Text className="text-[#F4EFE3] font-semibold text-[15px]">
            {canContinue ? "Continuar · Dirección" : "Agregá una descripción"}
          </Text>
          {canContinue && <MaterialCommunityIcons name="arrow-right" size={18} color="#F4EFE3" />}
        </TouchableOpacity>
      </View>
    </View>
  );
}
