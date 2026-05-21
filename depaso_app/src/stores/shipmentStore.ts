import { create } from "zustand";
import { Shipment, Location } from "../types";

interface ShipmentState {
  // Form state
  origin: Location | null;
  destination: Location | null;
  currentShipment: Shipment | null;
  myShipments: Shipment[];

  // UI state
  isLoadingShipment: boolean;
  selectedOfferMode: "dedicada" | "colaborativa" | null;

  // Actions
  setOrigin: (location: Location) => void;
  setDestination: (location: Location) => void;
  setCurrentShipment: (shipment: Shipment | null) => void;
  setMyShipments: (shipments: Shipment[]) => void;
  setSelectedOfferMode: (mode: "dedicada" | "colaborativa") => void;
  setIsLoadingShipment: (loading: boolean) => void;
  resetShipmentForm: () => void;
}

export const useShipmentStore = create<ShipmentState>((set) => ({
  origin: null,
  destination: null,
  currentShipment: null,
  myShipments: [],
  isLoadingShipment: false,
  selectedOfferMode: null,

  setOrigin: (location: Location) => set({ origin: location }),
  setDestination: (location: Location) => set({ destination: location }),
  setCurrentShipment: (shipment: Shipment | null) =>
    set({ currentShipment: shipment }),
  setMyShipments: (shipments: Shipment[]) => set({ myShipments: shipments }),
  setSelectedOfferMode: (mode: "dedicada" | "colaborativa") =>
    set({ selectedOfferMode: mode }),
  setIsLoadingShipment: (loading: boolean) =>
    set({ isLoadingShipment: loading }),
  resetShipmentForm: () =>
    set({
      origin: null,
      destination: null,
      currentShipment: null,
      selectedOfferMode: null,
    }),
}));
