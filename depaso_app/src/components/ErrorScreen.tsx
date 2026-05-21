import React from "react";
import { View } from "react-native";
import { Text, Button } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";

interface ErrorScreenProps {
  message: string;
  onRetry?: () => void;
}

export const ErrorScreen: React.FC<ErrorScreenProps> = ({
  message,
  onRetry,
}) => {
  return (
    <View className="flex-1 bg-white justify-center items-center px-4 gap-4">
      <MaterialCommunityIcons name="alert-circle" size={64} color="#F44336" />
      <Text variant="titleMedium" style={{ textAlign: "center" }}>
        Error
      </Text>
      <Text variant="bodyMedium" style={{ textAlign: "center", color: "#666" }}>
        {message}
      </Text>
      {onRetry && (
        <Button mode="contained" onPress={onRetry} className="mt-4">
          Try Again
        </Button>
      )}
    </View>
  );
};
