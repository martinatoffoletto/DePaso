import React from "react";
import { View, Text } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { T } from "@/constants/tokens";

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
      <MaterialCommunityIcons name={icon as any} size={48} color={T.border} />
      <Text className="text-base font-semibold text-ink text-center">{title}</Text>
      {description && (
        <Text className="text-sm text-inkMute text-center">{description}</Text>
      )}
    </View>
  );
};
