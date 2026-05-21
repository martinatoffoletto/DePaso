import React, { useEffect, useState } from "react";
import { DarkTheme, ThemeProvider } from "@react-navigation/native";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import { Providers } from "@/src/components/Providers";
import { useAuthStore } from "@/src/stores/authStore";

export default function RootLayout() {
  const { isAuthenticated, isLoading, restoreToken } = useAuthStore();
  const router = useRouter();
  const segments = useSegments();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    restoreToken();
    // Marcar el layout como montado después del primer render
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready || isLoading) return;

    const inAuthGroup = segments[0] === "_auth";
    const isOnRoot = segments.length === 0; // landing page

    if (!isAuthenticated && !inAuthGroup && !isOnRoot) {
      router.replace("/");
    } else if (isAuthenticated && inAuthGroup) {
      router.replace("/(tabs)");
    }
  }, [ready, isAuthenticated, isLoading, segments]);

  return (
    <Providers>
      <ThemeProvider value={DarkTheme}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="_auth" />
          <Stack.Screen name="modal" options={{ presentation: "modal" }} />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </Providers>
  );
}
