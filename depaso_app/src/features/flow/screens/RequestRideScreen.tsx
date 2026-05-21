import { useEffect, useRef, useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Keyboard,
  TextInput as RNTextInput,
} from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { Coords } from "../FlowNavigator";

const AMBA_VIEWBOX = "-59.2,-34.95,-57.8,-34.2";
const AMBA_DEFAULT = { latitude: -34.6037, longitude: -58.3816, latitudeDelta: 0.12, longitudeDelta: 0.12 };

type Place = { id: string; label: string; sublabel: string; lat: number; lon: number };

const SAVED_PLACES: (Place & { icon: string })[] = [
  { id: "home", icon: "home-outline",     label: "Casa",    sublabel: "Lavalle 4050, CABA",     lat: -34.5949, lon: -58.4335 },
  { id: "work", icon: "briefcase-outline", label: "Trabajo", sublabel: "Lima 757, San Nicolás",  lat: -34.6156, lon: -58.3682 },
];

const RECENT_PLACES: Place[] = [
  { id: "r1", label: "Palermo Soho",    sublabel: "Thames 1500, Palermo (C1414)",        lat: -34.5872, lon: -58.4339 },
  { id: "r2", label: "Recoleta",        sublabel: "Av. Santa Fe 1800, Recoleta (C1123)", lat: -34.5875, lon: -58.3930 },
  { id: "r3", label: "San Telmo",       sublabel: "Defensa 900, San Telmo (C1065)",      lat: -34.6211, lon: -58.3732 },
  { id: "r4", label: "Belgrano Centro", sublabel: "Cabildo 1500, Belgrano (C1426)",      lat: -34.5627, lon: -58.4530 },
];

type NominatimAddress = {
  road?: string; house_number?: string;
  neighbourhood?: string; suburb?: string; city_district?: string;
  city?: string; town?: string; postcode?: string;
};
type Suggestion = {
  place_id: number; display_name: string;
  lat: string; lon: string; address?: NominatimAddress;
};

async function searchNominatim(query: string): Promise<Suggestion[]> {
  if (query.length < 3) return [];
  const params = new URLSearchParams({
    q: `${query}, Buenos Aires, Argentina`,
    format: "json", limit: "5", countrycodes: "ar",
    viewbox: AMBA_VIEWBOX, bounded: "1", addressdetails: "1",
  });
  const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
    headers: { "User-Agent": "DePaso-App/1.0" },
  });
  return res.json();
}

function formatAddress(s: Suggestion): { label: string; sublabel: string } {
  const a = s.address;
  if (!a) {
    const parts = s.display_name.split(",").map(p => p.trim());
    return { label: parts[0] ?? "", sublabel: parts.slice(1, 3).join(", ") };
  }
  const street = [a.road, a.house_number].filter(Boolean).join(" ");
  const neighborhood = a.neighbourhood ?? a.suburb ?? a.city_district ?? "";
  const postcode = a.postcode ? `(${a.postcode})` : "";
  const label = street || a.city || a.town || "Buenos Aires";
  const sublabel = [neighborhood, postcode].filter(Boolean).join(" ");
  return { label, sublabel };
}

type RequestRideScreenProps = {
  initialOrigin?: string;
  initialDestination?: string;
  initialOriginCoords?: Coords | null;
  initialDestinationCoords?: Coords | null;
  onNext: (payload: {
    origin: string; destination: string;
    originCoords: Coords; destinationCoords: Coords;
  }) => void;
};

export function RequestRideScreen({
  initialOrigin,
  initialDestination,
  initialOriginCoords,
  initialDestinationCoords,
  onNext,
}: RequestRideScreenProps) {
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);

  // If returning with both coords already set, show map (verification). Otherwise start in search.
  const [view, setView] = useState<"search" | "map">(
    initialOriginCoords && initialDestinationCoords ? "map" : "search"
  );

  const [originText, setOriginText] = useState(initialOrigin || "Mi ubicación actual");
  const [destinationText, setDestinationText] = useState(initialDestination || "");
  const [originCoords, setOriginCoords] = useState<Coords | null>(initialOriginCoords ?? null);
  const [destinationCoords, setDestinationCoords] = useState<Coords | null>(initialDestinationCoords ?? null);

  const [activeField, setActiveField] = useState<"origin" | "destination">("destination");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const destInputRef = useRef<RNTextInput>(null);
  const origInputRef = useRef<RNTextInput>(null);

  const canProceed = !!originCoords && !!destinationCoords;

  // GPS — only if no saved origin coords
  useEffect(() => {
    if (initialOriginCoords) return;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setOriginCoords({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
    })();
  }, []);

  // Fit map to both markers when map view opens
  useEffect(() => {
    if (view === "map" && originCoords && destinationCoords && mapRef.current) {
      mapRef.current.fitToCoordinates([originCoords, destinationCoords], {
        edgePadding: { top: 120, right: 40, bottom: 240, left: 40 },
        animated: true,
      });
    }
  }, [view]);

  const handleTextChange = useCallback((text: string) => {
    if (activeField === "origin") setOriginText(text);
    else setDestinationText(text);
    setSuggestions([]);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (text.length < 3) return;
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try { setSuggestions(await searchNominatim(text)); }
      catch { /* sin red */ }
      finally { setSearching(false); }
    }, 450);
  }, [activeField]);

  const applySelection = useCallback((coords: Coords, name: string) => {
    Keyboard.dismiss();
    setSuggestions([]);
    if (activeField === "origin") {
      setOriginText(name);
      setOriginCoords(coords);
      if (!destinationCoords) {
        setActiveField("destination");
        setTimeout(() => destInputRef.current?.focus(), 150);
      }
    } else {
      setDestinationText(name);
      setDestinationCoords(coords);
      if (!originCoords) {
        setActiveField("origin");
        setTimeout(() => origInputRef.current?.focus(), 150);
      }
    }
  }, [activeField, originCoords, destinationCoords]);

  const handleSelectSuggestion = useCallback((s: Suggestion) => {
    const coords = { latitude: parseFloat(s.lat), longitude: parseFloat(s.lon) };
    const { label, sublabel } = formatAddress(s);
    applySelection(coords, sublabel ? `${label}, ${sublabel}` : label);
  }, [applySelection]);

  const handleSelectPlace = useCallback((place: Place) => {
    applySelection({ latitude: place.lat, longitude: place.lon }, place.label);
  }, [applySelection]);

  // ── MAP VIEW (verification) ───────────────────────────────────────────────
  if (view === "map") {
    const mapRegion = originCoords && destinationCoords ? {
      latitude:  (originCoords.latitude  + destinationCoords.latitude)  / 2,
      longitude: (originCoords.longitude + destinationCoords.longitude) / 2,
      latitudeDelta:  Math.abs(originCoords.latitude  - destinationCoords.latitude)  * 2.5 + 0.04,
      longitudeDelta: Math.abs(originCoords.longitude - destinationCoords.longitude) * 2.5 + 0.04,
    } : AMBA_DEFAULT;

    return (
      <View style={styles.container}>
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFillObject}
          region={mapRegion}
          showsUserLocation
          showsMyLocationButton={false}
        >
          {originCoords && <Marker coordinate={originCoords} pinColor="#16A34A" title="Origen" />}
          {destinationCoords && <Marker coordinate={destinationCoords} pinColor="#EF4444" title="Destino" />}
          {originCoords && destinationCoords && (
            <Polyline
              coordinates={[originCoords, destinationCoords]}
              strokeColor="#16A34A"
              strokeWidth={3}
              lineDashPattern={[8, 5]}
            />
          )}
        </MapView>

        {/* Header */}
        <View style={[styles.mapHeader, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity onPress={() => setView("search")} style={styles.mapBackBtn} hitSlop={12}>
            <MaterialCommunityIcons name="chevron-left" size={26} color="#0F172A" />
          </TouchableOpacity>
          <View style={styles.mapHeaderPill}>
            <MaterialCommunityIcons name="map-marker-check-outline" size={15} color="#16A34A" />
            <Text variant="titleSmall" style={styles.mapHeaderTitle}>Verificar ruta</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        {/* Bottom confirmation card */}
        <View style={[styles.mapBottomCard, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.routeSummary}>
            <View style={styles.routeDotsCol}>
              <View style={[styles.routeDot, { backgroundColor: "#16A34A" }]} />
              <View style={styles.routeDotLine} />
              <View style={[styles.routeDot, { backgroundColor: "#EF4444", borderRadius: 3 }]} />
            </View>
            <View style={styles.routeTexts}>
              <Text variant="bodyMedium" style={styles.routeAddrText} numberOfLines={1}>{originText}</Text>
              <View style={{ height: 10 }} />
              <Text variant="bodyMedium" style={styles.routeAddrText} numberOfLines={1}>{destinationText}</Text>
            </View>
            <TouchableOpacity onPress={() => setView("search")} hitSlop={10} style={styles.editBtn}>
              <MaterialCommunityIcons name="pencil-outline" size={18} color="#64748B" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.ctaButton}
            onPress={() => onNext({
              origin: originText,
              destination: destinationText,
              originCoords: originCoords!,
              destinationCoords: destinationCoords!,
            })}
            activeOpacity={0.85}
          >
            <Text style={styles.ctaText}>Ver opciones de envío</Text>
            <MaterialCommunityIcons name="arrow-right" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── SEARCH VIEW (default) ─────────────────────────────────────────────────
  const showRecents = suggestions.length === 0 && !searching;

  return (
    <View style={styles.searchScreen}>
      {/* Header */}
      <View style={[styles.searchHeader, { paddingTop: insets.top + 6 }]}>
        <Text variant="titleMedium" style={styles.searchHeaderTitle}>¿A dónde enviás?</Text>
      </View>

      {/* Origin + Destination inputs */}
      <View style={styles.searchInputsCard}>
        {/* Origin */}
        <TouchableOpacity
          style={styles.searchInputRow}
          onPress={() => { setActiveField("origin"); origInputRef.current?.focus(); }}
          activeOpacity={0.7}
        >
          <View style={[styles.searchDot, { backgroundColor: "#16A34A" }]} />
          {activeField === "origin" ? (
            <RNTextInput
              ref={origInputRef}
              style={styles.searchRawInput}
              value={originText}
              onChangeText={handleTextChange}
              placeholder="Origen"
              placeholderTextColor="#CBD5E1"
              autoFocus
            />
          ) : (
            <Text style={[styles.searchInputText, !originText && styles.searchPlaceholder]} numberOfLines={1}>
              {originText || "Origen"}
            </Text>
          )}
          {originCoords && activeField !== "origin" && (
            <MaterialCommunityIcons name="check-circle" size={16} color="#16A34A" />
          )}
        </TouchableOpacity>

        <View style={styles.searchInputDivider} />

        {/* Destination */}
        <TouchableOpacity
          style={styles.searchInputRow}
          onPress={() => { setActiveField("destination"); destInputRef.current?.focus(); }}
          activeOpacity={0.7}
        >
          <View style={[styles.searchDot, { backgroundColor: "#EF4444", borderRadius: 3 }]} />
          {activeField === "destination" ? (
            <RNTextInput
              ref={destInputRef}
              style={styles.searchRawInput}
              value={destinationText}
              onChangeText={handleTextChange}
              placeholder="¿A dónde va el paquete?"
              placeholderTextColor="#CBD5E1"
              autoFocus
            />
          ) : (
            <Text style={[styles.searchInputText, !destinationText && styles.searchPlaceholder]} numberOfLines={1}>
              {destinationText || "¿A dónde va el paquete?"}
            </Text>
          )}
          {destinationCoords && activeField !== "destination" && (
            <MaterialCommunityIcons name="check-circle" size={16} color="#16A34A" />
          )}
        </TouchableOpacity>
      </View>

      {/* Saved place chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipsScroll}
        contentContainerStyle={styles.chipsContent}
      >
        {SAVED_PLACES.map(p => (
          <TouchableOpacity key={p.id} style={styles.chip} onPress={() => handleSelectPlace(p)} activeOpacity={0.75}>
            <MaterialCommunityIcons name={p.icon as any} size={12} color="#64748B" />
            <Text style={styles.chipText}>{p.label}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={styles.chip} activeOpacity={0.75}>
          <MaterialCommunityIcons name="star-outline" size={12} color="#64748B" />
          <Text style={styles.chipText}>Favoritos</Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.searchDivider} />

      {/* Results list */}
      <FlatList
        style={{ flex: 1 }}
        keyboardShouldPersistTaps="handled"
        data={
          showRecents
            ? RECENT_PLACES.map(p => ({ type: "recent" as const, place: p }))
            : suggestions.map(s => ({ type: "suggestion" as const, s }))
        }
        keyExtractor={(_, i) => String(i)}
        ListHeaderComponent={
          searching ? (
            <View style={styles.searchingRow}>
              <ActivityIndicator size="small" color="#16A34A" />
              <Text variant="bodySmall" style={{ color: "#64748B" }}>Buscando...</Text>
            </View>
          ) : showRecents ? (
            <Text variant="labelSmall" style={styles.listSectionLabel}>RECIENTES</Text>
          ) : null
        }
        renderItem={({ item, index }) => {
          if (item.type === "recent") {
            return (
              <TouchableOpacity
                style={[styles.resultRow, index > 0 && styles.resultBorder]}
                onPress={() => handleSelectPlace(item.place)}
                activeOpacity={0.7}
              >
                <View style={styles.resultIconWrap}>
                  <MaterialCommunityIcons name="clock-outline" size={18} color="#94A3B8" />
                </View>
                <View style={styles.resultTexts}>
                  <Text variant="bodyMedium" style={styles.resultLabel}>{item.place.label}</Text>
                  <Text variant="bodySmall" style={styles.resultSub} numberOfLines={1}>{item.place.sublabel}</Text>
                </View>
              </TouchableOpacity>
            );
          }
          const { label, sublabel } = formatAddress(item.s);
          return (
            <TouchableOpacity
              style={[styles.resultRow, index > 0 && styles.resultBorder]}
              onPress={() => handleSelectSuggestion(item.s)}
              activeOpacity={0.7}
            >
              <View style={styles.resultIconWrap}>
                <MaterialCommunityIcons name="map-marker-outline" size={18} color="#16A34A" />
              </View>
              <View style={styles.resultTexts}>
                <Text variant="bodyMedium" style={styles.resultLabel}>{label}</Text>
                {!!sublabel && <Text variant="bodySmall" style={styles.resultSub} numberOfLines={1}>{sublabel}</Text>}
              </View>
            </TouchableOpacity>
          );
        }}
      />

      {/* Footer CTA — only when both origin + destination are set */}
      {canProceed && (
        <View style={[styles.searchFooter, { paddingBottom: insets.bottom + 16 }]}>
          <TouchableOpacity
            style={styles.ctaButton}
            onPress={() => { Keyboard.dismiss(); setView("map"); }}
            activeOpacity={0.85}
          >
            <MaterialCommunityIcons name="map-outline" size={20} color="#fff" />
            <Text style={styles.ctaText}>Ver ruta en el mapa</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#E8F5E9" },

  // ── Map view ──────────────────────────────────────────────────────────────
  mapHeader: {
    position: "absolute", top: 0, left: 0, right: 0,
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 12, paddingBottom: 12, gap: 8,
  },
  mapBackBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.95)",
    alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12, shadowRadius: 8, elevation: 4,
  },
  mapHeaderPill: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    backgroundColor: "rgba(255,255,255,0.95)", borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 10,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12, shadowRadius: 8, elevation: 4,
  },
  mapHeaderTitle: { fontWeight: "700", color: "#0F172A" },

  mapBottomCard: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, gap: 16,
    shadowColor: "#000", shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12, shadowRadius: 16, elevation: 20,
  },
  routeSummary: { flexDirection: "row", alignItems: "center", gap: 12 },
  routeDotsCol: { alignItems: "center", gap: 2 },
  routeDot: { width: 10, height: 10, borderRadius: 5 },
  routeDotLine: { width: 2, height: 20, backgroundColor: "#E2E8F0" },
  routeTexts: { flex: 1 },
  routeAddrText: { color: "#0F172A", fontWeight: "500" },
  editBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "#F1F5F9", alignItems: "center", justifyContent: "center",
  },

  ctaButton: {
    flexDirection: "row", backgroundColor: "#16A34A", borderRadius: 14,
    paddingVertical: 16, alignItems: "center", justifyContent: "center", gap: 8,
  },
  ctaText: { color: "#FFFFFF", fontWeight: "700", fontSize: 16 },

  // ── Search view ───────────────────────────────────────────────────────────
  searchScreen: { flex: 1, backgroundColor: "#FFFFFF" },
  searchHeader: { paddingHorizontal: 16, paddingBottom: 10 },
  searchHeaderTitle: { fontWeight: "700", color: "#0F172A" },

  searchInputsCard: {
    marginHorizontal: 16,
    backgroundColor: "#F8FAFC", borderRadius: 14,
    borderWidth: 1, borderColor: "#E2E8F0", overflow: "hidden",
  },
  searchInputRow: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 14, paddingVertical: 2, minHeight: 46, gap: 10,
  },
  searchInputDivider: { height: 1, backgroundColor: "#E2E8F0", marginLeft: 44 },
  searchDot: { width: 10, height: 10, borderRadius: 5 },
  searchRawInput: { flex: 1, fontSize: 15, color: "#0F172A", paddingVertical: 8 },
  searchInputText: { flex: 1, fontSize: 15, color: "#0F172A", paddingVertical: 8 },
  searchPlaceholder: { color: "#94A3B8" },

  chipsScroll: { marginTop: 10, height: 30, flexShrink: 0, flexGrow: 0 },
  chipsContent: { paddingHorizontal: 16, gap: 6, alignItems: "center" },
  chip: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "#F1F5F9", borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, borderColor: "#E2E8F0",
    height: 28,
  },
  chipText: { fontSize: 11, fontWeight: "600", color: "#64748B" },

  searchDivider: { height: 1, backgroundColor: "#F1F5F9", marginTop: 10 },

  listSectionLabel: {
    color: "#94A3B8", letterSpacing: 1,
    paddingHorizontal: 16, paddingTop: 14, paddingBottom: 6,
  },
  searchingRow: { flexDirection: "row", alignItems: "center", gap: 10, padding: 16 },
  resultRow: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 14, gap: 14,
  },
  resultBorder: { borderTopWidth: 1, borderTopColor: "#F1F5F9" },
  resultIconWrap: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "#F1F5F9", alignItems: "center", justifyContent: "center",
  },
  resultTexts: { flex: 1 },
  resultLabel: { fontWeight: "600", color: "#0F172A" },
  resultSub: { color: "#94A3B8", marginTop: 2 },

  searchFooter: { paddingHorizontal: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: "#F1F5F9" },
});
