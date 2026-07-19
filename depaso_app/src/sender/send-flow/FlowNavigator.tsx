import { useCallback, useMemo, useState } from "react";
import { MD3LightTheme, PaperProvider } from "react-native-paper";
import { useSettingsStore } from "@/src/shared/session/settingsStore";

import { HomeScreen }        from "./HomeScreen";
import { PackageScreen }     from "./PackageScreen";
import { AddressScreen }     from "./AddressScreen";
import { RouteOfferScreen }  from "./RouteOfferScreen";
import { SummaryScreen }     from "./SummaryScreen";
import type { Quote, ProductMode } from "@/src/shared/types";
import { PickupSchedule, PICKUP_ASAP } from "@/src/sender/pickupSchedule";

type Step = "home" | "package" | "address" | "route_offer" | "summary";

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
  const [schedule, setSchedule]                 = useState<PickupSchedule>(PICKUP_ASAP);

  // Offer state — `mode` is null until the user explicitly picks a product; the
  // effective default is derived (below) from the schedule + saved preference.
  const preferCollaborative = useSettingsStore((s) => s.preferCollaborative);
  const [mode, setMode] = useState<ProductMode | null>(null);
  const [quote, setQuote] = useState<Quote | null>(null);

  // Default product (MODALIDADES.md §4.1): franja elegida → "hoy"; si no, la
  // preferencia guardada (colaborativa → "depaso", si no → "ya"). XL nunca es
  // "depaso" (colaborativo prohibido por volumen).
  const isXl = categoryId === "xl";
  const effectiveMode: ProductMode = useMemo(() => {
    const base: ProductMode = mode ?? (schedule.kind === "window" ? "hoy" : preferCollaborative ? "depaso" : "ya");
    if (isXl && base === "depaso") return schedule.kind === "window" ? "hoy" : "ya";
    return base;
  }, [mode, schedule.kind, preferCollaborative, isXl]);

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
    setSchedule(PICKUP_ASAP);
    setMode(null);
    setQuote(null);
  }, []);

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
          initial={{ origin, destination, originCoords, destinationCoords, recipientName, recipientPhone, schedule }}
          onBack={() => setStep("package")}
          onNext={(p) => {
            setOrigin(p.origin);
            setDestination(p.destination);
            setOriginCoords(p.originCoords);
            setDestinationCoords(p.destinationCoords);
            setRecipientName(p.recipientName);
            setRecipientPhone(p.recipientPhone);
            setSchedule(p.schedule);
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
          initialMode={effectiveMode}
          schedule={schedule}
          onScheduleChange={setSchedule}
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
        mode={effectiveMode}
        quote={quote}
        recipientName={recipientName}
        recipientPhone={recipientPhone}
        schedule={schedule}
        onBack={() => setStep("route_offer")}
        onConfirm={resetAll}
      />
    );
  }, [step, categoryId, weightKg, description, declaredValue, photoUri, photoServerUrl, origin, destination, originCoords, destinationCoords, recipientName, recipientPhone, schedule, effectiveMode, quote, resetAll]);

  return <PaperProvider theme={MD3LightTheme}>{screen}</PaperProvider>;
}
