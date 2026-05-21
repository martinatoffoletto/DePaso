import { useState } from "react";
import { ScrollView, View } from "react-native";
import { Button, Card, Chip, Text, TextInput } from "react-native-paper";

import { mockAiClassification } from "../data/mockData";

type PackageDetailsScreenProps = {
  mode: "dedicada" | "colaborativa";
  onBack: () => void;
  onNext: (payload: {
    weight: string;
    measures: string;
    description: string;
  }) => void;
};

export function PackageDetailsScreen({
  mode,
  onBack,
  onNext,
}: PackageDetailsScreenProps) {
  const [weight, setWeight] = useState(
    String(mockAiClassification.estimatedWeightKg),
  );
  const [measures, setMeasures] = useState(
    mockAiClassification.estimatedMeasuresCm,
  );
  const [description, setDescription] = useState(
    "Caja con productos de perfumeria",
  );

  return (
    <ScrollView
      className="flex-1 bg-white"
      contentContainerStyle={{ padding: 16, gap: 12 }}
    >
      <Text variant="headlineSmall">Carga del paquete</Text>
      <Text className="text-slate-600">
        Modalidad elegida: {mode === "dedicada" ? "Dedicada" : "Colaborativa"}
      </Text>

      <Card style={{ borderRadius: 16, backgroundColor: "#EFF6FF" }}>
        <Card.Content>
          <Text variant="titleMedium">Clasificacion IA (mock)</Text>
          <Text style={{ marginTop: 4 }}>
            Categoria estimada: {mockAiClassification.category}
          </Text>
          <View className="mt-2 flex-row gap-2">
            <Chip compact icon="scale-bathroom">
              {mockAiClassification.estimatedWeightKg} kg
            </Chip>
            <Chip compact icon="cube-outline">
              {mockAiClassification.estimatedMeasuresCm}
            </Chip>
            <Chip compact icon="brain">
              {Math.round(mockAiClassification.confidence * 100)}%
            </Chip>
          </View>
        </Card.Content>
      </Card>

      <Button mode="outlined" icon="camera-outline">
        Sacar foto del paquete (mock)
      </Button>

      <TextInput
        mode="outlined"
        label="Peso (kg)"
        value={weight}
        onChangeText={setWeight}
        keyboardType="decimal-pad"
      />
      <TextInput
        mode="outlined"
        label="Medidas (cm)"
        value={measures}
        onChangeText={setMeasures}
      />
      <TextInput
        mode="outlined"
        label="Descripcion"
        value={description}
        onChangeText={setDescription}
        multiline
      />

      <View className="mt-1 flex-row justify-between">
        <Button mode="outlined" onPress={onBack}>
          Volver
        </Button>
        <Button
          mode="contained"
          buttonColor="#14B8A6"
          onPress={() => onNext({ weight, measures, description })}
        >
          Buscar conductor
        </Button>
      </View>
    </ScrollView>
  );
}
