import { useEffect, useState } from "react";
import { View, ActivityIndicator, Alert } from "react-native";
import { Button, Card, Chip, Text } from "react-native-paper";

import { mockDriver, mockOffers } from "../data/mockData";
import { shipmentsService } from "@/src/services/shipments";
import { AssignmentMode, DeliveryMode, PackageCategory, Shipment } from "@/src/types";

type MatchingScreenProps = {
  mode: "dedicada" | "colaborativa";
  packageData: {
    weight: string;
    measures: string;
    description: string;
  } | null;
  onReset: () => void;
};

export function MatchingScreen({ mode, packageData, onReset }: MatchingScreenProps) {
  const selectedOffer = mockOffers.find((item) => item.id === mode);
  
  const [isLoading, setIsLoading] = useState(true);
  const [shipment, setShipment] = useState<Shipment | null>(null);

  useEffect(() => {
    async function create() {
      try {
        const result = await shipmentsService.createShipment({
          package_size: PackageCategory.M, // Fallback category based on AI or form
          modality: mode === "colaborativa" ? DeliveryMode.COLLABORATIVE : DeliveryMode.DEDICATED,
          assignment_mode: AssignmentMode.ON_DEMAND,
          origin_lat: -34.5888, // Mock Palermo
          origin_lon: -58.4305,
          destination_lat: -34.7241, // Mock Quilmes
          destination_lon: -58.2526,
          weight_kg: parseFloat(packageData?.weight || "2"),
        });
        setShipment(result);
      } catch (e: any) {
        Alert.alert("Error", "No se pudo crear el envío");
      } finally {
        setIsLoading(false);
      }
    }
    create();
  }, [mode, packageData]);

  if (isLoading) {
    return (
      <View className="flex-1 bg-[#0F172A] p-4 justify-center items-center">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={{ color: "#E2E8F0", marginTop: 16 }}>Buscando el mejor conductor...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#0F172A] p-4">
      <Text
        variant="headlineSmall"
        style={{ color: "#E2E8F0", marginBottom: 12 }}
      >
        ¡Match confirmado!
      </Text>

      <Card
        style={{
          borderRadius: 20,
          backgroundColor: "#FFFFFF",
          marginBottom: 12,
        }}
      >
        <Card.Content>
          <Text variant="titleMedium">{mockDriver.name}</Text>
          <Text>
            {mockDriver.transport} · Patente {mockDriver.plate}
          </Text>
          <View className="mt-3 flex-row gap-2">
            <Chip compact icon="star">
              {mockDriver.rating}
            </Chip>
            <Chip compact icon="clock-outline">
              Llega en {mockDriver.etaToPickupMinutes} min
            </Chip>
          </View>
        </Card.Content>
      </Card>

      <Card style={{ borderRadius: 20, backgroundColor: "#E0F2FE" }}>
        <Card.Content>
          <Text variant="titleMedium">Resumen del pedido #{shipment?.id}</Text>
          <Text style={{ marginTop: 4 }}>Modalidad: {shipment?.modality}</Text>
          <Text>Estado: {shipment?.status}</Text>
          <Text>Peso: {shipment?.weight_kg} kg</Text>
          {selectedOffer && (
            <>
              <Text>Precio: ${selectedOffer.priceArs}</Text>
              <Text>ETA estimado: {selectedOffer.etaMinutes} min</Text>
            </>
          )}
        </Card.Content>
      </Card>

      <Button
        mode="contained"
        buttonColor="#F59E0B"
        textColor="#111827"
        style={{ marginTop: 16 }}
        onPress={onReset}
      >
        Simular nuevo pedido
      </Button>
    </View>
  );
}
