import { useState } from "react";
import { View, TouchableOpacity, ScrollView, Text } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { T } from "@/constants/tokens";

type OfferMode = "dedicada" | "colaborativa";

type OfferSelectionScreenProps = {
  origin: string;
  destination: string;
  packageLabel: string;
  initialMode?: OfferMode;
  onBack: () => void;
  onNext: (mode: OfferMode) => void;
};

function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <View className="flex-row gap-[6px] items-center">
      {Array.from({ length: total }).map((_, i) => {
        const active = i === current - 1;
        return (
          <View
            key={i}
            className="h-[6px] rounded-[4px]"
            style={{ width: active ? 18 : 6, backgroundColor: i < current ? T.forest : T.border }}
          />
        );
      })}
      <Text className="text-[10px] tracking-[1.5px] text-inkMute ml-1">
        {String(current).padStart(2, "0")}/{String(total).padStart(2, "0")}
      </Text>
    </View>
  );
}

function MiniMapView({ origin, destination }: { origin: string; destination: string }) {
  return (
    <View className="h-[120px] rounded-[18px] border border-border bg-bgDeep overflow-hidden">
      {[26, 52, 78, 104].map((y) => (
        <View key={y} className="absolute left-0 right-0 h-px bg-[#E0D4B0]" style={{ top: y }} />
      ))}
      {[48, 96, 160, 224, 288].map((x) => (
        <View key={x} className="absolute top-0 bottom-0 w-px bg-[#E0D4B0]" style={{ left: x }} />
      ))}
      <View className="absolute left-0 right-0 h-[6px] bg-[#D8C99B]" style={{ top: 52 }} />
      <View className="absolute rounded-[3px] bg-[#D5E6C8]" style={{ top: 12, left: 24, width: 48, height: 28 }} />
      <View className="absolute rounded-[3px] bg-[#D5E6C8]" style={{ top: 68, right: 40, width: 42, height: 30 }} />

      <View
        className="absolute w-[14px] h-[14px] rounded-full bg-[#F4EFE3] border-[3px] border-forest"
        style={{ bottom: 20, left: 36 }}
      />
      <View
        className="absolute w-[13px] h-[13px] rounded-[2px] bg-emerald"
        style={{ top: 22, right: 60, transform: [{ rotate: "45deg" }] }}
      />

      <View
        className="absolute top-[10px] right-[10px] rounded-lg px-2 py-[3px]"
        style={{ backgroundColor: "rgba(244,239,227,0.92)" }}
      >
        <Text className="text-[9px] tracking-[1.2px] text-ink">AMBA · CABA</Text>
      </View>
    </View>
  );
}

export function OfferSelectionScreen({
  origin, destination, packageLabel, initialMode, onBack, onNext,
}: OfferSelectionScreenProps) {
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<OfferMode>(initialMode ?? "colaborativa");

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      {/* Step header */}
      <View className="flex-row items-center justify-between px-5 pt-2 pb-1">
        <TouchableOpacity
          className="w-[38px] h-[38px] rounded-xl border border-border bg-card items-center justify-center"
          onPress={onBack}
          hitSlop={10}
        >
          <MaterialCommunityIcons name="arrow-left" size={18} color={T.ink} />
        </TouchableOpacity>
        <StepDots current={3} total={4} />
        <View className="w-[38px] h-[38px] rounded-xl border border-border bg-card items-center justify-center">
          <MaterialCommunityIcons name="creation" size={16} color={T.ink} />
        </View>
      </View>

      <View className="px-5 pt-1 pb-[14px]">
        <Text className="text-[10px] tracking-[2.5px] text-emeraldDeep uppercase mb-1">PASO 03 · OFERTA</Text>
        <Text className="text-[26px] font-bold text-ink tracking-[-0.8px] leading-[30px]">Elegí cómo{"\n"}querés enviar</Text>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, gap: 10, paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      >
        <MiniMapView origin={origin} destination={destination} />

        {/* Route card */}
        <View className="bg-card rounded-[18px] border border-border p-[14px]">
          <View className="flex-row items-center gap-[10px]">
            <View className="items-center w-3">
              <View className="w-3 h-3 rounded-full border-2 border-forest bg-card" />
              <View className="my-0.5" style={{ width: 1.5, height: 16, backgroundColor: T.inkFaint, opacity: 0.5 }} />
              <View
                className="w-[10px] h-[10px] rounded-[2px] bg-emerald"
                style={{ transform: [{ rotate: "45deg" }] }}
              />
            </View>
            <View className="flex-1">
              <Text className="text-[9px] tracking-[1.5px] text-inkMute uppercase">RETIRO</Text>
              <Text className="text-[13px] font-medium text-ink" numberOfLines={1}>{origin}</Text>
              <View className="h-2" />
              <Text className="text-[9px] tracking-[1.5px] text-inkMute uppercase">ENTREGA</Text>
              <Text className="text-[13px] font-medium text-ink" numberOfLines={1}>{destination}</Text>
            </View>
            <View
              className="pl-3 ml-2 items-end"
              style={{ borderLeftWidth: 1, borderLeftColor: T.borderSoft }}
            >
              <Text className="text-[18px] font-bold text-ink tracking-[-0.5px]">
                6.4<Text className="text-[11px] font-medium text-inkMute">km</Text>
              </Text>
              <Text className="text-[9px] tracking-[1.2px] text-inkMute uppercase mt-0.5">DISTANCIA</Text>
            </View>
          </View>
        </View>

        {/* Dedicada card */}
        <TouchableOpacity
          className="bg-card rounded-[20px] p-4"
          style={{ borderWidth: 1, borderColor: selected === "dedicada" ? T.forest : T.border }}
          onPress={() => setSelected("dedicada")}
          activeOpacity={0.82}
        >
          <View className="flex-row justify-between items-start mb-3">
            <View>
              <Text className="text-[9px] tracking-[1.5px] text-inkMute uppercase mb-1">OPCIÓN A · DEDICADA</Text>
              <Text className="text-[22px] font-bold text-ink tracking-[-0.6px] leading-6">Sólo tu envío</Text>
              <Text className="text-[12.5px] text-inkMute mt-1">El cadete va directo, sin paradas.</Text>
            </View>
            <View className="items-end">
              <Text className="text-[22px] font-bold text-ink tracking-[-0.8px] leading-6">$6.900</Text>
              <Text className="text-[9px] tracking-[1px] text-inkMute mt-0.5">ARS · INCL.</Text>
            </View>
          </View>
          <View className="flex-row gap-[14px] pt-[10px] border-t border-borderSoft">
            {[
              { icon: "clock-outline" as const,     label: "28 min"     },
              { icon: "map-marker-path" as const,   label: "Directo"    },
              { icon: "shield-outline" as const,    label: "Asegurado"  },
            ].map((s) => (
              <View key={s.label} className="flex-row items-center gap-[5px]">
                <MaterialCommunityIcons name={s.icon} size={14} color={T.inkSoft} />
                <Text className="text-xs text-inkSoft font-medium">{s.label}</Text>
              </View>
            ))}
          </View>
          {selected === "dedicada" && (
            <View className="absolute top-[10px] left-[10px] w-5 h-5 rounded-full bg-forest items-center justify-center">
              <MaterialCommunityIcons name="check" size={12} color="#fff" />
            </View>
          )}
        </TouchableOpacity>

        {/* Colaborativa card — featured */}
        <TouchableOpacity
          className="bg-forest rounded-[20px] p-4 overflow-hidden"
          style={{ shadowColor: T.forest, shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.35, shadowRadius: 24, elevation: 8 }}
          onPress={() => setSelected("colaborativa")}
          activeOpacity={0.85}
        >
          <View className="absolute top-[-30px] right-[-30px] w-[160px] h-[160px] rounded-full bg-lime opacity-[0.14]" />

          <View className="absolute top-3 right-3 bg-lime rounded-md px-2 py-1">
            <Text className="text-[9px] tracking-[1.5px] font-bold text-forest uppercase">ECO · RECOMENDADO</Text>
          </View>

          <Text className="text-[9px] tracking-[1.5px] uppercase mb-1" style={{ color: "rgba(244,239,227,0.55)" }}>
            OPCIÓN B · COLABORATIVA
          </Text>
          <Text className="text-[26px] font-bold text-[#F4EFE3] tracking-[-0.8px] leading-7 mb-[6px]">Compartí el viaje</Text>
          <Text className="text-[13px] leading-[18px] mb-4 max-w-[90%]" style={{ color: "rgba(244,239,227,0.72)" }}>
            Un cadete pasa cerca y suma tu paquete. Más barato y mucho menos CO₂.
          </Text>

          <View className="flex-row items-end gap-[10px] mb-[14px]">
            <Text className="text-[38px] font-bold text-[#F4EFE3] tracking-[-1.2px] leading-[38px]">$3.900</Text>
            <View className="pb-1">
              <Text className="text-[11px] line-through" style={{ color: "rgba(244,239,227,0.45)" }}>$6.900</Text>
              <Text className="text-[9px] tracking-[1.5px] text-lime font-bold uppercase">−43% MÁS BARATO</Text>
            </View>
          </View>

          <View className="flex-row gap-[10px]">
            <View
              className="flex-1 rounded-xl p-[10px]"
              style={{ backgroundColor: "rgba(244,239,227,0.08)", borderWidth: 1, borderColor: "rgba(244,239,227,0.1)" }}
            >
              <Text className="text-[9px] tracking-[1px] uppercase" style={{ color: "rgba(244,239,227,0.5)" }}>TIEMPO</Text>
              <Text className="text-[17px] font-bold text-[#F4EFE3] mt-0.5 tracking-[-0.4px]">54 min</Text>
            </View>
            <View
              className="flex-1 rounded-xl p-[10px]"
              style={{ backgroundColor: "rgba(163,230,53,0.14)", borderWidth: 1, borderColor: "rgba(163,230,53,0.3)" }}
            >
              <Text className="text-[9px] tracking-[1px] text-lime uppercase">AHORRO CO₂</Text>
              <Text className="text-[17px] font-bold text-lime mt-0.5 tracking-[-0.4px]">−1.8 kg</Text>
            </View>
          </View>

          {selected === "colaborativa" && (
            <View className="absolute top-[10px] left-[10px] w-5 h-5 rounded-full bg-lime items-center justify-center">
              <MaterialCommunityIcons name="check" size={12} color={T.forest} />
            </View>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Sticky CTA */}
      <View className="absolute bottom-0 left-0 right-0 px-4 pt-4 bg-bg border-t border-border" style={{ paddingBottom: insets.bottom + 16 }}>
        <TouchableOpacity
          className="bg-forest rounded-2xl py-4 flex-row items-center justify-center gap-[10px]"
          style={{ shadowColor: T.forest, shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.4, shadowRadius: 20, elevation: 6 }}
          onPress={() => onNext(selected)}
          activeOpacity={0.87}
        >
          <Text className="text-[#F4EFE3] text-[15px] font-semibold">
            {selected === "colaborativa" ? "Continuar con Colaborativa" : "Continuar con Dedicada"}
          </Text>
          <MaterialCommunityIcons name="arrow-right" size={18} color="#F4EFE3" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
