import React from "react";
import { View } from "react-native";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = "inbox",
  title,
  description,
}) => {
  return (
    <View className="flex-1 justify-center items-center px-6 gap-3">
      <MaterialCommunityIcons name={icon} size={48} color="#BDBDBD" />
      <Text variant="titleMedium" className="text-center">
        {title}
      </Text>
      {description && (
        <Text variant="bodySmall" className="text-center text-gray-500">
          {description}
        </Text>
      )}
    </View>
  );
};
