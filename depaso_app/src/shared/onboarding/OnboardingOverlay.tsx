import { useState } from "react";
import { Modal, View, TouchableOpacity } from "react-native";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { T } from "@/constants/tokens";
import { useSettingsStore } from "@/src/shared/session/settingsStore";

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>["name"];

const STEPS: { icon: IconName; title: string; body: string }[] = [
  {
    icon: "map-marker-path",
    title: "Envíos que van de paso",
    body: "DePaso conecta tu envío con transportistas que ya hacen ese trayecto. Pagás menos y se generan menos viajes.",
  },
  {
    icon: "lightning-bolt",
    title: "Colaborativo o dedicado",
    body: "Colaborativo aprovecha un viaje existente (más barato, más eco). Dedicado es exclusivo para tu paquete cuando lo necesitás.",
  },
  {
    icon: "leaf",
    title: "Cada envío cuenta",
    body: "Te mostramos el CO₂ que evitás en cada operación. Sacá una foto del paquete y la IA sugiere la categoría.",
  },
];

/** First-launch walkthrough. Shows until the user finishes it once. */
export function OnboardingOverlay() {
  const insets = useSafeAreaInsets();
  const hydrated = useSettingsStore((s) => s.hydrated);
  const onboardingSeen = useSettingsStore((s) => s.onboardingSeen);
  const update = useSettingsStore((s) => s.update);
  const [step, setStep] = useState(0);

  if (!hydrated || onboardingSeen) return null;

  const isLast = step === STEPS.length - 1;
  const current = STEPS[step];
  const finish = () => update({ onboardingSeen: true });

  return (
    <Modal visible transparent animationType="fade" onRequestClose={finish}>
      <View className="flex-1 bg-forest px-6" style={{ paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24 }}>
        <TouchableOpacity className="self-end" onPress={finish} hitSlop={12}>
          <Text className="text-[13px] text-[#F4EFE3]/70 font-semibold">Saltar</Text>
        </TouchableOpacity>

        <View className="flex-1 justify-center items-center gap-5">
          <View className="w-20 h-20 rounded-3xl bg-lime/15 border border-lime/30 items-center justify-center">
            <MaterialCommunityIcons name={current.icon} size={40} color={T.lime} />
          </View>
          <Text className="text-[26px] font-extrabold text-[#F4EFE3] text-center tracking-[-0.6px]">{current.title}</Text>
          <Text className="text-[15px] text-[#F4EFE3]/75 text-center leading-[22px] px-2">{current.body}</Text>
        </View>

        {/* Dots */}
        <View className="flex-row justify-center gap-2 mb-5">
          {STEPS.map((_, i) => (
            <View
              key={i}
              className="h-[6px] rounded-full"
              style={{ width: i === step ? 20 : 6, backgroundColor: i === step ? T.lime : "rgba(244,239,227,0.3)" }}
            />
          ))}
        </View>

        <TouchableOpacity
          className="bg-lime rounded-[14px] py-4 items-center"
          onPress={() => (isLast ? finish() : setStep(step + 1))}
          activeOpacity={0.9}
        >
          <Text className="text-forest font-bold text-[16px]">{isLast ? "Empezar" : "Siguiente"}</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}
