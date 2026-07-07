import React, { useEffect } from "react";
import { ColorValue, View } from "react-native";
import { Tabs, useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Notifications from "expo-notifications";
import { useAuthStore } from "@/src/stores/authStore";
import { UserType } from "@/src/types";
import { T } from "@/constants/tokens";
import { MotoIcon } from "@/src/components/MotoIcon";
import { useShipmentNotifications } from "@/src/hooks/useShipmentNotifications";
import { OfflineBanner } from "@/src/components/OfflineBanner";
import { OnboardingOverlay } from "@/src/features/onboarding/OnboardingOverlay";

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>["name"];

function TabIcon({ name, color, size }: { name: IconName; color: ColorValue; size: number }) {
  return <MaterialCommunityIcons name={name} color={color} size={size} />;
}

export default function TabLayout() {
  const { user } = useAuthStore();
  // Local notifications for shipment status changes (client) / new offers (carrier).
  useShipmentNotifications();
  const isCarrier = user?.user_type === UserType.CARRIER;
  const isAdmin = user?.user_type === UserType.ADMIN;
  const isClient = !isCarrier && !isAdmin;

  // Tapping a local notification opens the relevant tab.
  const router = useRouter();
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener(() => {
      router.push(isCarrier ? "/(main)/enviar" : "/(main)/envios");
    });
    return () => sub.remove();
  }, [router, isCarrier]);

  return (
    <View style={{ flex: 1, backgroundColor: T.bg }}>
      <OfflineBanner />
      <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: T.forest,
        tabBarInactiveTintColor: T.inkMute,
        tabBarStyle: {
          backgroundColor: T.bg,
          borderTopColor: T.border,
          borderTopWidth: 1,
          paddingTop: 6,
          paddingBottom: 6,
          height: 62,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="enviar"
        options={{
          href: isAdmin ? null : undefined,
          title: isCarrier ? "Inicio" : "Enviar",
          tabBarIcon: ({ color, size }) => (
            <TabIcon
              name={isCarrier ? "home-variant-outline" : "package-variant-closed"}
              color={color}
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="envios"
        options={{
          href: isAdmin ? null : undefined,
          title: isCarrier ? "Viajes" : "Mis Envíos",
          tabBarIcon: ({ color, size }) =>
            isCarrier ? (
              <MotoIcon color={color} size={size} strokeWidth={2} />
            ) : (
              <TabIcon name="map-marker-path" color={color} size={size} />
            ),
        }}
      />
      <Tabs.Screen
        name="pagos"
        options={{
          href: isCarrier ? undefined : null,
          title: "Pagos",
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="wallet-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="impacto"
        options={{
          href: isClient ? undefined : null,
          title: "Impacto",
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="leaf" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="admin"
        options={{
          href: isAdmin ? undefined : null,
          title: "Admin",
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="shield-account-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: "Perfil",
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="account-circle-outline" color={color} size={size} />
          ),
        }}
      />
      </Tabs>
      <OnboardingOverlay />
    </View>
  );
}
