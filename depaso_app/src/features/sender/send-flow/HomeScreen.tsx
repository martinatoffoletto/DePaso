import { useState } from "react";
import { View, StyleSheet, TouchableOpacity, ScrollView, Image, Alert } from "react-native";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { useAuthStore } from "@/src/stores/authStore";
import { T } from "@/constants/tokens";

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>["name"];
type HomeScreenProps = { onStart: (photoUri?: string | null) => void };

const DAYS = ["DOM", "LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB"];
function getDateLabel() {
  const d = new Date();
  return `${DAYS[d.getDay()]} · ${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}

const RECENT = [
  { title: "Zapatillas",  dest: "A Belgrano",  av: "MR", avBg: T.amber,   icon: "cube-outline"   as IconName },
  { title: "Documentos",  dest: "A V. López",  av: "FC", avBg: T.violet,  icon: "email-outline"  as IconName },
  { title: "Plantas",     dest: "A Núñez",     av: "RP", avBg: T.emerald, icon: "leaf"            as IconName },
];

export function HomeScreen({ onStart }: HomeScreenProps) {
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const firstName = user?.first_name ?? "Usuario";
  const initial = firstName.charAt(0).toUpperCase();

  const [photoUri, setPhotoUri] = useState<string | null>(null);

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
      { text: "Sacar foto",       onPress: pickFromCamera  },
      { text: "Elegir de galería", onPress: pickFromGallery },
      { text: "Cancelar", style: "cancel" },
    ]);
  }

  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={[s.content, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 24 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Forest header card ── */}
      <View style={s.forestCard}>
        <View style={s.topoLine1} />
        <View style={s.topoLine2} />
        <View style={s.forestTop}>
          <View>
            <Text style={s.dateLabel}>{getDateLabel()}</Text>
            <Text style={s.greeting}>Hola, {firstName}</Text>
            <Text style={s.heroTitle}>{"¿Qué movemos\nhoy?"}</Text>
          </View>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{initial}</Text>
          </View>
        </View>
        <View style={s.statsStrip}>
          <View style={[s.statCol, s.statBorder]}>
            <Text style={s.statNum}>12</Text>
            <Text style={s.statLabel}>ENVÍOS</Text>
          </View>
          <View style={[s.statCol, s.statBorder]}>
            <Text style={[s.statNum, { color: T.lime }]}>21<Text style={s.statUnit}>kg</Text></Text>
            <Text style={s.statLabel}>CO₂ AHORRADO</Text>
          </View>
          <View style={s.statCol}>
            <Text style={s.statNum}>4.9</Text>
            <Text style={s.statLabel}>REPUTACIÓN</Text>
          </View>
        </View>
      </View>

      {/* ── Package card ── */}
      <View style={s.packageCard}>
        <View style={s.packageCardHeader}>
          <View>
            <Text style={s.packageCardEyebrow}>EMPEZÁ POR ACÁ</Text>
            <Text style={s.packageCardTitle}>{"¿Qué vas a\nenviar hoy?"}</Text>
          </View>
          <View style={s.iaChip}>
            <MaterialCommunityIcons name="creation" size={12} color={T.forest} />
            <Text style={s.iaChipText}>IA</Text>
          </View>
        </View>

        {/* Photo zone — shows preview if photo picked, otherwise the camera prompt */}
        {photoUri ? (
          <>
            <TouchableOpacity style={s.previewZone} onPress={handlePhotoZonePress} activeOpacity={0.9}>
              <Image source={{ uri: photoUri }} style={s.previewImg} resizeMode="cover" />
              <View style={s.previewBadge}>
                <MaterialCommunityIcons name="check-circle" size={12} color={T.lime} />
                <Text style={s.previewBadgeText}>FOTO LISTA · TOCÁ PARA CAMBIAR</Text>
              </View>
              <TouchableOpacity style={s.previewRemove} onPress={() => setPhotoUri(null)} hitSlop={8}>
                <MaterialCommunityIcons name="close" size={14} color="#F4EFE3" />
              </TouchableOpacity>
            </TouchableOpacity>

            <TouchableOpacity style={s.ctaBtn} onPress={() => onStart(photoUri)} activeOpacity={0.88}>
              <Text style={s.ctaBtnText}>Continuar con esta foto</Text>
              <MaterialCommunityIcons name="arrow-right" size={18} color="#F4EFE3" />
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity style={s.cameraZone} onPress={handlePhotoZonePress} activeOpacity={0.88}>
              <View style={s.scanCornersWrap}><ScanCornersLime /></View>
              <View style={s.cameraContent}>
                <View style={s.cameraIconBox}>
                  <MaterialCommunityIcons name="camera-outline" size={26} color={T.forest} />
                </View>
                <View>
                  <Text style={s.cameraTitle}>Adjuntá una foto</Text>
                  <Text style={s.cameraSubtitle}>LA IA HACE EL RESTO</Text>
                </View>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={s.skipBtn} onPress={() => onStart(null)} activeOpacity={0.88}>
              <Text style={s.skipBtnText}>Continuar</Text>
              <MaterialCommunityIcons name="arrow-right" size={18} color={T.ink} />
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* ── Volvé a mandar ── */}
      <View>
        <View style={s.sectionRow}>
          <Text style={s.sectionTitle}>Volvé a mandar</Text>
          <Text style={s.sectionLink}>VER HISTORIAL</Text>
        </View>
        <View style={s.recentRow}>
          {RECENT.map((r, i) => (
            <TouchableOpacity key={i} style={s.recentCard} onPress={() => onStart(null)} activeOpacity={0.78}>
              <View style={s.recentIconBox}>
                <MaterialCommunityIcons name={r.icon} size={14} color={T.inkSoft} />
              </View>
              <Text style={s.recentTitle} numberOfLines={1}>{r.title}</Text>
              <Text style={s.recentDest} numberOfLines={1}>{r.dest}</Text>
              <View style={[s.recentAvatar, { backgroundColor: r.avBg }]}>
                <Text style={s.recentAvatarText}>{r.av}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ── Eco band ── */}
      <View style={s.ecoBand}>
        <View style={s.ecoBlob} />
        <View style={s.ecoIconBox}>
          <MaterialCommunityIcons name="leaf" size={20} color={T.forest} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.ecoTitle}>Logística colaborativa</Text>
          <Text style={s.ecoSub}>
            {"Compartiendo viajes ahorrás hasta "}
            <Text style={s.ecoHighlight}>1.8 kg CO₂</Text>
            {" por envío en AMBA"}
          </Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={18} color="rgba(244,239,227,0.5)" />
      </View>
    </ScrollView>
  );
}

function ScanCornersLime() {
  const corners: Array<{ top?: number; bottom?: number; left?: number; right?: number }> = [
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

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  content: { paddingHorizontal: 16, gap: 14 },

  // Forest card
  forestCard: { backgroundColor: T.forest, borderRadius: 22, padding: 22, overflow: "hidden" },
  topoLine1: { position: "absolute", top: 40, left: -20, right: -20, height: 16, borderRadius: 8, backgroundColor: "rgba(255,255,255,0.05)", transform: [{ rotate: "-6deg" }] },
  topoLine2: { position: "absolute", top: 62, left: -20, right: -20, height: 16, borderRadius: 8, backgroundColor: "rgba(255,255,255,0.04)", transform: [{ rotate: "-6deg" }] },
  forestTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  dateLabel: { fontSize: 10, letterSpacing: 2.5, color: "rgba(244,239,227,0.55)", textTransform: "uppercase", marginBottom: 6 },
  greeting: { fontSize: 14, color: "rgba(244,239,227,0.75)", marginBottom: 2 },
  heroTitle: { fontSize: 30, fontWeight: "700", color: "#F4EFE3", letterSpacing: -1, lineHeight: 34 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(244,239,227,0.12)", borderWidth: 1, borderColor: "rgba(244,239,227,0.2)", alignItems: "center", justifyContent: "center" },
  avatarText: { fontWeight: "700", fontSize: 15, color: "#F4EFE3" },
  statsStrip: { flexDirection: "row", marginTop: 18 },
  statCol: { flex: 1 },
  statBorder: { borderRightWidth: 1, borderRightColor: "rgba(244,239,227,0.12)", paddingRight: 10, marginRight: 14 },
  statNum: { fontSize: 22, fontWeight: "700", color: "#F4EFE3", letterSpacing: -0.5 },
  statUnit: { fontSize: 12, fontWeight: "400", color: "#F4EFE3" },
  statLabel: { fontSize: 9, letterSpacing: 1.5, color: "rgba(244,239,227,0.55)", textTransform: "uppercase", marginTop: 2 },

  // Package card
  packageCard: { backgroundColor: T.card, borderRadius: 24, borderWidth: 1, borderColor: T.border, padding: 16, shadowColor: T.forest, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.14, shadowRadius: 28, elevation: 3 },
  packageCardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 },
  packageCardEyebrow: { fontSize: 10, letterSpacing: 2, color: T.emeraldDeep, textTransform: "uppercase", marginBottom: 4 },
  packageCardTitle: { fontSize: 22, fontWeight: "700", color: T.ink, letterSpacing: -0.6, lineHeight: 26 },
  iaChip: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: T.mint, borderWidth: 1, borderColor: T.borderSoft, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 6 },
  iaChipText: { fontSize: 9, letterSpacing: 1, color: T.forest, fontWeight: "700", textTransform: "uppercase" },

  // Camera zone
  cameraZone: { height: 120, borderRadius: 16, backgroundColor: T.forest, overflow: "hidden", position: "relative", alignItems: "center", justifyContent: "center" },
  scanCornersWrap: { position: "absolute", top: 14, right: 14, bottom: 14, left: 14 },
  cameraContent: { flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 20 },
  cameraIconBox: { width: 52, height: 52, borderRadius: 16, backgroundColor: T.lime, alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 14 },
  cameraTitle: { fontSize: 16, fontWeight: "700", color: "#F4EFE3", letterSpacing: -0.3 },
  cameraSubtitle: { fontSize: 9, letterSpacing: 1.5, color: "rgba(244,239,227,0.6)", textTransform: "uppercase", marginTop: 4 },

  // Preview zone
  previewZone: { height: 160, borderRadius: 16, overflow: "hidden", position: "relative", marginBottom: 12 },
  previewImg: { width: "100%", height: "100%" },
  previewBadge: { position: "absolute", bottom: 10, left: 10, flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: T.forest, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  previewBadgeText: { fontSize: 8.5, letterSpacing: 1, color: T.lime, fontWeight: "700", textTransform: "uppercase" },
  previewRemove: { position: "absolute", top: 10, right: 10, width: 28, height: 28, borderRadius: 14, backgroundColor: "rgba(0,0,0,0.45)", alignItems: "center", justifyContent: "center" },

  // CTA
  ctaBtn: { backgroundColor: T.forest, borderRadius: 14, paddingVertical: 14, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, shadowColor: T.forest, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 16, elevation: 4 },
  ctaBtnText: { fontSize: 15, fontWeight: "700", color: "#F4EFE3" },
  skipBtn: { marginTop: 10, borderRadius: 14, paddingVertical: 14, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, borderWidth: 1, borderColor: T.border, backgroundColor: T.card },
  skipBtnText: { fontSize: 15, fontWeight: "600", color: T.ink },

  // Recent
  sectionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" },
  sectionTitle: { fontSize: 15, fontWeight: "600", color: T.ink, letterSpacing: -0.3 },
  sectionLink: { fontSize: 10, letterSpacing: 1.5, color: T.emeraldDeep, textTransform: "uppercase" },
  recentRow: { flexDirection: "row", gap: 8, marginTop: 10 },
  recentCard: { flex: 1, backgroundColor: T.card, borderRadius: 14, borderWidth: 1, borderColor: T.border, padding: 10, position: "relative" },
  recentIconBox: { width: 30, height: 30, borderRadius: 8, backgroundColor: T.cardSoft, borderWidth: 1, borderColor: T.borderSoft, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  recentTitle: { fontSize: 12.5, fontWeight: "600", color: T.ink },
  recentDest: { fontSize: 9, letterSpacing: 1, color: T.inkMute, textTransform: "uppercase", marginTop: 1 },
  recentAvatar: { position: "absolute", top: 10, right: 10, width: 18, height: 18, borderRadius: 18, borderWidth: 2, borderColor: T.card, alignItems: "center", justifyContent: "center" },
  recentAvatarText: { fontSize: 7, fontWeight: "700", color: "#F4EFE3" },

  // Eco
  ecoBand: { backgroundColor: T.forest, borderRadius: 18, padding: 14, paddingRight: 16, flexDirection: "row", alignItems: "center", gap: 12, overflow: "hidden" },
  ecoBlob: { position: "absolute", right: -20, top: -10, width: 140, height: 80, borderRadius: 60, backgroundColor: T.lime, opacity: 0.18 },
  ecoIconBox: { width: 36, height: 36, borderRadius: 12, backgroundColor: T.lime, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  ecoTitle: { fontSize: 14, fontWeight: "600", color: "#F4EFE3", letterSpacing: -0.2 },
  ecoSub: { fontSize: 11.5, color: "rgba(244,239,227,0.7)", lineHeight: 17, marginTop: 2 },
  ecoHighlight: { color: T.lime, fontWeight: "600" },
});
