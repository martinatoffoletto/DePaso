import React from "react";
import { View, ActivityIndicator, Text } from "react-native";
import { T } from "@/constants/tokens";

interface LoadingScreenProps {
  message?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message = "Cargando...",
}) => {
  return (
    <View className="flex-1 bg-bg justify-center items-center gap-4">
      <ActivityIndicator size="large" color={T.forest} />
      <Text className="text-sm text-inkSoft">{message}</Text>
    </View>
  );
};
