import { useState, useEffect } from "react";
import { View, TouchableOpacity, ScrollView, Image, Alert, Text } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { useAuthStore } from "@/src/stores/authStore";
import { co2Service } from "@/src/services";
import type { ClientImpact } from "@/src/types";
import { T } from "@/constants/tokens";

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>["name"];
type HomeScreenProps = { onStart: (photoUri?: string | null) => void };

const DAYS = ["DOM", "LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB"];
function getDateLabel() {
  const d = new Date();
  return `${DAYS[d.getDay()]} · ${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}

const RECENT = [
  { title: "Zapatillas",  dest: "A Belgrano",  av: "MR", avBg: T.amber,   icon: "cube-outline"  as IconName },
  { title: "Documentos",  dest: "A V. López",  av: "FC", avBg: T.violet,  icon: "email-outline" as IconName },
  { title: "Plantas",     dest: "A Núñez",     av: "RP", avBg: T.emerald, icon: "leaf"           as IconName },
];

export function HomeScreen({ onStart }: HomeScreenProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const firstName = user?.first_name ?? "Usuario";
  const initial = firstName.charAt(0).toUpperCase();

  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [impact, setImpact] = useState<ClientImpact | null>(null);

  useEffect(() => {
    co2Service.getMyImpact()
      .then(setImpact)
      .catch(() => {});
  }, []);

  async function pickFromCamera() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permiso requerido", "Necesitamos acceso a la cámara.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: "images", quality: 0.8 });
    if (!result.canceled && result.assets[0]) setPhotoUri(result.assets[0].uri);
  }

  async function pickFromGallery() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permiso requerido", "Necesitamos acceso a la galería.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: "images", quality: 0.8 });
    if (!result.canceled && result.assets[0]) setPhotoUri(result.assets[0].uri);
  }

  function handlePhotoZonePress() {
    Alert.alert("Foto del paquete", "¿Cómo querés agregar la foto?", [
      { text: "Sacar foto",        onPress: pickFromCamera  },
      { text: "Elegir de galería", onPress: pickFromGallery },
      { text: "Cancelar", style: "cancel" },
    ]);
  }

  return (
    <ScrollView
      className="flex-1 bg-bg"
      contentContainerStyle={{ paddingHorizontal: 16, gap: 14, paddingTop: insets.top + 8, paddingBottom: insets.bottom + 24 }}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Forest header card ── */}
      <View className="bg-forest rounded-[22px] p-[22px] overflow-hidden">
        <View
          className="absolute h-4 rounded-lg bg-white/5"
          style={{ top: 40, left: -20, right: -20, transform: [{ rotate: "-6deg" }] }}
        />
        <View
          className="absolute h-4 rounded-lg"
          style={{ top: 62, left: -20, right: -20, backgroundColor: "rgba(255,255,255,0.04)", transform: [{ rotate: "-6deg" }] }}
        />

        <View className="flex-row justify-between items-start">
          <View>
            <Text className="text-[10px] tracking-[2.5px] uppercase mb-[6px]" style={{ color: "rgba(244,239,227,0.8)" }}>
              {getDateLabel()}
            </Text>
            <Text className="text-sm mb-0.5" style={{ color: "rgba(244,239,227,0.75)" }}>Hola, {firstName}</Text>
            <Text className="text-[30px] font-bold text-[#F4EFE3] tracking-[-1px] leading-[34px]">{"¿Qué movemos\nhoy?"}</Text>
          </View>
          <View
            className="w-11 h-11 rounded-full items-center justify-center"
            style={{ backgroundColor: "rgba(244,239,227,0.12)", borderWidth: 1, borderColor: "rgba(244,239,227,0.2)" }}
          >
            <Text className="font-bold text-[15px] text-[#F4EFE3]">{initial}</Text>
          </View>
        </View>

        <View className="flex-row mt-[18px]">
          <View className="flex-1 pr-[10px] mr-[14px]" style={{ borderRightWidth: 1, borderRightColor: "rgba(244,239,227,0.12)" }}>
            <Text className="text-[22px] font-bold text-[#F4EFE3] tracking-[-0.5px]">
              {impact != null ? String(impact.shipments_delivered) : "—"}
            </Text>
            <Text className="text-[9px] tracking-[1.5px] uppercase mt-0.5" style={{ color: "rgba(244,239,227,0.8)" }}>ENVÍOS</Text>
          </View>
          <View className="flex-1 pr-[10px] mr-[14px]" style={{ borderRightWidth: 1, borderRightColor: "rgba(244,239,227,0.12)" }}>
            <Text className="text-[22px] font-bold text-lime tracking-[-0.5px]">
              {impact != null ? impact.total_co2_saved_kg.toFixed(1) : "—"}
              {impact != null ? <Text className="text-xs font-normal text-[#F4EFE3]">kg</Text> : null}
            </Text>
            <Text className="text-[9px] tracking-[1.5px] uppercase mt-0.5" style={{ color: "rgba(244,239,227,0.8)" }}>CO₂ AHORRADO</Text>
          </View>
          <View className="flex-1">
            <Text className="text-[22px] font-bold text-[#F4EFE3] tracking-[-0.5px]">
              {user ? user.rating.toFixed(1) : "—"}
            </Text>
            <Text className="text-[9px] tracking-[1.5px] uppercase mt-0.5" style={{ color: "rgba(244,239,227,0.8)" }}>REPUTACIÓN</Text>
          </View>
        </View>
      </View>

      {/* ── Package card ── */}
      <View
        className="bg-card rounded-[24px] border border-border p-4"
        style={{ shadowColor: T.forest, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.14, shadowRadius: 28, elevation: 3 }}
      >
        <View className="flex-row justify-between items-start mb-3">
          <View>
            <Text className="text-[10px] tracking-[2px] text-emeraldDeep uppercase mb-1">EMPEZÁ POR ACÁ</Text>
            <Text className="text-[22px] font-bold text-ink tracking-[-0.6px] leading-[26px]">{"¿Qué vas a\nenviar hoy?"}</Text>
          </View>
          <View className="flex-row items-center gap-[5px] bg-mint border border-borderSoft rounded-[10px] px-2 py-[6px]">
            <MaterialCommunityIcons name="creation" size={12} color={T.forest} />
            <Text className="text-[9px] tracking-[1px] text-forest font-bold uppercase">IA</Text>
          </View>
        </View>

        {photoUri ? (
          <>
            <TouchableOpacity className="h-[160px] rounded-2xl overflow-hidden mb-3" onPress={handlePhotoZonePress} activeOpacity={0.9}>
              <Image source={{ uri: photoUri }} className="w-full h-full" resizeMode="cover" />
              <View className="absolute bottom-[10px] left-[10px] flex-row items-center gap-[5px] px-[10px] py-[5px] rounded-lg" style={{ backgroundColor: "rgba(26,26,26,0.85)" }}>
                <MaterialCommunityIcons name="check-circle" size={12} color={T.lime} />
                <Text className="text-[8.5px] tracking-[1px] text-lime font-bold uppercase">FOTO LISTA · TOCÁ PARA CAMBIAR</Text>
              </View>
              <TouchableOpacity
                className="absolute top-[10px] right-[10px] w-7 h-7 rounded-full items-center justify-center"
                style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
                onPress={() => setPhotoUri(null)}
                hitSlop={8}
              >
                <MaterialCommunityIcons name="close" size={14} color="#F4EFE3" />
              </TouchableOpacity>
            </TouchableOpacity>

            <TouchableOpacity
              className="bg-forest rounded-[14px] py-[14px] flex-row items-center justify-center gap-[10px]"
              style={{ shadowColor: T.forest, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 16, elevation: 4 }}
              onPress={() => onStart(photoUri)}
              activeOpacity={0.88}
            >
              <Text className="text-[15px] font-bold text-[#F4EFE3]">Continuar con esta foto</Text>
              <MaterialCommunityIcons name="arrow-right" size={18} color="#F4EFE3" />
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity
              className="h-[120px] rounded-2xl overflow-hidden items-center justify-center"
              style={{ backgroundColor: "#1A1A1A" }}
              onPress={handlePhotoZonePress}
              activeOpacity={0.88}
            >
              <View className="absolute top-[14px] right-[14px] bottom-[14px] left-[14px]">
                <ScanCornersLime />
              </View>
              <View className="flex-row items-center gap-[14px] px-5">
                <View
                  className="w-[52px] h-[52px] rounded-2xl bg-lime items-center justify-center"
                  style={{ shadowColor: T.lime, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 14 }}
                >
                  <MaterialCommunityIcons name="camera-outline" size={26} color="#1A1A1A" />
                </View>
                <View>
                  <Text className="text-[16px] font-bold text-[#F4EFE3] tracking-[-0.3px]">Adjuntá una foto</Text>
                  <Text className="text-[9px] tracking-[1.5px] uppercase mt-1" style={{ color: "rgba(255,255,255,0.45)" }}>LA IA HACE EL RESTO</Text>
                </View>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              className="mt-[10px] rounded-[14px] py-[14px] flex-row items-center justify-center gap-[10px] border border-border bg-card"
              onPress={() => onStart(null)}
              activeOpacity={0.88}
            >
              <Text className="text-[15px] font-semibold text-ink">Continuar</Text>
              <MaterialCommunityIcons name="arrow-right" size={18} color={T.ink} />
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* ── Volvé a mandar ── */}
      <View>
        <View className="flex-row justify-between items-baseline">
          <Text className="text-[15px] font-semibold text-ink tracking-[-0.3px]">Volvé a mandar</Text>
          <TouchableOpacity onPress={() => router.push("/(main)/envios")} hitSlop={8}>
            <Text className="text-[10px] tracking-[1.5px] text-emeraldDeep uppercase">VER HISTORIAL</Text>
          </TouchableOpacity>
        </View>
        <View className="flex-row gap-2 mt-[10px]">
          {RECENT.map((r, i) => (
            <TouchableOpacity key={i} className="flex-1 bg-card rounded-[14px] border border-border p-[10px]" onPress={() => onStart(null)} activeOpacity={0.78}>
              <View className="w-[30px] h-[30px] rounded-lg bg-cardSoft border border-borderSoft items-center justify-center mb-2">
                <MaterialCommunityIcons name={r.icon} size={14} color={T.inkSoft} />
              </View>
              <Text className="text-[12.5px] font-semibold text-ink" numberOfLines={1}>{r.title}</Text>
              <Text className="text-[9px] tracking-[1px] text-inkMute uppercase mt-px" numberOfLines={1}>{r.dest}</Text>
              <View
                className="absolute top-[10px] right-[10px] w-[18px] h-[18px] rounded-full border-2 border-card items-center justify-center"
                style={{ backgroundColor: r.avBg }}
              >
                <Text className="text-[7px] font-bold text-[#F4EFE3]">{r.av}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ── Eco band ── */}
      <TouchableOpacity
        onPress={() => router.push("/(main)/impacto")}
        activeOpacity={0.88}
        className="rounded-[18px] p-[14px] pr-4 flex-row items-center gap-3"
        style={{ backgroundColor: T.mint, borderWidth: 1, borderColor: T.border }}
      >
        <View className="w-9 h-9 rounded-xl items-center justify-center shrink-0" style={{ backgroundColor: T.emerald }}>
          <MaterialCommunityIcons name="leaf" size={18} color="#fff" />
        </View>
        <View className="flex-1">
          <Text className="text-sm font-semibold tracking-[-0.2px]" style={{ color: T.forest }}>Logística colaborativa</Text>
          <Text className="text-[11.5px] leading-[17px] mt-0.5" style={{ color: T.inkSoft }}>
            {"Compartiendo viajes ahorrás hasta "}
            <Text style={{ color: T.emeraldDeep, fontWeight: "600" }}>1.8 kg CO₂</Text>
            {" por envío en AMBA"}
          </Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={18} color={T.inkFaint} />
      </TouchableOpacity>
    </ScrollView>
  );
}

function ScanCornersLime() {
  const corners: { top?: number; bottom?: number; left?: number; right?: number }[] = [
    { top: 0, left: 0 }, { top: 0, right: 0 }, { bottom: 0, left: 0 }, { bottom: 0, right: 0 },
  ];
  return (
    <>
      {corners.map((pos, i) => (
        <View key={i} style={[{
          position: "absolute", width: 20, height: 20, borderColor: T.lime,
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
