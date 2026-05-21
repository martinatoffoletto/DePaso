import { useMemo, useState } from "react";
import { MD3LightTheme, PaperProvider } from "react-native-paper";

import { HomeScreen }           from "./screens/HomeScreen";
import { MatchingScreen }       from "./screens/MatchingScreen";
import { OfferSelectionScreen } from "./screens/OfferSelectionScreen";
import { PackageCategoryScreen } from "./screens/PackageCategoryScreen";
import { RequestRideScreen }    from "./screens/RequestRideScreen";
import { SummaryScreen }        from "./screens/SummaryScreen";
import type { CarrierScoreResponse } from "@/src/types";

type Step = "home" | "request" | "package" | "offer" | "matching" | "summary";
type DeliveryMode = "dedicada" | "colaborativa";

export interface Coords {
  latitude: number;
  longitude: number;
}

const CATEGORY_LABEL: Record<string, string> = {
  xs: "Sobre / Documento",
  s:  "Caja chica",
  m:  "Caja mediana",
  l:  "Caja grande",
  xl: "Voluminoso / Flete",
};

export function FlowNavigator() {
  const [step, setStep]                   = useState<Step>("home");
  const [origin, setOrigin]               = useState("");
  const [destination, setDestination]     = useState("");
  const [originCoords, setOriginCoords]   = useState<Coords | null>(null);
  const [destinationCoords, setDestinationCoords] = useState<Coords | null>(null);
  const [categoryId, setCategoryId]       = useState<string>("m");
  const [weightKg, setWeightKg]           = useState<number>(2);
  const [mode, setMode]                   = useState<DeliveryMode>("colaborativa");
  const [matchedCarrier, setMatchedCarrier] = useState<CarrierScoreResponse | null>(null);
  const [shipmentId, setShipmentId]       = useState<number | null>(null);

  function resetAll() {
    setStep("home");
    setOrigin("");
    setDestination("");
    setOriginCoords(null);
    setDestinationCoords(null);
    setCategoryId("m");
    setWeightKg(2);
    setMode("colaborativa");
    setMatchedCarrier(null);
    setShipmentId(null);
  }

  const screen = useMemo(() => {
    if (step === "home") {
      return <HomeScreen onStart={() => setStep("request")} />;
    }

    if (step === "request") {
      return (
        <RequestRideScreen
          initialOrigin={origin}
          initialDestination={destination}
          initialOriginCoords={originCoords}
          initialDestinationCoords={destinationCoords}
          onNext={(payload) => {
            setOrigin(payload.origin);
            setDestination(payload.destination);
            setOriginCoords(payload.originCoords);
            setDestinationCoords(payload.destinationCoords);
            setStep("package");
          }}
        />
      );
    }

    if (step === "package") {
      return (
        <PackageCategoryScreen
          initialCategoryId={categoryId}
          initialWeightKg={weightKg}
          onBack={() => setStep("request")}
          onNext={(payload) => {
            setCategoryId(payload.categoryId);
            setWeightKg(payload.weightKg);
            setStep("offer");
          }}
        />
      );
    }

    if (step === "offer") {
      return (
        <OfferSelectionScreen
          origin={origin}
          destination={destination}
          packageLabel={CATEGORY_LABEL[categoryId] ?? categoryId}
          initialMode={mode}
          onBack={() => setStep("package")}
          onNext={(selectedMode) => {
            setMode(selectedMode);
            setStep("matching");
          }}
        />
      );
    }

    if (step === "matching") {
      return (
        <MatchingScreen
          mode={mode}
          categoryId={categoryId}
          weightKg={weightKg}
          originCoords={originCoords}
          destinationCoords={destinationCoords}
          onBack={() => setStep("offer")}
          onConfirm={(carrier, sid) => {
            setMatchedCarrier(carrier);
            setShipmentId(sid);
            setStep("summary");
          }}
          onReset={resetAll}
        />
      );
    }

    // summary
    return (
      <SummaryScreen
        origin={origin}
        destination={destination}
        originCoords={originCoords}
        destinationCoords={destinationCoords}
        categoryId={categoryId}
        weightKg={weightKg}
        mode={mode}
        carrier={matchedCarrier}
        shipmentId={shipmentId}
        onBack={() => setStep("matching")}
        onConfirm={resetAll}
      />
    );
  }, [step, origin, destination, originCoords, destinationCoords, categoryId, weightKg, mode, matchedCarrier, shipmentId]);

  return <PaperProvider theme={MD3LightTheme}>{screen}</PaperProvider>;
}
