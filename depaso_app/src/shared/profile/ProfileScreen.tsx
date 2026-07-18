import { useEffect, useState } from "react";
import { View, TouchableOpacity, ScrollView, Alert, Text as RNText } from "react-native";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import Constants from "expo-constants";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuthStore } from "@/src/shared/session/authStore";
import { useAddressBookStore } from "@/src/shared/profile/addressBookStore";
import { useSettingsStore } from "@/src/shared/session/settingsStore";
import { co2Service } from "@/src/shared/api/co2";
import { carriersService } from "@/src/shared/api/carriers";
import { UserType } from "@/src/shared/types";
import PublishTripScreen from "@/src/carrier/PublishTripScreen";
import { ForestHeroCard, HeroStatsRow, HeroStat, HeroStatUnit } from "@/src/shared/ui/ForestHeroCard";
import { ProfileRow, ProfileSection } from "./components/ProfileRow";
import { AddressModal } from "./components/AddressModal";
import { ContactModal } from "./components/ContactModal";
import { EditProfileModal } from "./EditProfileModal";
import { ChangePasswordModal } from "./ChangePasswordModal";
import { CarrierReviewsModal } from "./CarrierReviewsModal";
import { T } from "@/constants/tokens";

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { addresses, contacts } = useAddressBookStore();

  const [addrModal, setAddrModal]       = useState(false);
  const [contactModal, setContactModal] = useState(false);
  const [routeModal, setRouteModal]     = useState(false);
  const [editModal, setEditModal]       = useState(false);
  const [pwdModal, setPwdModal]         = useState(false);
  const [reviewsModal, setReviewsModal] = useState(false);

  // Persisted preferences (real toggles, not cosmetic).
  const notifOn = useSettingsStore((s) => s.notificationsEnabled);
  const collabOn = useSettingsStore((s) => s.preferCollaborative);
  const updateSettings = useSettingsStore((s) => s.update);

  const isCarrier = user?.user_type === UserType.CARRIER;
  const memberSince = user?.created_at ? new Date(user.created_at).getFullYear() : null;

  // Real stats: client → CO2 impact; carrier → delivery summary.
  const [stats, setStats] = useState({ shipments: 0, co2: 0, reputation: user?.rating ?? 5.0 });
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        if (isCarrier) {
          const s = await carriersService.getSummary();
          if (alive) setStats({ shipments: s.deliveries_completed, co2: Math.round(s.total_co2_saved_kg), reputation: s.reputation });
        } else {
          const i = await co2Service.getMyImpact();
          if (alive) setStats(prev => ({ shipments: i.shipments_delivered, co2: Math.round(i.total_co2_saved_kg), reputation: prev.reputation }));
        }
      } catch { /* keep defaults on failure */ }
    })();
    return () => { alive = false; };
  }, [isCarrier]);

  const handleLogout = () => {
    Alert.alert("Cerrar sesión", "¿Querés cerrar tu sesión?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Cerrar sesión", style: "destructive", onPress: () => { logout(); } },
    ]);
  };

  const firstName  = user?.first_name ?? "";
  const lastName   = user?.last_name  ?? "";
  const initials   = `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase() || "?";
  const fullName   = `${firstName} ${lastName}`.trim() || "Usuario";
  const email      = user?.email ?? "";
  const reputation = stats.reputation;
  // Eco level derived from real CO2 saved (1 base, +1 every 20 kg).
  const KG_PER_LEVEL = 20;
  const ecoLevel = Math.max(1, Math.floor(stats.co2 / KG_PER_LEVEL) + 1);
  const kgIntoLevel = stats.co2 % KG_PER_LEVEL;
  const ecoProgress = Math.min(100, Math.round((kgIntoLevel / KG_PER_LEVEL) * 100));

  return (
    <>
      <ScrollView
        className="flex-1 bg-bg"
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Top bar */}
        <View className="flex-row items-center justify-between px-5 pb-[6px]" style={{ paddingTop: insets.top + 6 }}>
          <Text className="text-[22px] font-bold text-ink tracking-[-0.6px]">Mi cuenta</Text>
          <TouchableOpacity className="w-[38px] h-[38px] rounded-xl border border-border bg-card items-center justify-center" activeOpacity={0.75} onPress={() => Alert.alert("Configuración", "Las opciones de configuración no están disponibles en esta versión.")}>
            <MaterialCommunityIcons name="cog-outline" size={18} color={T.ink} />
          </TouchableOpacity>
        </View>

        {/* ── Forest hero card ── */}
        <ForestHeroCard stripes="bottom" className="m-4 mt-[14px] rounded-3xl p-5 pb-[18px]">
          <View className="flex-row items-center gap-[14px] relative">
            <View
              className="w-16 h-16 rounded-[20px] bg-lime items-center justify-center"
              style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 4 }}
            >
              <RNText className="text-[26px] font-extrabold tracking-[-0.5px]" style={{ color: T.forest }}>{initials}</RNText>
            </View>
            <View className="flex-1">
              <RNText className="text-[22px] font-bold tracking-[-0.6px] leading-6" style={{ color: "#FFFFFF" }}>{fullName}</RNText>
              <RNText className="text-[12.5px] mt-1" style={{ color: "rgba(244,239,227,0.7)" }}>{email}</RNText>
              <View className="flex-row items-center gap-[6px] mt-[6px]">
                <View className="flex-row items-center gap-[3px] bg-lime/15 border border-lime/30 px-[7px] py-[2px] rounded-md">
                  <MaterialCommunityIcons name="leaf" size={10} color={T.lime} />
                  <RNText className="text-[9px] tracking-[1px] font-bold uppercase" style={{ color: T.lime }}>ECO · NIVEL {ecoLevel}</RNText>
                </View>
                {memberSince && <RNText className="text-[9px] tracking-[1px] uppercase" style={{ color: "rgba(244,239,227,0.75)" }}>DESDE {memberSince}</RNText>}
              </View>
            </View>
          </View>
          <HeroStatsRow className="mt-[22px]">
            <HeroStat value={stats.shipments} label="ENVÍOS" divider />
            <HeroStat
              value={<>{stats.co2}<HeroStatUnit>kg</HeroStatUnit></>}
              label="CO₂ AHORRADO"
              valueColor={T.lime}
              divider
            />
            <HeroStat
              value={reputation.toFixed(1)}
              label="REPUTACIÓN"
              trailing={<MaterialCommunityIcons name="star" size={14} color={T.lime} />}
            />
          </HeroStatsRow>
        </ForestHeroCard>

        {/* ── Eco progress card — derivado del CO2 real ahorrado ── */}
        <View className="mx-4 mt-3 bg-cardSoft border border-border rounded-2xl p-[14px]">
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-row items-center gap-2">
              <View className="w-[22px] h-[22px] rounded-md bg-mint items-center justify-center">
                <MaterialCommunityIcons name="leaf" size={12} color={T.forest} />
              </View>
              <Text className="text-[13px] text-ink font-semibold">
                Próximo nivel eco: <Text className="text-emeraldDeep">Nivel {ecoLevel + 1}</Text>
              </Text>
            </View>
            <Text className="text-[10px] tracking-[1px] text-inkMute font-bold">
              {kgIntoLevel} / {KG_PER_LEVEL} kg CO₂
            </Text>
          </View>
          <View className="h-[6px] bg-border rounded-md overflow-hidden">
            <View className="h-full bg-emerald rounded-md" style={{ width: `${ecoProgress}%` }} />
          </View>
        </View>

        {/* ── Sections ── */}
        <ProfileSection title="CUENTA" rows={[
          <ProfileRow key="datos" icon="account-outline"    label="Datos personales"  value="Nombre y teléfono" onPress={() => setEditModal(true)} />,
          <ProfileRow key="pwd"   icon="lock-outline"       label="Cambiar contraseña" onPress={() => setPwdModal(true)} />,
          <ProfileRow key="dirs"  icon="map-marker-outline" label="Mis direcciones"   value={`${addresses.length} guardada${addresses.length !== 1 ? "s" : ""}`} onPress={() => setAddrModal(true)} />,
          // "Mis personas" son destinatarios frecuentes para ENVIAR — un rider no envía.
          ...(isCarrier ? [] : [
            <ProfileRow key="pers" icon="account-multiple-outline" label="Mis personas" value={`${contacts.length} guardada${contacts.length !== 1 ? "s" : ""}`} onPress={() => setContactModal(true)} />,
          ]),
        ]} />

        {isCarrier && (
          <ProfileSection title="MODO CADETE" rows={[
            <ProfileRow
              key="route"
              icon="map-marker-path"
              label="Mi trayecto habitual"
              value="Publicá tu recorrido diario"
              onPress={() => setRouteModal(true)}
              accent
            />,
          ]} />
        )}

        <ProfileSection title="ACTIVIDAD" rows={[
          <ProfileRow key="hist"  icon="history"      label="Historial de envíos"    value={`${stats.shipments} ${stats.shipments === 1 ? "envío" : "envíos"}`} onPress={() => router.push("/(main)/envios")} />,
          ...(isCarrier
            ? [<ProfileRow key="stars" icon="star-outline" label="Mis calificaciones" value={`${reputation.toFixed(1)} ★`} onPress={() => setReviewsModal(true)} />]
            : [<ProfileRow key="eco" icon="leaf" label="Mi impacto eco" value="CO₂ ahorrado y equivalencias" accent onPress={() => router.push("/(main)/impacto")} />]),
        ]} />

        <ProfileSection title="PREFERENCIAS" rows={[
          <ProfileRow key="notif" icon="bell-outline" label="Notificaciones"                  trailing={notifOn ? "toggle-on" : "toggle-off"} onPress={() => updateSettings({ notificationsEnabled: !notifOn })} />,
          <ProfileRow key="colab" icon="leaf"         label="Preferir envíos colaborativos"   trailing={collabOn ? "toggle-on" : "toggle-off"} onPress={() => updateSettings({ preferCollaborative: !collabOn })} />,
        ]} />

        <ProfileSection title="AYUDA Y LEGAL" rows={[
          <ProfileRow key="help"  icon="help-circle-outline"   label="Centro de ayuda" onPress={() => Alert.alert("Centro de ayuda", "Nuestro centro de ayuda estará disponible próximamente.")} />,
          <ProfileRow key="terms" icon="file-document-outline" label="Términos y privacidad" onPress={() => Alert.alert("Términos y privacidad", "Disponibles en depaso.app/legal próximamente.")} />,
        ]} />

        <TouchableOpacity className="flex-row items-center justify-center gap-2 mx-4 mt-6 py-[14px] rounded-[14px] border border-border" onPress={handleLogout} activeOpacity={0.8}>
          <MaterialCommunityIcons name="logout" size={16} color={T.red} />
          <Text className="text-red font-semibold text-sm">Cerrar sesión</Text>
        </TouchableOpacity>

        <Text className="text-center mt-[14px] text-[9px] tracking-[2px] text-inkMute uppercase">
          DEPASO V{Constants.expoConfig?.version ?? "1.0.0"}
        </Text>
      </ScrollView>

      <AddressModal visible={addrModal}   onClose={() => setAddrModal(false)} />
      <ContactModal visible={contactModal} onClose={() => setContactModal(false)} />
      {routeModal && <PublishTripScreen onClose={() => setRouteModal(false)} />}
      <EditProfileModal visible={editModal} onClose={() => setEditModal(false)} />
      <ChangePasswordModal visible={pwdModal} onClose={() => setPwdModal(false)} />
      <CarrierReviewsModal visible={reviewsModal} onClose={() => setReviewsModal(false)} />
    </>
  );
}
