import { useState } from "react";
import {
  View, StyleSheet, TouchableOpacity, ScrollView,
  Modal, TextInput as RNTextInput, Alert,
} from "react-native";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuthStore } from "@/src/stores/authStore";
import { useAddressBookStore } from "@/src/stores/addressBookStore";
import { UserType } from "@/src/types";
import PublishRouteScreen from "@/src/features/carrier/PublishRouteScreen";
import { T } from "@/constants/tokens";

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>["name"];

const MOCK = { shipments: 12, co2: 21, reputation: 4.9 };

// ── Small helpers ─────────────────────────────────────────────────────────────

function Toggle({ on }: { on: boolean }) {
  return (
    <View style={{ width: 38, height: 22, borderRadius: 11, backgroundColor: on ? T.forest : T.border, paddingHorizontal: 2, justifyContent: "center", alignItems: on ? "flex-end" : "flex-start" }}>
      <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: "#F4EFE3" }} />
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
    <TouchableOpacity style={p.row} activeOpacity={onPress ? 0.7 : 1} onPress={onPress}>
      <View style={[p.iconBox, accent && p.iconBoxAccent]}>
        <MaterialCommunityIcons name={icon} size={18} color={danger ? T.red : accent ? T.forest : T.inkSoft} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={[p.rowLabel, danger && { color: T.red }]}>{label}</Text>
        {value && <Text style={p.rowValue} numberOfLines={1}>{value}</Text>}
      </View>
      {isChevron    && <MaterialCommunityIcons name="chevron-right" size={18} color={T.inkFaint} />}
      {isToggleOn   && <Toggle on={true} />}
      {isToggleOff  && <Toggle on={false} />}
      {isText       && <Text style={p.trailingText}>{trailing}</Text>}
    </TouchableOpacity>
  );
}

function ProfileSection({ title, rows }: { title: string; rows: React.ReactNode[] }) {
  return (
    <View style={{ marginTop: 18 }}>
      <Text style={p.sectionTitle}>{title}</Text>
      <View style={p.sectionCard}>
        {rows.map((row, i) => (
          <View key={i}>
            {i > 0 && <View style={p.divider} />}
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
      <View style={{ flex: 1, backgroundColor: T.bg, paddingTop: insets.top }}>
        {/* Header */}
        <View style={m.header}>
          <TouchableOpacity onPress={onClose} hitSlop={10}>
            <MaterialCommunityIcons name="arrow-left" size={22} color={T.ink} />
          </TouchableOpacity>
          <Text style={m.headerTitle}>Mis direcciones</Text>
          {!adding
            ? <TouchableOpacity onPress={() => setAdding(true)} hitSlop={10}>
                <MaterialCommunityIcons name="plus" size={24} color={T.forest} />
              </TouchableOpacity>
            : <View style={{ width: 24 }} />
          }
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: insets.bottom + 32 }}>
          {/* Add form */}
          {adding && (
            <View style={m.formCard}>
              <Text style={m.formTitle}>NUEVA DIRECCIÓN</Text>
              <View style={m.inputWrap}>
                <Text style={m.inputLabel}>NOMBRE (ej: CASA, TRABAJO)</Text>
                <RNTextInput
                  style={m.input}
                  value={label}
                  onChangeText={setLabel}
                  placeholder="CASA"
                  placeholderTextColor={T.inkFaint}
                  autoCapitalize="characters"
                  autoFocus
                />
              </View>
              <View style={m.inputWrap}>
                <Text style={m.inputLabel}>DIRECCIÓN COMPLETA</Text>
                <RNTextInput
                  style={m.input}
                  value={addr}
                  onChangeText={setAddr}
                  placeholder="Av. Corrientes 1234, CABA"
                  placeholderTextColor={T.inkFaint}
                />
              </View>
              <View style={{ flexDirection: "row", gap: 8, marginTop: 4 }}>
                <TouchableOpacity style={[m.formBtn, m.formBtnSecondary, { flex: 1 }]} onPress={cancel} activeOpacity={0.8}>
                  <Text style={m.formBtnSecText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[m.formBtn, { flex: 1 }]} onPress={save} activeOpacity={0.8}>
                  <Text style={m.formBtnText}>Guardar</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* List */}
          {addresses.length === 0 && !adding ? (
            <View style={m.empty}>
              <MaterialCommunityIcons name="map-marker-off-outline" size={48} color={T.border} />
              <Text style={m.emptyText}>Sin direcciones guardadas</Text>
            </View>
          ) : (
            addresses.map((a) => (
              <View key={a.id} style={m.itemCard}>
                <View style={m.itemIcon}>
                  <MaterialCommunityIcons name={a.icon as IconName} size={18} color={T.forest} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={m.itemLabel}>{a.label}</Text>
                  <Text style={m.itemValue} numberOfLines={1}>{a.address}</Text>
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
      <View style={{ flex: 1, backgroundColor: T.bg, paddingTop: insets.top }}>
        {/* Header */}
        <View style={m.header}>
          <TouchableOpacity onPress={onClose} hitSlop={10}>
            <MaterialCommunityIcons name="arrow-left" size={22} color={T.ink} />
          </TouchableOpacity>
          <Text style={m.headerTitle}>Mis personas</Text>
          {!adding
            ? <TouchableOpacity onPress={() => setAdding(true)} hitSlop={10}>
                <MaterialCommunityIcons name="plus" size={24} color={T.forest} />
              </TouchableOpacity>
            : <View style={{ width: 24 }} />
          }
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: insets.bottom + 32 }}>
          {/* Add form */}
          {adding && (
            <View style={m.formCard}>
              <Text style={m.formTitle}>NUEVA PERSONA</Text>
              <View style={m.inputWrap}>
                <Text style={m.inputLabel}>APODO (ej: MAMÁ, TRABAJO)</Text>
                <RNTextInput
                  style={m.input}
                  value={label}
                  onChangeText={setLabel}
                  placeholder="MAMÁ"
                  placeholderTextColor={T.inkFaint}
                  autoCapitalize="characters"
                  autoFocus
                />
              </View>
              <View style={m.inputWrap}>
                <Text style={m.inputLabel}>NOMBRE COMPLETO</Text>
                <RNTextInput
                  style={m.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="María García"
                  placeholderTextColor={T.inkFaint}
                />
              </View>
              <View style={m.inputWrap}>
                <Text style={m.inputLabel}>TELÉFONO</Text>
                <RNTextInput
                  style={m.input}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="11 4521-8830"
                  placeholderTextColor={T.inkFaint}
                  keyboardType="phone-pad"
                />
              </View>
              <View style={{ flexDirection: "row", gap: 8, marginTop: 4 }}>
                <TouchableOpacity style={[m.formBtn, m.formBtnSecondary, { flex: 1 }]} onPress={cancel} activeOpacity={0.8}>
                  <Text style={m.formBtnSecText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[m.formBtn, { flex: 1 }]} onPress={save} activeOpacity={0.8}>
                  <Text style={m.formBtnText}>Guardar</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* List */}
          {contacts.length === 0 && !adding ? (
            <View style={m.empty}>
              <MaterialCommunityIcons name="account-off-outline" size={48} color={T.border} />
              <Text style={m.emptyText}>Sin personas guardadas</Text>
            </View>
          ) : (
            contacts.map((c) => (
              <View key={c.id} style={m.itemCard}>
                <View style={[m.itemIcon, { backgroundColor: T.cardSoft }]}>
                  <MaterialCommunityIcons name="account-outline" size={18} color={T.forest} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={m.itemLabel}>{c.label} · <Text style={{ fontWeight: "400", color: T.ink }}>{c.name}</Text></Text>
                  {!!c.phone && <Text style={m.itemValue}>{c.phone}</Text>}
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
  const [notifOn, setNotifOn]           = useState(true);
  const [collabOn, setCollabOn]         = useState(true);

  const isCarrier = user?.user_type === UserType.CARRIER;

  const handleLogout = async () => { await logout(); };

  const firstName  = user?.first_name ?? "";
  const lastName   = user?.last_name  ?? "";
  const initials   = `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase() || "?";
  const fullName   = `${firstName} ${lastName}`.trim() || "Usuario";
  const email      = user?.email ?? "";
  const reputation = user?.rating ?? MOCK.reputation;

  return (
    <>
      <ScrollView
        style={p.container}
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Top bar */}
        <View style={[p.topBar, { paddingTop: insets.top + 6 }]}>
          <Text style={p.topTitle}>Mi cuenta</Text>
          <TouchableOpacity style={p.settingsBtn} activeOpacity={0.75} onPress={() => Alert.alert("Configuración", "Las opciones de configuración no están disponibles en esta versión.")}>
            <MaterialCommunityIcons name="cog-outline" size={18} color={T.ink} />
          </TouchableOpacity>
        </View>

        {/* ── Forest hero card ── */}
        <View style={p.heroCard}>
          <View style={p.topoLine1} />
          <View style={p.topoLine2} />
          <View style={{ flexDirection: "row", alignItems: "center", gap: 14, position: "relative" }}>
            <View style={{ position: "relative" }}>
              <View style={p.avatar}>
                <Text style={p.avatarText}>{initials}</Text>
              </View>
              <View style={p.editDot}>
                <MaterialCommunityIcons name="camera-outline" size={11} color={T.forest} />
              </View>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={p.heroName}>{fullName}</Text>
              <Text style={p.heroEmail}>{email}</Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6 }}>
                <View style={p.ecoBadge}>
                  <MaterialCommunityIcons name="leaf" size={10} color={T.lime} />
                  <Text style={p.ecoBadgeText}>ECO · NIVEL 2</Text>
                </View>
                <Text style={p.sinceText}>DESDE 2025</Text>
              </View>
            </View>
          </View>
          <View style={p.statsStrip}>
            <View style={[p.statCol, p.statBorder]}>
              <Text style={p.statNum}>{MOCK.shipments}</Text>
              <Text style={p.statLabel}>ENVÍOS</Text>
            </View>
            <View style={[p.statCol, p.statBorder]}>
              <Text style={[p.statNum, { color: T.lime }]}>{MOCK.co2}<Text style={p.statUnit}>kg</Text></Text>
              <Text style={p.statLabel}>CO₂ AHORRADO</Text>
            </View>
            <View style={p.statCol}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <Text style={p.statNum}>{reputation.toFixed(1)}</Text>
                <MaterialCommunityIcons name="star" size={14} color={T.lime} />
              </View>
              <Text style={p.statLabel}>REPUTACIÓN</Text>
            </View>
          </View>
        </View>

        {/* ── Eco progress card ── */}
        <View style={p.progressCard}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <View style={p.progressIcon}>
                <MaterialCommunityIcons name="leaf" size={12} color={T.forest} />
              </View>
              <Text style={p.progressLabel}>
                Próximo nivel: <Text style={{ color: T.emeraldDeep }}>Forestero</Text>
              </Text>
            </View>
            <Text style={p.progressCount}>8 / 15 envíos</Text>
          </View>
          <View style={p.progressTrack}>
            <View style={p.progressFill} />
          </View>
        </View>

        {/* ── Sections ── */}
        <ProfileSection title="CUENTA" rows={[
          <ProfileRow key="datos" icon="account-outline"    label="Datos personales"  value="Nombre, email, celular" onPress={() => Alert.alert("Datos personales", "La edición de tus datos no está disponible en esta versión.")} />,
          <ProfileRow key="dirs"  icon="map-marker-outline" label="Mis direcciones"   value={`${addresses.length} guardada${addresses.length !== 1 ? "s" : ""}`} onPress={() => setAddrModal(true)} />,
          <ProfileRow key="pers"  icon="account-multiple-outline" label="Mis personas" value={`${contacts.length} guardada${contacts.length !== 1 ? "s" : ""}`} onPress={() => setContactModal(true)} />,
          <ProfileRow key="pago"  icon="wallet-outline"     label="Métodos de pago"   value="Mercado Pago ··· 4821" onPress={() => Alert.alert("Métodos de pago", "Los métodos de pago no están disponibles en esta versión.")} />,
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
          <ProfileRow key="hist"  icon="history"      label="Historial de envíos"    value={`${MOCK.shipments} envíos · este año`} onPress={() => router.push("/(main)/envios")} />,
          <ProfileRow key="eco"   icon="leaf"         label="Mi impacto eco"         value="CO₂ ahorrado y equivalencias" accent onPress={() => router.push("/(main)/impacto")} />,
          <ProfileRow key="stars" icon="star-outline" label="Reseñas y calificación" value={`${reputation.toFixed(1)} · 11 reseñas`} onPress={() => Alert.alert("Reseñas", "Las reseñas y calificaciones no están disponibles en esta versión.")} />,
        ]} />

        <ProfileSection title="PREFERENCIAS" rows={[
          <ProfileRow key="notif" icon="bell-outline" label="Notificaciones"                  trailing={notifOn ? "toggle-on" : "toggle-off"} onPress={() => setNotifOn(v => !v)} />,
          <ProfileRow key="colab" icon="leaf"         label="Preferir envíos colaborativos"   trailing={collabOn ? "toggle-on" : "toggle-off"} onPress={() => setCollabOn(v => !v)} />,
          <ProfileRow key="lang"  icon="translate"    label="Idioma"                          trailing="ES-AR" onPress={() => Alert.alert("Idioma", "Solo disponible en español (AR) por ahora.")} />,
        ]} />

        <ProfileSection title="AYUDA Y LEGAL" rows={[
          <ProfileRow key="help"  icon="help-circle-outline"   label="Centro de ayuda" onPress={() => Alert.alert("Centro de ayuda", "Nuestro centro de ayuda estará disponible próximamente.")} />,
          <ProfileRow key="terms" icon="file-document-outline" label="Términos y privacidad" onPress={() => Alert.alert("Términos y privacidad", "Disponibles en depaso.app/legal próximamente.")} />,
        ]} />

        <TouchableOpacity style={p.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <MaterialCommunityIcons name="logout" size={16} color={T.red} />
          <Text style={p.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>

        <Text style={p.version}>DEPASO V1.0.0 · BUILD 4821</Text>
      </ScrollView>

      <AddressModal visible={addrModal}   onClose={() => setAddrModal(false)} />
      <ContactModal visible={contactModal} onClose={() => setContactModal(false)} />
      {routeModal && <PublishRouteScreen onClose={() => setRouteModal(false)} />}
    </>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const p = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 6 },
  topTitle: { fontSize: 22, fontWeight: "700", color: T.ink, letterSpacing: -0.6 },
  settingsBtn: { width: 38, height: 38, borderRadius: 12, borderWidth: 1, borderColor: T.border, backgroundColor: T.card, alignItems: "center", justifyContent: "center" },

  heroCard: { margin: 16, marginTop: 14, borderRadius: 24, backgroundColor: T.forest, padding: 20, paddingBottom: 18, overflow: "hidden" },
  topoLine1: { position: "absolute", bottom: 28, left: -20, right: -20, height: 20, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.05)", transform: [{ rotate: "-3deg" }] },
  topoLine2: { position: "absolute", bottom: 8,  left: -20, right: -20, height: 20, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.04)", transform: [{ rotate: "-3deg" }] },
  avatar: { width: 64, height: 64, borderRadius: 20, backgroundColor: T.lime, alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 4 },
  avatarText: { fontSize: 26, fontWeight: "800", color: T.forest, letterSpacing: -0.5 },
  editDot: { position: "absolute", bottom: -2, right: -2, width: 22, height: 22, borderRadius: 11, backgroundColor: "#F4EFE3", borderWidth: 2, borderColor: T.forest, alignItems: "center", justifyContent: "center" },
  heroName:  { fontSize: 22, fontWeight: "700", color: "#F4EFE3", letterSpacing: -0.6, lineHeight: 24 },
  heroEmail: { fontSize: 12.5, color: "rgba(244,239,227,0.7)", marginTop: 4 },
  ecoBadge: { flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: "rgba(163,230,53,0.15)", borderWidth: 1, borderColor: "rgba(163,230,53,0.3)", paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  ecoBadgeText: { fontSize: 9, letterSpacing: 1, color: T.lime, fontWeight: "700", textTransform: "uppercase" },
  sinceText: { fontSize: 9, letterSpacing: 1, color: "rgba(244,239,227,0.45)", textTransform: "uppercase" },
  statsStrip: { flexDirection: "row", marginTop: 22 },
  statCol:    { flex: 1 },
  statBorder: { borderRightWidth: 1, borderRightColor: "rgba(244,239,227,0.12)", paddingRight: 10, marginRight: 14 },
  statNum:    { fontSize: 22, fontWeight: "700", color: "#F4EFE3", letterSpacing: -0.5 },
  statUnit:   { fontSize: 12, fontWeight: "400", color: "#F4EFE3" },
  statLabel:  { fontSize: 9, letterSpacing: 1.5, color: "rgba(244,239,227,0.55)", textTransform: "uppercase", marginTop: 2 },

  progressCard:  { marginHorizontal: 16, marginTop: 12, backgroundColor: T.cardSoft, borderWidth: 1, borderColor: T.border, borderRadius: 16, padding: 14 },
  progressIcon:  { width: 22, height: 22, borderRadius: 6, backgroundColor: T.mint, alignItems: "center", justifyContent: "center" },
  progressLabel: { fontSize: 13, color: T.ink, fontWeight: "600" },
  progressCount: { fontSize: 10, letterSpacing: 1, color: T.inkMute, fontWeight: "700" },
  progressTrack: { height: 6, backgroundColor: T.border, borderRadius: 6, overflow: "hidden" },
  progressFill:  { width: "53%", height: "100%", backgroundColor: T.emerald, borderRadius: 6 },

  sectionTitle: { fontSize: 10, fontWeight: "700", letterSpacing: 2, color: T.inkMute, textTransform: "uppercase", marginHorizontal: 20, marginBottom: 8 },
  sectionCard:  { marginHorizontal: 16, backgroundColor: T.card, borderRadius: 18, borderWidth: 1, borderColor: T.border, overflow: "hidden" },
  divider:      { height: 1, backgroundColor: T.borderSoft, marginLeft: 66 },
  row:          { flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 16, paddingVertical: 14 },
  iconBox:      { width: 36, height: 36, borderRadius: 10, backgroundColor: T.cardSoft, borderWidth: 1, borderColor: T.borderSoft, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  iconBoxAccent: { backgroundColor: T.mint, borderColor: "transparent" },
  rowLabel:     { fontSize: 14, fontWeight: "500", color: T.ink },
  rowValue:     { fontSize: 11.5, color: T.inkMute, marginTop: 1 },
  trailingText: { fontSize: 10, letterSpacing: 1, color: T.inkMute, textTransform: "uppercase", fontWeight: "600" },

  logoutBtn:  { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginHorizontal: 16, marginTop: 24, paddingVertical: 14, borderRadius: 14, borderWidth: 1, borderColor: T.border },
  logoutText: { color: T.red, fontWeight: "600", fontSize: 14 },
  version:    { textAlign: "center", marginTop: 14, fontSize: 9, letterSpacing: 2, color: T.inkMute, textTransform: "uppercase" },
});

const m = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: T.borderSoft },
  headerTitle: { fontSize: 17, fontWeight: "700", color: T.ink, letterSpacing: -0.4 },

  formCard: { backgroundColor: T.card, borderRadius: 18, borderWidth: 1, borderColor: T.forest, padding: 16, gap: 12 },
  formTitle: { fontSize: 10, letterSpacing: 2, color: T.forest, fontWeight: "700", textTransform: "uppercase" },
  inputWrap: { gap: 4 },
  inputLabel: { fontSize: 9, letterSpacing: 1.5, color: T.inkMute, textTransform: "uppercase", fontWeight: "600" },
  input: { fontSize: 15, color: T.ink, borderBottomWidth: 1, borderColor: T.borderSoft, paddingVertical: 6, fontWeight: "500" },
  formBtn: { flexDirection: "row", justifyContent: "center", alignItems: "center", backgroundColor: T.forest, borderRadius: 12, paddingVertical: 13 },
  formBtnSecondary: { backgroundColor: T.cardSoft, borderWidth: 1, borderColor: T.border },
  formBtnText: { fontSize: 14, fontWeight: "700", color: "#F4EFE3" },
  formBtnSecText: { fontSize: 14, fontWeight: "600", color: T.inkSoft },

  itemCard: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: T.card, borderRadius: 14, borderWidth: 1, borderColor: T.border, padding: 14 },
  itemIcon: { width: 38, height: 38, borderRadius: 10, backgroundColor: T.mint, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  itemLabel: { fontSize: 13, fontWeight: "700", color: T.ink, letterSpacing: -0.2 },
  itemValue: { fontSize: 12, color: T.inkMute, marginTop: 2 },

  empty: { alignItems: "center", gap: 12, paddingVertical: 48 },
  emptyText: { fontSize: 14, color: T.inkMute, fontWeight: "500" },
});
