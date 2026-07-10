import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { T } from "@/constants/tokens";

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  ctaLabel?: string;
  onCta?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = "inbox",
  title,
  description,
  ctaLabel,
  onCta,
}) => {
  return (
    <View className="flex-1 justify-center items-center px-6 gap-3 py-10">
      <MaterialCommunityIcons name={icon as any} size={48} color={T.border} />
      <Text className="text-base font-semibold text-ink text-center">{title}</Text>
      {description && (
        <Text className="text-sm text-inkMute text-center">{description}</Text>
      )}
      {ctaLabel && onCta && (
        <TouchableOpacity
          className="mt-2 bg-forest rounded-xl px-5 py-3"
          onPress={onCta}
          activeOpacity={0.85}
        >
          <Text className="text-[#F4EFE3] font-bold text-sm">{ctaLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};
