import React from "react";
import { ColorValue } from "react-native";
import { Tabs } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuthStore } from "@/src/stores/authStore";
import { UserType } from "@/src/types";
import { T } from "@/constants/tokens";

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>["name"];

function TabIcon({ name, color, size }: { name: IconName; color: ColorValue; size: number }) {
  return <MaterialCommunityIcons name={name} color={color} size={size} />;
}

export default function TabLayout() {
  const { user } = useAuthStore();
  const isCarrier = user?.user_type === UserType.CARRIER;
  const isAdmin = user?.user_type === UserType.ADMIN;
  const isClient = !isCarrier && !isAdmin;

  return (
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
          title: isCarrier ? "Pedidos" : "Enviar",
          tabBarIcon: ({ color, size }) => (
            <TabIcon
              name={isCarrier ? "clipboard-list-outline" : "package-variant-closed"}
              color={color}
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="envios"
        options={{
          title: isCarrier ? "Mis Viajes" : "Mis Envíos",
          tabBarIcon: ({ color, size }) => (
            <TabIcon
              name={isCarrier ? "truck-outline" : "map-marker-path"}
              color={color}
              size={size}
            />
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
  );
}
