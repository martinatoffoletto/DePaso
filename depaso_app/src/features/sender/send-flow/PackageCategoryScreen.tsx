import { useState } from "react";
import {
  View, TouchableOpacity, ScrollView,
  TextInput as RNTextInput, Alert, Image, Text,
} from "react-native";
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
  { id: "s",  label: "Pequeño / Documentos", description: "Hasta 3 kg — sobres, libros, ropa",     maxKg: 3,   icon: "email-outline" },
  { id: "m",  label: "Carga mediana",        description: "Hasta 10 kg — electrodoméstico chico",  maxKg: 10,  icon: "cube-outline" },
  { id: "l",  label: "Grande / Voluminoso",  description: "Hasta 30 kg — TV, valija, monitor",     maxKg: 30,  icon: "television-play" },
  { id: "xl", label: "Mudanza / Flete",      description: "Más de 30 kg — muebles, mudanza",       maxKg: 200, icon: "wardrobe-outline" },
];

function mockClassify(): { categoryId: string; confidence: number; weightKg: number } {
  return { categoryId: "m", confidence: 0.87, weightKg: 3.2 };
}

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
    { top: 0, left: 0 },
    { top: 0, right: 0 },
    { bottom: 0, left: 0 },
    { bottom: 0, right: 0 },
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
          borderTopLeftRadius:     i === 0 ? 6 : 0,
          borderTopRightRadius:    i === 1 ? 6 : 0,
          borderBottomLeftRadius:  i === 2 ? 6 : 0,
          borderBottomRightRadius: i === 3 ? 6 : 0,
        }, pos]} />
      ))}
    </>
  );
}

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
        <StepDots current={2} total={4} />
        <View className="w-[38px] h-[38px] rounded-xl border border-border bg-card items-center justify-center">
          <MaterialCommunityIcons name="creation" size={16} color={T.ink} />
        </View>
      </View>

      <View className="px-5 pt-1 pb-[14px]">
        <Text className="text-[10px] tracking-[2.5px] text-emeraldDeep uppercase mb-1">PASO 02 · DETECCIÓN AUTOMÁTICA</Text>
        <Text className="text-[26px] font-bold text-ink tracking-[-0.8px] leading-[30px]">Clasificación{"\n"}del paquete</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 16, paddingBottom: insets.bottom + 40 }}
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
                onPress={handleTakePhoto}
                activeOpacity={0.85}
              >
                <MaterialCommunityIcons name="camera-retake-outline" size={14} color={T.ink} />
                <Text className="text-xs font-medium text-ink">Otra</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="absolute bottom-0 left-0 right-0 flex-row items-center justify-center gap-[6px] py-[10px]"
                style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
                onPress={handleTakePhoto}
                activeOpacity={0.85}
              >
                <MaterialCommunityIcons name="camera-retake-outline" size={18} color="#fff" />
                <Text className="text-[13px] font-semibold text-white">Reemplazar foto</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              className="h-[170px] rounded-2xl bg-[#E8DEC2] items-center justify-center"
              onPress={handleTakePhoto}
              activeOpacity={0.85}
              disabled={classifying}
            >
              <View className="absolute top-[18px] right-[18px] bottom-[18px] left-[18px]">
                <ScanCorners />
              </View>
              {classifying ? (
                <View className="items-center gap-2">
                  <MaterialCommunityIcons name="brain" size={28} color={T.emerald} />
                  <Text className="text-sm font-semibold text-emerald">Clasificando...</Text>
                </View>
              ) : (
                <View className="items-center gap-[6px]">
                  <MaterialCommunityIcons name="camera-outline" size={28} color={T.emeraldDeep} />
                  <Text className="text-sm font-semibold text-ink">Foto del paquete</Text>
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

          {/* AI tag bar */}
          {(aiResult || classifying) && (
            <View className="flex-row items-center gap-[10px] pt-3 pb-1 px-1">
              <View className="w-7 h-7 rounded-lg bg-forest items-center justify-center">
                <MaterialCommunityIcons name="creation" size={14} color={T.lime} />
              </View>
              <View className="flex-1">
                <Text className="text-[9px] tracking-[1.5px] text-inkMute uppercase">ANÁLISIS DE VISIÓN · 1.4s</Text>
                <Text className="text-[12.5px] text-ink font-medium mt-px">
                  {aiResult
                    ? `Detectamos ${CATEGORIES.find((c) => c.id === aiResult.categoryId)?.label.toLowerCase() ?? "un paquete"}`
                    : "Analizando imagen..."}
                </Text>
              </View>
              {aiResult && (
                <View className="flex-row items-center gap-1 bg-mint px-2 py-1 rounded-lg">
                  <View className="w-[5px] h-[5px] rounded-full bg-emeraldDeep" />
                  <Text className="text-[10px] tracking-[0.5px] text-forest font-bold">{Math.round(aiResult.confidence * 100)}%</Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Category section */}
        <View>
          <Text className="text-[15px] font-semibold text-ink tracking-[-0.3px] mb-[10px]">Confirmá la categoría</Text>

          {aiResult && (
            <TouchableOpacity
              className="bg-card rounded-2xl p-[14px] flex-row items-center gap-3"
              style={{ borderWidth: 1.5, borderColor: selected === aiResult.categoryId ? T.forest : T.border }}
              onPress={() => setSelected(aiResult.categoryId)}
              activeOpacity={0.8}
            >
              <View className="w-11 h-11 rounded-xl bg-mint items-center justify-center">
                <MaterialCommunityIcons
                  name={CATEGORIES.find((c) => c.id === aiResult.categoryId)?.icon ?? "cube-outline"}
                  size={22} color={T.forest}
                />
              </View>
              <View className="flex-1">
                <View className="flex-row items-center gap-[6px] mb-0.5">
                  <Text className="text-[16px] font-bold text-ink tracking-[-0.3px]">
                    {CATEGORIES.find((c) => c.id === aiResult.categoryId)?.label ?? aiResult.categoryId}
                  </Text>
                  <View className="bg-forest rounded-[5px] px-[6px] py-0.5">
                    <Text className="text-[8px] tracking-[1px] text-lime font-bold uppercase">IA</Text>
                  </View>
                </View>
                <Text className="text-[11.5px] text-inkMute">
                  {CATEGORIES.find((c) => c.id === aiResult.categoryId)?.description ?? ""}
                </Text>
              </View>
              <View className="w-[22px] h-[22px] rounded-full bg-forest items-center justify-center">
                <MaterialCommunityIcons name="check" size={14} color="#F4EFE3" />
              </View>
            </TouchableOpacity>
          )}

          <View className="flex-row items-center gap-[10px] my-3">
            <View className="flex-1 h-px bg-border" />
            <Text className="text-[9px] tracking-[1.5px] text-inkMute uppercase">{aiResult ? "O CAMBIÁ A" : "ELEGÍ MANUALMENTE"}</Text>
            <View className="flex-1 h-px bg-border" />
          </View>

          <View className="flex-row flex-wrap gap-[10px]">
            {CATEGORIES.map((cat) => {
              const isSelected = selected === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  className={`rounded-2xl p-[14px] gap-[6px] ${isSelected ? "bg-mint" : "bg-card"}`}
                  style={{ width: "47%", borderWidth: 1.5, borderColor: isSelected ? T.forest : T.border }}
                  onPress={() => {
                    setSelected(cat.id);
                    if (!weightKg) setWeightKg(String(cat.maxKg / 2));
                  }}
                  activeOpacity={0.75}
                >
                  <MaterialCommunityIcons name={cat.icon} size={26} color={isSelected ? T.forest : T.inkSoft} />
                  <Text className={`font-semibold ${isSelected ? "text-forest" : "text-ink"}`}>{cat.label}</Text>
                  <Text className="text-xs text-inkSoft leading-4" numberOfLines={2}>{cat.description}</Text>
                  {isSelected && (
                    <View className="absolute top-[10px] right-[10px] w-5 h-5 rounded-full bg-forest items-center justify-center">
                      <MaterialCommunityIcons name="check" size={12} color="#fff" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Description */}
        <View className="gap-2">
          <Text className="text-[10px] text-inkSoft tracking-[1px] uppercase font-semibold">DESCRIPCIÓN (opcional)</Text>
          <View className="flex-row items-start gap-[10px] bg-card rounded-xl border border-border px-[14px] py-[10px]">
            <MaterialCommunityIcons name="text-box-outline" size={20} color={T.inkMute} style={{ marginTop: 2 }} />
            <RNTextInput
              className="flex-1 text-[16px] text-ink"
              style={{ minHeight: 56, padding: 0 }}
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
        <View className="gap-2">
          <Text className="text-[10px] text-inkSoft tracking-[1px] uppercase font-semibold">PESO ESTIMADO (kg)</Text>
          <View className="flex-row items-center gap-[10px] bg-card rounded-xl border border-border px-[14px] py-3">
            <MaterialCommunityIcons name="scale-bathroom" size={20} color={T.inkMute} />
            <RNTextInput
              className="flex-1 text-[16px] text-ink"
              style={{ padding: 0 }}
              value={weightKg}
              onChangeText={setWeightKg}
              keyboardType="decimal-pad"
              placeholder="Ej: 3.5"
              placeholderTextColor={T.inkFaint}
            />
            <Text className="text-sm text-inkSoft">kg</Text>
          </View>
        </View>

        {/* CTA */}
        <TouchableOpacity
          className={`flex-row rounded-2xl py-4 items-center justify-center gap-2 mt-1 ${!canContinue ? "bg-inkMute" : "bg-forest"}`}
          onPress={() => { if (!canContinue) return; onNext({ categoryId: selected!, weightKg: parseFloat(weightKg), description, photoUri }); }}
          activeOpacity={0.85}
        >
          <Text className="text-white font-bold text-[16px]">
            {canContinue ? "Ver modalidades de envío" : "Seleccioná una categoría"}
          </Text>
          {canContinue && <MaterialCommunityIcons name="arrow-right" size={20} color="#fff" />}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
