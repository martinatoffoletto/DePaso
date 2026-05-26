import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { T } from "@/constants/tokens";

interface ErrorScreenProps {
  message: string;
  onRetry?: () => void;
}

export const ErrorScreen: React.FC<ErrorScreenProps> = ({ message, onRetry }) => {
  return (
    <View className="flex-1 bg-bg justify-center items-center px-4 gap-4">
      <MaterialCommunityIcons name="alert-circle" size={64} color={T.red} />
      <Text className="text-base font-semibold text-ink text-center">Error</Text>
      <Text className="text-sm text-inkSoft text-center">{message}</Text>
      {onRetry && (
        <TouchableOpacity
          className="bg-forest rounded-xl px-6 py-3 mt-2"
          onPress={onRetry}
          activeOpacity={0.85}
        >
          <Text className="text-[#F4EFE3] font-bold text-sm">Reintentar</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};
