import "../global.css";
import { useEffect } from "react";
import { DarkTheme, ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import { Providers } from "@/src/shared/ui/Providers";
import { AppErrorBoundary } from "@/src/shared/errors/AppErrorBoundary";
import { Toast } from "@/src/shared/ui/Toast";
import { useAuthStore } from "@/src/shared/session/authStore";
import { useSettingsStore } from "@/src/shared/session/settingsStore";
import { useAddressBookStore } from "@/src/shared/profile/addressBookStore";

export default function RootLayout() {
  // Route gating uses Stack.Protected (Expo Router's recommended pattern):
  // the guard decides which group is mounted, so there is no manual redirect
  // effect racing with the navigation state.
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const restoreToken = useAuthStore((s) => s.restoreToken);
  const hydrateSettings = useSettingsStore((s) => s.hydrate);
  const hydrateAddressBook = useAddressBookStore((s) => s.hydrate);

  useEffect(() => {
    restoreToken();
    hydrateSettings();
    hydrateAddressBook();
  }, [restoreToken, hydrateSettings, hydrateAddressBook]);

  return (
    <AppErrorBoundary>
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
          <Toast />
          <StatusBar style="auto" />
        </ThemeProvider>
      </Providers>
    </AppErrorBoundary>
  );
}
