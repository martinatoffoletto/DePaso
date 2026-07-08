import { useCallback, useRef, useState } from "react";
import { View, TouchableOpacity, TextInput, ActivityIndicator, Keyboard, Text } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { T } from "@/constants/tokens";
import { searchAddresses, formatAddress, Suggestion } from "@/src/utils/addressSearch";

export type SelectedAddress = { label: string; lat: number; lon: number };

type Props = {
  /** Small uppercase label above the field. */
  label: string;
  placeholder: string;
  /** Visual marker: origin = ring, destination = diamond. */
  kind?: "origin" | "destination";
  value: string;
  /** Fires on typing — coords become stale, parent should clear them. */
  onChangeText: (text: string) => void;
  /** Fires when the user picks a suggestion (coords resolved). */
  onSelect: (selected: SelectedAddress) => void;
};

/**
 * Address input with Photon autocomplete — the same standard the shipper
 * flow uses, shared so every address in the app behaves identically.
 */
export function AddressField({ label, placeholder, kind = "origin", value, onChangeText, onSelect }: Props) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const [noResults, setNoResults] = useState(false);
  const [focused, setFocused] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleChange = useCallback((text: string) => {
    onChangeText(text);
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
  }, [onChangeText]);

  function handlePick(s: Suggestion) {
    const { label: line, sublabel } = formatAddress(s);
    const name = sublabel ? `${line}, ${sublabel}` : line;
    Keyboard.dismiss();
    setSuggestions([]);
    setNoResults(false);
    onSelect({ label: name, lat: parseFloat(s.lat), lon: parseFloat(s.lon) });
  }

  const showDropdown = focused && (searching || suggestions.length > 0 || noResults);

  return (
    <View>
      <Text className="text-[9.5px] tracking-[1.5px] text-inkMute uppercase font-bold mb-2">{label}</Text>
      <View className={`bg-card rounded-[14px] overflow-hidden border-[1.2px] ${focused ? "border-forest" : "border-border"}`}>
        <View className="flex-row items-center gap-[10px] px-[14px] h-[52px]">
          {kind === "origin" ? (
            <View className="w-[10px] h-[10px] rounded-full border-2 border-forest" />
          ) : (
            <View className="w-[10px] h-[10px] rounded-[3px] bg-emerald rotate-45" />
          )}
          <TextInput
            className="flex-1 text-[15px] text-ink font-medium"
            placeholder={placeholder}
            placeholderTextColor={T.inkFaint}
            value={value}
            onChangeText={handleChange}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
          />
          {searching && <ActivityIndicator size={14} color={T.forest} />}
        </View>
        {showDropdown && (
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
            ) : suggestions.map((s, i) => {
              const { label: line, sublabel } = formatAddress(s);
              return (
                <TouchableOpacity
                  key={s.place_id}
                  className={`flex-row items-center px-[14px] py-3 gap-3 ${i > 0 ? "border-t border-borderSoft" : ""}`}
                  onPress={() => handlePick(s)}
                  activeOpacity={0.7}
                >
                  <View className="w-[30px] h-[30px] rounded-[10px] bg-mint items-center justify-center">
                    <MaterialCommunityIcons name="map-marker-outline" size={16} color={T.forest} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-[13.5px] font-semibold text-ink" numberOfLines={1}>{line}</Text>
                    {!!sublabel && <Text className="text-[11px] text-inkMute mt-px" numberOfLines={1}>{sublabel}</Text>}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>
    </View>
  );
}
