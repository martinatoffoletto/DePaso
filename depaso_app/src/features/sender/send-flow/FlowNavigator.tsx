import { useMemo, useState } from "react";
import { MD3LightTheme, PaperProvider } from "react-native-paper";

import { HomeScreen }        from "./HomeScreen";
import { PackageScreen }     from "./PackageScreen";
import { AddressScreen }     from "./AddressScreen";
import { RouteOfferScreen }  from "./RouteOfferScreen";
import { SummaryScreen }     from "./SummaryScreen";

type Step = "home" | "package" | "address" | "route_offer" | "summary";
type DeliveryMode = "dedicada" | "colaborativa";

export interface Coords {
  latitude: number;
  longitude: number;
}

export function FlowNavigator() {
  const [step, setStep] = useState<Step>("home");

  // Package state
  const [categoryId, setCategoryId]   = useState("m");
  const [weightKg, setWeightKg]       = useState(2);
  const [description, setDescription] = useState("");
  const [photoUri, setPhotoUri]       = useState<string | null>(null);

  // Address state
  const [origin, setOrigin]                     = useState("");
  const [destination, setDestination]           = useState("");
  const [originCoords, setOriginCoords]         = useState<Coords | null>(null);
  const [destinationCoords, setDestinationCoords] = useState<Coords | null>(null);
  const [recipientName, setRecipientName]       = useState("");
  const [recipientPhone, setRecipientPhone]     = useState("");

  // Offer state
  const [mode, setMode] = useState<DeliveryMode>("colaborativa");

  function resetAll() {
    setStep("home");
    setCategoryId("m");
    setWeightKg(2);
    setDescription("");
    setPhotoUri(null);
    setOrigin("");
    setDestination("");
    setOriginCoords(null);
    setDestinationCoords(null);
    setRecipientName("");
    setRecipientPhone("");
    setMode("colaborativa");
  }

  const screen = useMemo(() => {
    if (step === "home") {
      return <HomeScreen onStart={(uri) => {
        if (uri) setPhotoUri(uri);
        setStep("package");
      }} />;
    }

    if (step === "package") {
      return (
        <PackageScreen
          initial={{ categoryId, weightKg, description, photoUri }}
          onBack={() => setStep("home")}
          onNext={(p) => {
            setCategoryId(p.categoryId);
            setWeightKg(p.weightKg);
            setDescription(p.description);
            setPhotoUri(p.photoUri);
            setStep("address");
          }}
        />
      );
    }

    if (step === "address") {
      return (
        <AddressScreen
          initial={{ origin, destination, originCoords, destinationCoords, recipientName, recipientPhone }}
          onBack={() => setStep("package")}
          onNext={(p) => {
            setOrigin(p.origin);
            setDestination(p.destination);
            setOriginCoords(p.originCoords);
            setDestinationCoords(p.destinationCoords);
            setRecipientName(p.recipientName);
            setRecipientPhone(p.recipientPhone);
            setStep("route_offer");
          }}
        />
      );
    }

    if (step === "route_offer") {
      return (
        <RouteOfferScreen
          origin={origin}
          destination={destination}
          originCoords={originCoords}
          destinationCoords={destinationCoords}
          initialMode={mode}
          onBack={() => setStep("address")}
          onNext={(selectedMode) => {
            setMode(selectedMode);
            setStep("summary");
          }}
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
        description={description}
        photoUri={photoUri}
        mode={mode}
        recipientName={recipientName}
        recipientPhone={recipientPhone}
        onBack={() => setStep("route_offer")}
        onConfirm={resetAll}
      />
    );
  }, [step, categoryId, weightKg, description, photoUri, origin, destination, originCoords, destinationCoords, recipientName, recipientPhone, mode]);

  return <PaperProvider theme={MD3LightTheme}>{screen}</PaperProvider>;
}
