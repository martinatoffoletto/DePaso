import { Pressable, View } from "react-native";
import { Card, Chip, Text } from "react-native-paper";

import type { DeliveryOffer } from "../data/mockData";

type OfferCardProps = {
  offer: DeliveryOffer;
  selected: boolean;
  onPress: () => void;
};

export function OfferCard({ offer, selected, onPress }: OfferCardProps) {
  return (
    <Pressable onPress={onPress}>
      <Card
        style={{
          borderRadius: 16,
          backgroundColor: selected ? "#E0F2FE" : "#FFFFFF",
          borderWidth: selected ? 2 : 1,
          borderColor: selected ? "#0EA5E9" : "#E2E8F0",
        }}
      >
        <Card.Content>
          <View className="flex-row items-center justify-between">
            <Text variant="titleMedium">{offer.title}</Text>
            <Chip compact style={{ backgroundColor: "#FEF3C7" }}>
              ${offer.priceArs}
            </Chip>
          </View>
          <Text className="mt-1 text-slate-600">{offer.subtitle}</Text>
          <View className="mt-3 flex-row gap-2">
            <Chip compact icon="clock-outline">
              {offer.etaMinutes} min
            </Chip>
            <Chip compact icon="leaf" style={{ backgroundColor: "#CCFBF1" }}>
              {offer.co2SavedKg} kg CO2
            </Chip>
          </View>
        </Card.Content>
      </Card>
    </Pressable>
  );
}
