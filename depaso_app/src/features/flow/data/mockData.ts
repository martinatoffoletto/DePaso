export type DeliveryMode = "dedicada" | "colaborativa";

export type DeliveryOffer = {
  id: DeliveryMode;
  title: string;
  subtitle: string;
  priceArs: number;
  etaMinutes: number;
  co2SavedKg: number;
};

export const mockOffers: DeliveryOffer[] = [
  {
    id: "dedicada",
    title: "Dedicada",
    subtitle: "Retiro inmediato con conductor exclusivo",
    priceArs: 6900,
    etaMinutes: 28,
    co2SavedKg: 0,
  },
  {
    id: "colaborativa",
    title: "Colaborativa",
    subtitle: "Aprovecha trayectos existentes y reduce costo",
    priceArs: 3900,
    etaMinutes: 54,
    co2SavedKg: 1.8,
  },
];

export const mockAiClassification = {
  category: "mediano",
  estimatedWeightKg: 3.2,
  estimatedMeasuresCm: "30x25x18",
  confidence: 0.87,
};

export const mockDriver = {
  name: "Lucia Fernandez",
  transport: "Moto",
  rating: 4.9,
  plate: "A123BCD",
  etaToPickupMinutes: 9,
};
