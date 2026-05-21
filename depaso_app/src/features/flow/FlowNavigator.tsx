import { useMemo, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { MD3LightTheme, PaperProvider } from "react-native-paper";

import { MatchingScreen } from "./screens/MatchingScreen";
import { OfferSelectionScreen } from "./screens/OfferSelectionScreen";
import { PackageDetailsScreen } from "./screens/PackageDetailsScreen";
import { RequestRideScreen } from "./screens/RequestRideScreen";

type Step = "request" | "offer" | "package" | "matching";
type DeliveryMode = "dedicada" | "colaborativa";

export function FlowNavigator() {
  const [step, setStep] = useState<Step>("request");
  const [origin, setOrigin] = useState("Palermo, CABA");
  const [destination, setDestination] = useState("Quilmes Centro");
  const [mode, setMode] = useState<DeliveryMode>("colaborativa");
  const [packageData, setPackageData] = useState<{
    weight: string;
    measures: string;
    description: string;
  } | null>(null);

  const screen = useMemo(() => {
    if (step === "request") {
      return (
        <RequestRideScreen
          onNext={({ origin, destination }) => {
            setOrigin(origin);
            setDestination(destination);
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
          onBack={() => setStep("request")}
          onNext={(selectedMode) => {
            setMode(selectedMode);
            setStep("package");
          }}
        />
      );
    }

    if (step === "package") {
      return (
        <PackageDetailsScreen
          mode={mode}
          onBack={() => setStep("offer")}
          onNext={(pkgData) => {
            setPackageData(pkgData);
            setStep("matching");
          }}
        />
      );
    }

    return (
      <MatchingScreen
        mode={mode}
        packageData={packageData}
        onReset={() => {
          setPackageData(null);
          setStep("request");
        }}
      />
    );
  }, [destination, mode, origin, step, packageData]);

  return (
    <PaperProvider theme={MD3LightTheme}>
      <SafeAreaView style={{ flex: 1 }}>{screen}</SafeAreaView>
    </PaperProvider>
  );
}
