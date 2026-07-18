import { Alert, Linking, Platform } from "react-native";

/**
 * Abre la app de navegación que el rider prefiera hacia un punto.
 * URLs universales: si la app está instalada la abre, si no cae al browser.
 */
export function openExternalNavigation(lat: number, lon: number, title = "Navegar con…") {
  const apps: { text: string; url: string }[] = [
    { text: "Google Maps", url: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}` },
    { text: "Waze", url: `https://waze.com/ul?ll=${lat},${lon}&navigate=yes` },
  ];
  if (Platform.OS === "ios") {
    apps.push({ text: "Apple Maps", url: `http://maps.apple.com/?daddr=${lat},${lon}` });
  }
  Alert.alert(title, undefined, [
    ...apps.map((a) => ({
      text: a.text,
      onPress: () => Linking.openURL(a.url).catch(() => {}),
    })),
    { text: "Cancelar", style: "cancel" as const },
  ]);
}
