import React, { useEffect, useRef } from "react";
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
  const mounted = useRef(false);

  useEffect(() => {
    restoreToken();
    mounted.current = true;
  }, []);

  useEffect(() => {
    if (!mounted.current || isLoading) return;

    const inMainGroup = segments[0] === "(main)";
    const inAuthGroup = segments[0] === "(auth)";

    if (isAuthenticated && inAuthGroup) {
      router.replace("/(main)");
    } else if (!isAuthenticated && inMainGroup) {
      router.replace("/(auth)/login");
    }
  }, [isAuthenticated, isLoading]);

  return (
    <Providers>
      <ThemeProvider value={DarkTheme}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(main)" />
          <Stack.Screen name="(auth)" />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </Providers>
  );
}
