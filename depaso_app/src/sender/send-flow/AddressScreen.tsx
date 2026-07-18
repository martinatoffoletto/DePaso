import { useCallback, useRef, useState } from "react";
import {
  View, TouchableOpacity, ScrollView,
  TextInput as RNTextInput, ActivityIndicator, Keyboard, Text,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Location from "expo-location";
import { T } from "@/constants/tokens";
import { StepDots } from "@/src/sender/components/StepDots";
import { reverseGeocode } from "@/src/shared/utils/geocoding";
import { searchAddresses, formatAddress, Suggestion } from "@/src/shared/utils/addressSearch";
import { useAuthStore } from "@/src/shared/session/authStore";
import { useAddressBookStore } from "@/src/shared/profile/addressBookStore";
import { PickupScheduleCard } from "@/src/sender/components/PickupScheduleCard";
import { SavedAddressesModal } from "@/src/sender/components/SavedAddressesModal";
import { PickupSchedule, PICKUP_ASAP, pickupScheduleValid } from "@/src/sender/pickupSchedule";
import type { Coords } from "./FlowNavigator";

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>["name"];

// Geocoding compartido (Photon / Komoot — OSM): src/shared/utils/addressSearch.ts


export type AddressPayload = {
  origin: string;
  destination: string;
  originCoords: Coords | null;
  destinationCoords: Coords | null;
  recipientName: string;
  recipientPhone: string;
  schedule: PickupSchedule;
};

type Props = {
  initial?: Partial<AddressPayload>;
  onBack: () => void;
  onNext: (payload: AddressPayload) => void;
};


export function AddressScreen({ initial, onBack, onNext }: Props) {
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const { addresses: savedAddrs, contacts: savedContacts } = useAddressBookStore();

  const [origin, setOrigin]               = useState(initial?.origin ?? "");
  const [destination, setDestination]     = useState(initial?.destination ?? "");
  const [originCoords, setOriginCoords]   = useState<Coords | null>(initial?.originCoords ?? null);
  const [destCoords, setDestCoords]       = useState<Coords | null>(initial?.destinationCoords ?? null);
  const [recipientName, setRecipientName] = useState(initial?.recipientName ?? "");
  const [recipientPhone, setRecipientPhone] = useState(initial?.recipientPhone ?? "");
  const [schedule, setSchedule]           = useState<PickupSchedule>(initial?.schedule ?? PICKUP_ASAP);

  const [activeField, setActiveField]   = useState<"origin" | "destination" | null>(null);
  const [suggestions, setSuggestions]   = useState<Suggestion[]>([]);
  const [searching, setSearching]       = useState(false);
  const [noResults, setNoResults]       = useState(false);
  const [locLoading, setLocLoading]     = useState(false);
  const [addrBookOpen, setAddrBookOpen] = useState(false);

  const debounceRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const origInputRef  = useRef<RNTextInput>(null);
  const destInputRef  = useRef<RNTextInput>(null);

  const addressesOk = origin.trim().length > 3 && destination.trim().length > 3;
  const canContinue = addressesOk && pickupScheduleValid(schedule);

  // ── Autocomplete ────────────────────────────────────────────────────────────
  const handleTextChange = useCallback((text: string, field: "origin" | "destination") => {
    if (field === "origin") { setOrigin(text); setOriginCoords(null); }
    else                    { setDestination(text); setDestCoords(null); }
    setSuggestions([]);
    setNoResults(false);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (text.length < 3) return;
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await searchAddresses(text);
        setSuggestions(results);
        setNoResults(results.length === 0);
      } catch {
        setNoResults(true);
      } finally {
        setSearching(false);
      }
    }, 450);
  }, []);

  const handleSelectSuggestion = useCallback((s: Suggestion) => {
    const coords: Coords = { latitude: parseFloat(s.lat), longitude: parseFloat(s.lon) };
    const { label, sublabel } = formatAddress(s);
    const name = sublabel ? `${label}, ${sublabel}` : label;
    Keyboard.dismiss();
    setSuggestions([]);
    setNoResults(false);
    if (activeField === "origin") {
      setOrigin(name);
      setOriginCoords(coords);
      setActiveField("destination");
      setTimeout(() => destInputRef.current?.focus(), 150);
    } else {
      setDestination(name);
      setDestCoords(coords);
      setActiveField(null);
    }
  }, [activeField]);

  // ── GPS ─────────────────────────────────────────────────────────────────────
  async function handleUseLocation() {
    setLocLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;

      let loc = await Location.getLastKnownPositionAsync();
      if (!loc) {
        const gpsPromise = Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("gps_timeout")), 8000)
        );
        loc = await Promise.race([gpsPromise, timeoutPromise]);
      }

      const addr = await reverseGeocode(loc.coords.latitude, loc.coords.longitude);
      setOrigin(addr);
      setOriginCoords({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
      setSuggestions([]);
      setActiveField("destination");
      setTimeout(() => destInputRef.current?.focus(), 150);
    } catch { /* sin GPS o timeout */ }
    finally { setLocLoading(false); }
  }

  function handleSwap() {
    const [a, ac, b, bc] = [origin, originCoords, destination, destCoords];
    setOrigin(b); setOriginCoords(bc);
    setDestination(a); setDestCoords(ac);
    setSuggestions([]);
    setNoResults(false);
  }

  async function handleSavedAddrPress(addr: string) {
    Keyboard.dismiss();
    setSuggestions([]);
    setNoResults(false);
    const field = activeField === "origin" ? "origin" : "destination";
    if (field === "origin") {
      setOrigin(addr);
      setOriginCoords(null);
    } else {
      setDestination(addr);
      setDestCoords(null);
    }
    // Resolve coordinates through the same geocoding library as the
    // autocomplete — a saved address must behave exactly like a picked one.
    setSearching(true);
    try {
      const results = await searchAddresses(addr);
      const first = results[0];
      if (first) {
        const coords: Coords = { latitude: parseFloat(first.lat), longitude: parseFloat(first.lon) };
        if (field === "origin") {
          setOriginCoords(coords);
          setActiveField("destination");
          setTimeout(() => destInputRef.current?.focus(), 150);
        } else {
          setDestCoords(coords);
          setActiveField(null);
        }
      }
    } catch { /* queda sin coords y el flujo lo resuelve después */ }
    finally { setSearching(false); }
  }

  function handleFillMe() {
    if (!user) return;
    setRecipientName(`${user.first_name} ${user.last_name}`);
    setRecipientPhone(user.phone_number ?? "");
  }

  const [resolving, setResolving] = useState(false);

  // Continue always leaves with resolved coordinates: anything typed by hand
  // (or a saved address that failed earlier) goes through the geocoder here.
  async function handleContinue() {
    if (!canContinue || resolving) return;
    setResolving(true);
    try {
      let oc = originCoords;
      let dc = destCoords;
      if (!oc) {
        const r = await searchAddresses(origin);
        if (r[0]) oc = { latitude: parseFloat(r[0].lat), longitude: parseFloat(r[0].lon) };
      }
      if (!dc) {
        const r = await searchAddresses(destination);
        if (r[0]) dc = { latitude: parseFloat(r[0].lat), longitude: parseFloat(r[0].lon) };
      }
      onNext({ origin, destination, originCoords: oc, destinationCoords: dc, recipientName, recipientPhone, schedule });
    } finally {
      setResolving(false);
    }
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
          <MaterialCommunityIcons name="map-marker-path" size={16} color={T.ink} />
        </View>
      </View>

      <View className="px-5 pt-1 pb-[14px]">
        <Text className="text-[10px] tracking-[2.5px] text-emeraldDeep uppercase mb-1">DIRECCIONES</Text>
        <Text className="text-[26px] font-bold text-ink tracking-[-0.8px] leading-[30px]">
          ¿Desde dónde{"\n"}y hasta dónde?
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 14, paddingBottom: insets.bottom + 100 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Origin + Destination block */}
        <View>
          {/* Origin card */}
          <View className={`bg-card rounded-2xl overflow-hidden border ${activeField === "origin" ? "border-forest" : "border-border"}`}>
            <TouchableOpacity
              className="flex-row items-center gap-3 p-[14px]"
              onPress={() => { setActiveField("origin"); origInputRef.current?.focus(); }}
              activeOpacity={0.85}
            >
              <View className="w-5 items-center">
                <View className="w-[14px] h-[14px] rounded-full bg-card" style={{ borderWidth: 2.5, borderColor: T.forest }} />
              </View>
              <View className="flex-1">
                <Text className="text-[9px] tracking-[1.5px] text-inkMute uppercase mb-1">ORIGEN · RETIRO</Text>
                <RNTextInput
                  ref={origInputRef}
                  className="text-sm text-ink font-medium p-0"
                  value={origin}
                  onChangeText={(t) => handleTextChange(t, "origin")}
                  onFocus={() => setActiveField("origin")}
                  placeholder="Av. Corrientes 1234, CABA"
                  placeholderTextColor={T.inkFaint}
                  returnKeyType="next"
                  onSubmitEditing={() => { setActiveField("destination"); destInputRef.current?.focus(); }}
                />
              </View>
              <TouchableOpacity
                className="w-[30px] h-[30px] rounded-[10px] items-center justify-center"
                onPress={handleUseLocation}
                hitSlop={8}
                disabled={locLoading}
              >
                {locLoading
                  ? <ActivityIndicator size={14} color={T.forest} />
                  : <MaterialCommunityIcons name="crosshairs-gps" size={18} color={originCoords ? T.forest : T.inkMute} />
                }
              </TouchableOpacity>
            </TouchableOpacity>
            {activeField === "origin" && (searching || suggestions.length > 0 || noResults) && (
              <View className="border-t border-borderSoft">
                {searching ? (
                  <View className="flex-row items-center px-[14px] py-3 gap-3">
                    <ActivityIndicator size={14} color={T.forest} />
                    <Text className="text-[13px] text-inkMute">Buscando...</Text>
                  </View>
                ) : noResults ? (
                  <View className="flex-row items-center px-[14px] py-3 gap-3">
                    <MaterialCommunityIcons name="map-search-outline" size={16} color={T.inkMute} />
                    <Text className="text-[13px] text-inkMute">Sin resultados · Verificá la dirección</Text>
                  </View>
                ) : suggestions.map((s2, i) => {
                  const { label, sublabel } = formatAddress(s2);
                  return (
                    <TouchableOpacity
                      key={s2.place_id}
                      className={`flex-row items-center px-[14px] py-3 gap-3 ${i > 0 ? "border-t border-borderSoft" : ""}`}
                      onPress={() => handleSelectSuggestion(s2)}
                      activeOpacity={0.7}
                    >
                      <View className="w-[30px] h-[30px] rounded-[10px] bg-mint items-center justify-center">
                        <MaterialCommunityIcons name="map-marker-outline" size={16} color={T.forest} />
                      </View>
                      <View className="flex-1">
                        <Text className="text-[13.5px] font-semibold text-ink" numberOfLines={1}>{label}</Text>
                        {!!sublabel && <Text className="text-[11px] text-inkMute mt-px" numberOfLines={1}>{sublabel}</Text>}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>

          {/* Swap */}
          <View className="flex-row items-center py-1 px-2">
            <View className="flex-1 h-px bg-borderSoft" />
            <TouchableOpacity
              className="w-8 h-8 rounded-full bg-card border border-border items-center justify-center mx-2"
              onPress={handleSwap}
              hitSlop={8}
            >
              <MaterialCommunityIcons name="swap-vertical" size={16} color={T.inkSoft} />
            </TouchableOpacity>
            <View className="flex-1 h-px bg-borderSoft" />
          </View>

          {/* Destination card */}
          <View className={`bg-card rounded-2xl overflow-hidden border ${activeField === "destination" ? "border-forest" : "border-border"}`}>
            <TouchableOpacity
              className="flex-row items-center gap-3 p-[14px]"
              onPress={() => { setActiveField("destination"); destInputRef.current?.focus(); }}
              activeOpacity={0.85}
            >
              <View className="w-5 items-center">
                <View className="w-3 h-3 rounded-sm bg-emerald rotate-45" />
              </View>
              <View className="flex-1">
                <Text className="text-[9px] tracking-[1.5px] text-inkMute uppercase mb-1">DESTINO · ENTREGA</Text>
                <RNTextInput
                  ref={destInputRef}
                  className="text-sm text-ink font-medium p-0"
                  value={destination}
                  onChangeText={(t) => handleTextChange(t, "destination")}
                  onFocus={() => setActiveField("destination")}
                  placeholder="Olleros 2820, Belgrano"
                  placeholderTextColor={T.inkFaint}
                  returnKeyType="done"
                  onSubmitEditing={() => { setSuggestions([]); setActiveField(null); Keyboard.dismiss(); }}
                />
              </View>
              {destCoords
                ? <MaterialCommunityIcons name="check-circle-outline" size={18} color={T.forest} />
                : <MaterialCommunityIcons name="chevron-right" size={18} color={T.inkMute} />
              }
            </TouchableOpacity>
            {activeField === "destination" && (searching || suggestions.length > 0 || noResults) && (
              <View className="border-t border-borderSoft">
                {searching ? (
                  <View className="flex-row items-center px-[14px] py-3 gap-3">
                    <ActivityIndicator size={14} color={T.forest} />
                    <Text className="text-[13px] text-inkMute">Buscando...</Text>
                  </View>
                ) : noResults ? (
                  <View className="flex-row items-center px-[14px] py-3 gap-3">
                    <MaterialCommunityIcons name="map-search-outline" size={16} color={T.inkMute} />
                    <Text className="text-[13px] text-inkMute">Sin resultados · Verificá la dirección</Text>
                  </View>
                ) : suggestions.map((s2, i) => {
                  const { label, sublabel } = formatAddress(s2);
                  return (
                    <TouchableOpacity
                      key={s2.place_id}
                      className={`flex-row items-center px-[14px] py-3 gap-3 ${i > 0 ? "border-t border-borderSoft" : ""}`}
                      onPress={() => handleSelectSuggestion(s2)}
                      activeOpacity={0.7}
                    >
                      <View className="w-[30px] h-[30px] rounded-[10px] bg-mint items-center justify-center">
                        <MaterialCommunityIcons name="map-marker-outline" size={16} color={T.forest} />
                      </View>
                      <View className="flex-1">
                        <Text className="text-[13.5px] font-semibold text-ink" numberOfLines={1}>{label}</Text>
                        {!!sublabel && <Text className="text-[11px] text-inkMute mt-px" numberOfLines={1}>{sublabel}</Text>}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        </View>

        {/* Saved addresses */}
        <View>
          <View className="flex-row items-center justify-between mb-[10px]">
            <Text className="text-sm font-semibold text-ink tracking-[-0.2px]">Direcciones guardadas</Text>
            <TouchableOpacity onPress={() => setAddrBookOpen(true)} hitSlop={8} activeOpacity={0.7}>
              <Text className="text-[9px] tracking-[1.5px] text-emeraldDeep uppercase">VER TODAS</Text>
            </TouchableOpacity>
          </View>
          {savedAddrs.length === 0 && (
            <Text className="text-xs text-inkMute">
              Todavía no guardaste direcciones. Podés agregarlas desde tu perfil.
            </Text>
          )}
          <View className="flex-row gap-2">
            {savedAddrs.slice(0, 3).map((sv) => (
              <TouchableOpacity
                key={sv.id}
                className="flex-1 bg-card rounded-[14px] border border-border p-[10px]"
                onPress={() => handleSavedAddrPress(sv.address)}
                activeOpacity={0.75}
              >
                <View className="flex-row items-center justify-between mb-2">
                  <MaterialCommunityIcons name={sv.icon as IconName} size={16} color={T.inkSoft} />
                </View>
                <Text className="text-[8.5px] tracking-[1.2px] text-inkMute uppercase">{sv.label}</Text>
                <Text className="text-xs text-ink font-medium mt-px" numberOfLines={1}>{sv.address}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recipient card */}
        <View className="bg-card rounded-2xl border border-border p-[14px] gap-3">
          <View className="flex-row items-center gap-[10px]">
            <View className="w-8 h-8 rounded-[10px] bg-cardSoft border border-borderSoft items-center justify-center shrink-0">
              <MaterialCommunityIcons name="account-outline" size={18} color={T.forest} />
            </View>
            <Text className="text-[9px] tracking-[1.5px] text-inkMute uppercase">QUIEN RECIBE</Text>
          </View>

          <View className="flex-row gap-[6px] flex-wrap">
            <TouchableOpacity
              className="flex-row items-center gap-[5px] bg-cardSoft border border-borderSoft rounded-full px-[10px] py-[6px]"
              onPress={handleFillMe}
              activeOpacity={0.78}
            >
              <MaterialCommunityIcons name="account-circle-outline" size={13} color={T.forest} />
              <Text className="text-xs font-semibold text-ink">Yo mismo</Text>
            </TouchableOpacity>
            {savedContacts.map((c) => (
              <TouchableOpacity
                key={c.id}
                className="flex-row items-center gap-[5px] bg-cardSoft border border-borderSoft rounded-full px-[10px] py-[6px]"
                onPress={() => { setRecipientName(c.name); setRecipientPhone(c.phone); }}
                activeOpacity={0.78}
              >
                <Text className="text-xs font-semibold text-ink">{c.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View className="gap-[10px]">
            <RNTextInput
              className="text-sm text-ink font-medium p-0 border-b border-borderSoft pb-1"
              value={recipientName}
              onChangeText={setRecipientName}
              placeholder="Nombre y apellido"
              placeholderTextColor={T.inkFaint}
            />
            <View className="flex-row items-center gap-2">
              <View className="bg-cardSoft rounded-lg px-2 py-[5px]">
                <Text className="text-xs text-ink font-medium">🇦🇷 +54</Text>
              </View>
              <RNTextInput
                className="flex-1 text-sm text-ink font-medium p-0 border-b border-borderSoft pb-1"
                value={recipientPhone}
                onChangeText={setRecipientPhone}
                placeholder="11 4521-8830"
                placeholderTextColor={T.inkFaint}
                keyboardType="phone-pad"
              />
            </View>
          </View>
        </View>

        {/* Schedule */}
        <PickupScheduleCard value={schedule} onChange={setSchedule} />
      </ScrollView>

      <SavedAddressesModal
        visible={addrBookOpen}
        addresses={savedAddrs}
        targetLabel={activeField === "origin" ? "origen" : "destino"}
        onSelect={(a) => { setAddrBookOpen(false); handleSavedAddrPress(a.address); }}
        onClose={() => setAddrBookOpen(false)}
      />

      {/* Sticky CTA */}
      <View className="absolute bottom-0 left-0 right-0 px-4 pt-6" style={{ paddingBottom: insets.bottom + 16 }}>
        <TouchableOpacity
          className={`rounded-2xl h-[54px] flex-row items-center justify-center gap-[10px] ${!canContinue ? "bg-inkMute" : ""}`}
          style={canContinue ? { backgroundColor: T.forest, shadowColor: T.forest, shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.4, shadowRadius: 20, elevation: 5 } : undefined}
          onPress={handleContinue}
          activeOpacity={0.88}
          disabled={!canContinue || resolving}
        >
          {resolving ? (
            <ActivityIndicator color="#F4EFE3" />
          ) : (
            <>
              <Text className="text-[#F4EFE3] font-semibold text-[15px]">
                {canContinue ? "Continuar · Ver ruta" : addressesOk ? "Elegí el horario de retiro" : "Ingresá las direcciones"}
              </Text>
              {canContinue && <MaterialCommunityIcons name="arrow-right" size={18} color="#F4EFE3" />}
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
