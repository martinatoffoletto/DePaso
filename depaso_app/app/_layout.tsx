import "../global.css";
import { useEffect } from "react";
import { DarkTheme, ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import { Providers } from "@/src/components/Providers";
import { useAuthStore } from "@/src/stores/authStore";
import { useSettingsStore } from "@/src/stores/settingsStore";

export default function RootLayout() {
  // Route gating uses Stack.Protected (Expo Router's recommended pattern):
  // the guard decides which group is mounted, so there is no manual redirect
  // effect racing with the navigation state.
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const restoreToken = useAuthStore((s) => s.restoreToken);
  const hydrateSettings = useSettingsStore((s) => s.hydrate);

  useEffect(() => {
    restoreToken();
    hydrateSettings();
  }, [restoreToken, hydrateSettings]);

  return (
    <Providers>
      <ThemeProvider value={DarkTheme}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Protected guard={isAuthenticated}>
            <Stack.Screen name="(main)" />
          </Stack.Protected>
          <Stack.Protected guard={!isAuthenticated}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)" />
          </Stack.Protected>
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </Providers>
  );
}
