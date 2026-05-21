import React from "react";
import { Text } from "react-native";
import { Tabs } from "expo-router";
import { useAuthStore } from "@/src/stores/authStore";
import { UserType } from "@/src/types";

function TabIcon({ emoji }: { emoji: string }) {
  return <Text style={{ fontSize: 22 }}>{emoji}</Text>;
}

export default function TabLayout() {
  const { user } = useAuthStore();
  const isCarrier = user?.user_type === UserType.CARRIER;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#3B82F6",
        tabBarInactiveTintColor: "#64748B",
        tabBarStyle: {
          backgroundColor: "#0F172A",
          borderTopColor: "#1E293B",
          borderTopWidth: 1,
          paddingTop: 8,
          paddingBottom: 8,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
        },
      }}
    >
      {/* Home — different label per role */}
      <Tabs.Screen
        name="index"
        options={{
          title: isCarrier ? "Pedidos" : "Enviar",
          tabBarIcon: () => <TabIcon emoji={isCarrier ? "📋" : "📦"} />,
        }}
      />

      {/* Activity — different label per role */}
      <Tabs.Screen
        name="explore"
        options={{
          title: isCarrier ? "Mis Viajes" : "Mis Envíos",
          tabBarIcon: () => <TabIcon emoji={isCarrier ? "🚗" : "📍"} />,
        }}
      />

      {/* Profile — shared */}
      <Tabs.Screen
        name="profile"
        options={{
          title: "Perfil",
          tabBarIcon: () => <TabIcon emoji="👤" />,
        }}
      />
    </Tabs>
  );
}
