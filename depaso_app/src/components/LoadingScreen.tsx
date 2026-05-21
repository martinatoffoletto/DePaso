import React from "react";
import { View, ActivityIndicator } from "react-native";
import { Text } from "react-native-paper";

interface LoadingScreenProps {
  message?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message = "Loading...",
}) => {
  return (
    <View className="flex-1 bg-white justify-center items-center gap-4">
      <ActivityIndicator size="large" color="#2196F3" />
      <Text variant="bodyMedium">{message}</Text>
    </View>
  );
};
