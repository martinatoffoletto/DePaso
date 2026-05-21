import { useMemo, useState } from "react";
import { View } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { Button, Card, Text, TextInput } from "react-native-paper";

type RequestRideScreenProps = {
  onNext: (payload: { origin: string; destination: string }) => void;
};

const AMBA_CENTER = {
  latitude: -34.6037,
  longitude: -58.3816,
  latitudeDelta: 0.2,
  longitudeDelta: 0.2,
};

export function RequestRideScreen({ onNext }: RequestRideScreenProps) {
  const [origin, setOrigin] = useState("Palermo, CABA");
  const [destination, setDestination] = useState("Quilmes Centro");

  const disableNext = useMemo(
    () => !origin.trim() || !destination.trim(),
    [origin, destination],
  );

  return (
    <View className="flex-1 bg-[#FFF7ED]">
      <MapView style={{ flex: 1 }} initialRegion={AMBA_CENTER}>
        <Marker
          coordinate={{ latitude: -34.5882, longitude: -58.4306 }}
          title="Origen"
        />
        <Marker
          coordinate={{ latitude: -34.7203, longitude: -58.2541 }}
          title="Destino"
        />
      </MapView>

      <Card
        style={{
          marginHorizontal: 16,
          marginTop: -150,
          marginBottom: 16,
          borderRadius: 20,
          backgroundColor: "#FFFFFF",
        }}
      >
        <Card.Content>
          <Text variant="headlineSmall" style={{ marginBottom: 10 }}>
            Pedir envio en AMBA
          </Text>
          <TextInput
            mode="outlined"
            label="Origen"
            value={origin}
            onChangeText={setOrigin}
            left={<TextInput.Icon icon="map-marker" />}
            style={{ marginBottom: 8 }}
          />
          <TextInput
            mode="outlined"
            label="Destino"
            value={destination}
            onChangeText={setDestination}
            left={<TextInput.Icon icon="flag-checkered" />}
            style={{ marginBottom: 12 }}
          />
          <Button
            mode="contained"
            buttonColor="#0EA5E9"
            textColor="#FFFFFF"
            disabled={disableNext}
            onPress={() => onNext({ origin, destination })}
          >
            Ver opciones de envio
          </Button>
        </Card.Content>
      </Card>
    </View>
  );
}
