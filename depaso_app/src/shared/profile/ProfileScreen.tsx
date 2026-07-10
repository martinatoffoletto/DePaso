import { useEffect, useState } from "react";
import {
  View, TouchableOpacity, ScrollView,
  Modal, TextInput as RNTextInput, Alert,
} from "react-native";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuthStore } from "@/src/shared/session/authStore";
import { useAddressBookStore } from "@/src/shared/profile/addressBookStore";
import { useSettingsStore } from "@/src/shared/session/settingsStore";
import { co2Service } from "@/src/shared/api/co2";
import { carriersService } from "@/src/shared/api/carriers";
import { UserType } from "@/src/shared/types";
import PublishTripScreen from "@/src/carrier/PublishTripScreen";
import { EditProfileModal } from "./EditProfileModal";
import { ChangePasswordModal } from "./ChangePasswordModal";
import { CarrierReviewsModal } from "./CarrierReviewsModal";
import { T } from "@/constants/tokens";

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>["name"];

// ── Small helpers ─────────────────────────────────────────────────────────────

function Toggle({ on }: { on: boolean }) {
  return (
    <View className={`w-[38px] h-[22px] rounded-full px-[2px] justify-center ${on ? "bg-forest items-end" : "bg-border items-start"}`}>
      <View className="w-[18px] h-[18px] rounded-full bg-[#F4EFE3]" />
    </View>
  );
}

type Trailing = "chevron" | "toggle-on" | "toggle-off" | string;
function ProfileRow({ icon, label, value, trailing = "chevron", accent = false, danger = false, onPress }: {
  icon: IconName; label: string; value?: string;
  trailing?: Trailing; accent?: boolean; danger?: boolean; onPress?: () => void;
}) {
  const isChevron  = trailing === "chevron";
  const isToggleOn = trailing === "toggle-on";
  const isToggleOff = trailing === "toggle-off";
  const isText = !isChevron && !isToggleOn && !isToggleOff;
  return (
    <TouchableOpacity className="flex-row items-center gap-[14px] px-4 py-[14px]" activeOpacity={onPress ? 0.7 : 1} onPress={onPress}>
      <View className={`w-9 h-9 rounded-[10px] items-center justify-center shrink-0 ${accent ? "bg-mint" : "bg-cardSoft border border-borderSoft"}`}>
        <MaterialCommunityIcons name={icon} size={18} color={danger ? T.red : accent ? T.forest : T.inkSoft} />
      </View>
      <View className="flex-1 min-w-0">
        <Text className={`text-sm font-medium ${danger ? "text-red" : "text-ink"}`}>{label}</Text>
        {value && <Text className="text-[11.5px] text-inkMute mt-px" numberOfLines={1}>{value}</Text>}
      </View>
      {isChevron    && <MaterialCommunityIcons name="chevron-right" size={18} color={T.inkFaint} />}
      {isToggleOn   && <Toggle on={true} />}
      {isToggleOff  && <Toggle on={false} />}
      {isText       && <Text className="text-[10px] tracking-[1px] text-inkMute uppercase font-semibold">{trailing}</Text>}
    </TouchableOpacity>
  );
}

function ProfileSection({ title, rows }: { title: string; rows: React.ReactNode[] }) {
  return (
    <View className="mt-[18px]">
      <Text className="text-[10px] font-bold tracking-[2px] text-inkMute uppercase mx-5 mb-2">{title}</Text>
      <View className="mx-4 bg-card rounded-[18px] border border-border overflow-hidden">
        {rows.map((row, i) => (
          <View key={i}>
            {i > 0 && <View className="h-px bg-borderSoft ml-[66px]" />}
            {row}
          </View>
        ))}
      </View>
    </View>
  );
}

// ── Address modal ─────────────────────────────────────────────────────────────

function AddressModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const { addresses, addAddress, removeAddress } = useAddressBookStore();
  const [adding, setAdding] = useState(false);
  const [label, setLabel]   = useState("");
  const [addr, setAddr]     = useState("");

  function save() {
    if (!label.trim() || !addr.trim()) {
      Alert.alert("Completá los campos", "Necesitamos el nombre y la dirección.");
      return;
    }
    addAddress({ label: label.trim().toUpperCase(), address: addr.trim(), icon: "map-marker-outline" });
    setLabel(""); setAddr(""); setAdding(false);
  }

  function cancel() { setLabel(""); setAddr(""); setAdding(false); }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
        {/* Header */}
        <View className="flex-row items-center justify-between px-5 py-[14px] border-b border-borderSoft">
          <TouchableOpacity onPress={onClose} hitSlop={10}>
            <MaterialCommunityIcons name="arrow-left" size={22} color={T.ink} />
          </TouchableOpacity>
          <Text className="text-[17px] font-bold text-ink tracking-[-0.4px]">Mis direcciones</Text>
          {!adding
            ? <TouchableOpacity onPress={() => setAdding(true)} hitSlop={10}>
                <MaterialCommunityIcons name="plus" size={24} color={T.forest} />
              </TouchableOpacity>
            : <View className="w-6" />
          }
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: insets.bottom + 32 }}>
          {/* Add form */}
          {adding && (
            <View className="bg-card rounded-[18px] border border-forest p-4 gap-3">
              <Text className="text-[10px] tracking-[2px] text-forest font-bold uppercase">NUEVA DIRECCIÓN</Text>
              <View className="gap-1">
                <Text className="text-[9px] tracking-[1.5px] text-inkMute uppercase font-semibold">NOMBRE (ej: CASA, TRABAJO)</Text>
                <RNTextInput
                  className="text-[15px] text-ink border-b border-borderSoft py-[6px] font-medium"
                  value={label}
                  onChangeText={setLabel}
                  placeholder="CASA"
                  placeholderTextColor={T.inkFaint}
                  autoCapitalize="characters"
                  autoFocus
                />
              </View>
              <View className="gap-1">
                <Text className="text-[9px] tracking-[1.5px] text-inkMute uppercase font-semibold">DIRECCIÓN COMPLETA</Text>
                <RNTextInput
                  className="text-[15px] text-ink border-b border-borderSoft py-[6px] font-medium"
                  value={addr}
                  onChangeText={setAddr}
                  placeholder="Av. Corrientes 1234, CABA"
                  placeholderTextColor={T.inkFaint}
                />
              </View>
              <View className="flex-row gap-2 mt-1">
                <TouchableOpacity className="flex-1 flex-row justify-center items-center bg-cardSoft border border-border rounded-xl py-[13px]" onPress={cancel} activeOpacity={0.8}>
                  <Text className="text-sm font-semibold text-inkSoft">Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity className="flex-1 flex-row justify-center items-center bg-forest rounded-xl py-[13px]" onPress={save} activeOpacity={0.8}>
                  <Text className="text-sm font-bold text-[#F4EFE3]">Guardar</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* List */}
          {addresses.length === 0 && !adding ? (
            <View className="items-center gap-3 py-12">
              <MaterialCommunityIcons name="map-marker-off-outline" size={48} color={T.border} />
              <Text className="text-sm text-inkMute font-medium">Sin direcciones guardadas</Text>
            </View>
          ) : (
            addresses.map((a) => (
              <View key={a.id} className="flex-row items-center gap-3 bg-card rounded-[14px] border border-border p-[14px]">
                <View className="w-[38px] h-[38px] rounded-[10px] bg-mint items-center justify-center shrink-0">
                  <MaterialCommunityIcons name={a.icon as IconName} size={18} color={T.forest} />
                </View>
                <View className="flex-1">
                  <Text className="text-[13px] font-bold text-ink tracking-[-0.2px]">{a.label}</Text>
                  <Text className="text-xs text-inkMute mt-[2px]" numberOfLines={1}>{a.address}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => Alert.alert("Eliminar", `¿Eliminar "${a.label}"?`, [
                    { text: "Cancelar", style: "cancel" },
                    { text: "Eliminar", style: "destructive", onPress: () => removeAddress(a.id) },
                  ])}
                  hitSlop={10}
                >
                  <MaterialCommunityIcons name="trash-can-outline" size={18} color={T.inkMute} />
                </TouchableOpacity>
              </View>
            ))
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

// ── Contact modal ─────────────────────────────────────────────────────────────

function ContactModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const { contacts, addContact, removeContact } = useAddressBookStore();
  const [adding, setAdding]   = useState(false);
  const [label, setLabel]     = useState("");
  const [name, setName]       = useState("");
  const [phone, setPhone]     = useState("");

  function save() {
    if (!label.trim() || !name.trim()) {
      Alert.alert("Completá los campos", "Nombre y apodo son requeridos.");
      return;
    }
    addContact({ label: label.trim().toUpperCase(), name: name.trim(), phone: phone.trim() });
    setLabel(""); setName(""); setPhone(""); setAdding(false);
  }

  function cancel() { setLabel(""); setName(""); setPhone(""); setAdding(false); }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
        {/* Header */}
        <View className="flex-row items-center justify-between px-5 py-[14px] border-b border-borderSoft">
          <TouchableOpacity onPress={onClose} hitSlop={10}>
            <MaterialCommunityIcons name="arrow-left" size={22} color={T.ink} />
          </TouchableOpacity>
          <Text className="text-[17px] font-bold text-ink tracking-[-0.4px]">Mis personas</Text>
          {!adding
            ? <TouchableOpacity onPress={() => setAdding(true)} hitSlop={10}>
                <MaterialCommunityIcons name="plus" size={24} color={T.forest} />
              </TouchableOpacity>
            : <View className="w-6" />
          }
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: insets.bottom + 32 }}>
          {/* Add form */}
          {adding && (
            <View className="bg-card rounded-[18px] border border-forest p-4 gap-3">
              <Text className="text-[10px] tracking-[2px] text-forest font-bold uppercase">NUEVA PERSONA</Text>
              <View className="gap-1">
                <Text className="text-[9px] tracking-[1.5px] text-inkMute uppercase font-semibold">APODO (ej: MAMÁ, TRABAJO)</Text>
                <RNTextInput
                  className="text-[15px] text-ink border-b border-borderSoft py-[6px] font-medium"
                  value={label}
                  onChangeText={setLabel}
                  placeholder="MAMÁ"
                  placeholderTextColor={T.inkFaint}
                  autoCapitalize="characters"
                  autoFocus
                />
              </View>
              <View className="gap-1">
                <Text className="text-[9px] tracking-[1.5px] text-inkMute uppercase font-semibold">NOMBRE COMPLETO</Text>
                <RNTextInput
                  className="text-[15px] text-ink border-b border-borderSoft py-[6px] font-medium"
                  value={name}
                  onChangeText={setName}
                  placeholder="María García"
                  placeholderTextColor={T.inkFaint}
                />
              </View>
              <View className="gap-1">
                <Text className="text-[9px] tracking-[1.5px] text-inkMute uppercase font-semibold">TELÉFONO</Text>
                <RNTextInput
                  className="text-[15px] text-ink border-b border-borderSoft py-[6px] font-medium"
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="11 4521-8830"
                  placeholderTextColor={T.inkFaint}
                  keyboardType="phone-pad"
                />
              </View>
              <View className="flex-row gap-2 mt-1">
                <TouchableOpacity className="flex-1 flex-row justify-center items-center bg-cardSoft border border-border rounded-xl py-[13px]" onPress={cancel} activeOpacity={0.8}>
                  <Text className="text-sm font-semibold text-inkSoft">Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity className="flex-1 flex-row justify-center items-center bg-forest rounded-xl py-[13px]" onPress={save} activeOpacity={0.8}>
                  <Text className="text-sm font-bold text-[#F4EFE3]">Guardar</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* List */}
          {contacts.length === 0 && !adding ? (
            <View className="items-center gap-3 py-12">
              <MaterialCommunityIcons name="account-off-outline" size={48} color={T.border} />
              <Text className="text-sm text-inkMute font-medium">Sin personas guardadas</Text>
            </View>
          ) : (
            contacts.map((c) => (
              <View key={c.id} className="flex-row items-center gap-3 bg-card rounded-[14px] border border-border p-[14px]">
                <View className="w-[38px] h-[38px] rounded-[10px] bg-cardSoft items-center justify-center shrink-0">
                  <MaterialCommunityIcons name="account-outline" size={18} color={T.forest} />
                </View>
                <View className="flex-1">
                  <Text className="text-[13px] font-bold text-ink tracking-[-0.2px]">{c.label} · <Text className="font-normal text-ink">{c.name}</Text></Text>
                  {!!c.phone && <Text className="text-xs text-inkMute mt-[2px]">{c.phone}</Text>}
                </View>
                <TouchableOpacity
                  onPress={() => Alert.alert("Eliminar", `¿Eliminar "${c.label}"?`, [
                    { text: "Cancelar", style: "cancel" },
                    { text: "Eliminar", style: "destructive", onPress: () => removeContact(c.id) },
                  ])}
                  hitSlop={10}
                >
                  <MaterialCommunityIcons name="trash-can-outline" size={18} color={T.inkMute} />
                </TouchableOpacity>
              </View>
            ))
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

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
  const ecoLevel = Math.max(1, Math.floor(stats.co2 / 20) + 1);

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
        <View className="m-4 mt-[14px] rounded-3xl bg-forest p-5 pb-[18px] overflow-hidden">
          <View className="absolute bottom-7 -left-5 -right-5 h-5 rounded-[10px] bg-white/5 -rotate-3" />
          <View className="absolute bottom-2 -left-5 -right-5 h-5 rounded-[10px] bg-white/[0.04] -rotate-3" />
          <View className="flex-row items-center gap-[14px] relative">
            <View className="relative">
              <View
                className="w-16 h-16 rounded-[20px] bg-lime items-center justify-center"
                style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 4 }}
              >
                <Text className="text-[26px] font-extrabold text-forest tracking-[-0.5px]">{initials}</Text>
              </View>
              <View className="absolute -bottom-[2px] -right-[2px] w-[22px] h-[22px] rounded-full bg-[#F4EFE3] border-2 border-forest items-center justify-center">
                <MaterialCommunityIcons name="camera-outline" size={11} color={T.forest} />
              </View>
            </View>
            <View className="flex-1">
              <Text className="text-[22px] font-bold text-[#F4EFE3] tracking-[-0.6px] leading-6">{fullName}</Text>
              <Text className="text-[12.5px] text-[#F4EFE3]/70 mt-1">{email}</Text>
              <View className="flex-row items-center gap-[6px] mt-[6px]">
                <View className="flex-row items-center gap-[3px] bg-lime/15 border border-lime/30 px-[7px] py-[2px] rounded-md">
                  <MaterialCommunityIcons name="leaf" size={10} color={T.lime} />
                  <Text className="text-[9px] tracking-[1px] text-lime font-bold uppercase">ECO · NIVEL {ecoLevel}</Text>
                </View>
                {memberSince && <Text className="text-[9px] tracking-[1px] text-[#F4EFE3]/75 uppercase">DESDE {memberSince}</Text>}
              </View>
            </View>
          </View>
          <View className="flex-row mt-[22px]">
            <View className="flex-1 border-r border-[#F4EFE3]/[0.12] pr-[10px] mr-[14px]">
              <Text className="text-[22px] font-bold text-[#F4EFE3] tracking-[-0.5px]">{stats.shipments}</Text>
              <Text className="text-[9px] tracking-[1.5px] text-[#F4EFE3]/80 uppercase mt-[2px]">ENVÍOS</Text>
            </View>
            <View className="flex-1 border-r border-[#F4EFE3]/[0.12] pr-[10px] mr-[14px]">
              <Text className="text-[22px] font-bold text-lime tracking-[-0.5px]">{stats.co2}<Text className="text-xs font-normal text-[#F4EFE3]">kg</Text></Text>
              <Text className="text-[9px] tracking-[1.5px] text-[#F4EFE3]/80 uppercase mt-[2px]">CO₂ AHORRADO</Text>
            </View>
            <View className="flex-1">
              <View className="flex-row items-center gap-1">
                <Text className="text-[22px] font-bold text-[#F4EFE3] tracking-[-0.5px]">{reputation.toFixed(1)}</Text>
                <MaterialCommunityIcons name="star" size={14} color={T.lime} />
              </View>
              <Text className="text-[9px] tracking-[1.5px] text-[#F4EFE3]/80 uppercase mt-[2px]">REPUTACIÓN</Text>
            </View>
          </View>
        </View>

        {/* ── Eco progress card ── */}
        <View className="mx-4 mt-3 bg-cardSoft border border-border rounded-2xl p-[14px]">
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-row items-center gap-2">
              <View className="w-[22px] h-[22px] rounded-md bg-mint items-center justify-center">
                <MaterialCommunityIcons name="leaf" size={12} color={T.forest} />
              </View>
              <Text className="text-[13px] text-ink font-semibold">
                Próximo nivel: <Text className="text-emeraldDeep">Forestero</Text>
              </Text>
            </View>
            <Text className="text-[10px] tracking-[1px] text-inkMute font-bold">8 / 15 envíos</Text>
          </View>
          <View className="h-[6px] bg-border rounded-md overflow-hidden">
            <View className="w-[53%] h-full bg-emerald rounded-md" />
          </View>
        </View>

        {/* ── Sections ── */}
        <ProfileSection title="CUENTA" rows={[
          <ProfileRow key="datos" icon="account-outline"    label="Datos personales"  value="Nombre y teléfono" onPress={() => setEditModal(true)} />,
          <ProfileRow key="pwd"   icon="lock-outline"       label="Cambiar contraseña" onPress={() => setPwdModal(true)} />,
          <ProfileRow key="dirs"  icon="map-marker-outline" label="Mis direcciones"   value={`${addresses.length} guardada${addresses.length !== 1 ? "s" : ""}`} onPress={() => setAddrModal(true)} />,
          <ProfileRow key="pers"  icon="account-multiple-outline" label="Mis personas" value={`${contacts.length} guardada${contacts.length !== 1 ? "s" : ""}`} onPress={() => setContactModal(true)} />,
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

        <Text className="text-center mt-[14px] text-[9px] tracking-[2px] text-inkMute uppercase">DEPASO V1.0.0 · BUILD 4821</Text>
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
