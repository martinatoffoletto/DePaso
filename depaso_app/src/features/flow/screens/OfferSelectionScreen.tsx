import { useState } from "react";
import { ScrollView, View } from "react-native";
import { Button, Text } from "react-native-paper";

import { OfferCard } from "../components/OfferCard";
import { mockOffers } from "../data/mockData";

type OfferSelectionScreenProps = {
  origin: string;
  destination: string;
  onBack: () => void;
  onNext: (mode: "dedicada" | "colaborativa") => void;
};

export function OfferSelectionScreen({
  origin,
  destination,
  onBack,
  onNext,
}: OfferSelectionScreenProps) {
  const [selected, setSelected] = useState<"dedicada" | "colaborativa">(
    "colaborativa",
  );

  return (
    <ScrollView
      className="flex-1 bg-[#F8FAFC]"
      contentContainerStyle={{ padding: 16, gap: 12 }}
    >
      <Text variant="headlineSmall">Elegi modalidad</Text>
      <Text className="text-slate-600">
        {origin} → {destination}
      </Text>

      <View style={{ gap: 10, marginTop: 8 }}>
        {mockOffers.map((offer) => (
          <OfferCard
            key={offer.id}
            offer={offer}
            selected={selected === offer.id}
            onPress={() => setSelected(offer.id)}
          />
        ))}
      </View>

      <View className="mt-2 flex-row justify-between">
        <Button mode="outlined" onPress={onBack}>
          Volver
        </Button>
        <Button
          mode="contained"
          buttonColor="#0EA5E9"
          onPress={() => onNext(selected)}
        >
          Continuar
        </Button>
      </View>
    </ScrollView>
  );
}
