import { useCallback, useMemo, useState } from "react";
import { MD3LightTheme, PaperProvider } from "react-native-paper";
import { useSettingsStore } from "@/src/shared/session/settingsStore";

import { HomeScreen }        from "./HomeScreen";
import { PackageScreen }     from "./PackageScreen";
import { AddressScreen }     from "./AddressScreen";
import { RouteOfferScreen }  from "./RouteOfferScreen";
import { SummaryScreen }     from "./SummaryScreen";
import type { Quote } from "@/src/shared/types";

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
  const [declaredValue, setDeclaredValue] = useState<number | null>(null);
  const [photoUri, setPhotoUri]       = useState<string | null>(null);
  // URL pública de la foto (subida al clasificar) — se manda como photo_url.
  const [photoServerUrl, setPhotoServerUrl] = useState<string | null>(null);

  // Address state
  const [origin, setOrigin]                     = useState("");
  const [destination, setDestination]           = useState("");
  const [originCoords, setOriginCoords]         = useState<Coords | null>(null);
  const [destinationCoords, setDestinationCoords] = useState<Coords | null>(null);
  const [recipientName, setRecipientName]       = useState("");
  const [recipientPhone, setRecipientPhone]     = useState("");

  // Offer state — default modality follows the user's saved preference (#5/#6).
  const preferCollaborative = useSettingsStore((s) => s.preferCollaborative);
  const [mode, setMode] = useState<DeliveryMode>(preferCollaborative ? "colaborativa" : "dedicada");
  const [quote, setQuote] = useState<Quote | null>(null);

  const resetAll = useCallback(() => {
    setStep("home");
    setCategoryId("m");
    setWeightKg(2);
    setDescription("");
    setDeclaredValue(null);
    setPhotoUri(null);
    setPhotoServerUrl(null);
    setOrigin("");
    setDestination("");
    setOriginCoords(null);
    setDestinationCoords(null);
    setRecipientName("");
    setRecipientPhone("");
    setMode(preferCollaborative ? "colaborativa" : "dedicada");
    setQuote(null);
  }, [preferCollaborative]);

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
          initial={{ categoryId, weightKg, description, declaredValue, photoUri, photoServerUrl }}
          onBack={() => setStep("home")}
          onNext={(p) => {
            setCategoryId(p.categoryId);
            setWeightKg(p.weightKg);
            setDescription(p.description);
            setDeclaredValue(p.declaredValue);
            setPhotoUri(p.photoUri);
            setPhotoServerUrl(p.photoServerUrl);
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
          categoryId={categoryId}
          initialMode={mode}
          onBack={() => setStep("address")}
          onNext={(selectedMode, q) => {
            setMode(selectedMode);
            setQuote(q);
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
        declaredValue={declaredValue}
        photoUri={photoUri}
        photoServerUrl={photoServerUrl}
        mode={mode}
        quote={quote}
        recipientName={recipientName}
        recipientPhone={recipientPhone}
        onBack={() => setStep("route_offer")}
        onConfirm={resetAll}
      />
    );
  }, [step, categoryId, weightKg, description, declaredValue, photoUri, photoServerUrl, origin, destination, originCoords, destinationCoords, recipientName, recipientPhone, mode, quote, resetAll]);

  return <PaperProvider theme={MD3LightTheme}>{screen}</PaperProvider>;
}
