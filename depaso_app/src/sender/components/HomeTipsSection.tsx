import { View, ScrollView, TouchableOpacity, Text } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { T } from "@/constants/tokens";

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>["name"];

const CARD_W = 250;

function TipRow({ icon, bold, text }: { icon: IconName; bold: string; text: string }) {
  return (
    <View className="flex-row items-start gap-[8px]">
      <View className="w-6 h-6 rounded-lg bg-mint items-center justify-center mt-px shrink-0">
        <MaterialCommunityIcons name={icon} size={13} color={T.forest} />
      </View>
      <Text className="flex-1 text-[11.5px] leading-[16px] text-inkSoft">
        <Text className="font-bold text-ink">{bold}</Text>
        {text}
      </Text>
    </View>
  );
}

function TipCard({ tag, title, onPress, children }: {
  tag: string;
  title: string;
  onPress?: () => void;
  children: React.ReactNode;
}) {
  return (
    <TouchableOpacity
      className="bg-card rounded-[18px] border border-border p-[14px] gap-[10px]"
      style={{ width: CARD_W }}
      onPress={onPress}
      activeOpacity={onPress ? 0.82 : 1}
      disabled={!onPress}
    >
      <Text className="text-[9px] tracking-[1.5px] text-emeraldDeep uppercase">{tag}</Text>
      <Text className="text-[15px] font-bold text-ink tracking-[-0.3px] -mt-1">{title}</Text>
      {children}
    </TouchableOpacity>
  );
}

/** Carrusel de tips del home — explica modalidades, retiro programado e IA. */
export function HomeTipsSection({ onStartFlow, onAddPhoto }: {
  onStartFlow: () => void;
  onAddPhoto: () => void;
}) {
  return (
    <View>
      <Text className="text-[15px] font-semibold text-ink tracking-[-0.3px] mb-[10px]">Conocé DePaso</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 10, paddingRight: 4 }}
        decelerationRate="fast"
        snapToInterval={CARD_W + 10}
      >
        <TipCard tag="MODALIDADES" title="¿Colaborativa o dedicada?">
          <TipRow
            icon="account-group-outline"
            bold="Colaborativa · "
            text="tu paquete comparte viaje con otros. Pagás menos y ahorrás CO₂."
          />
          <TipRow
            icon="lightning-bolt"
            bold="Dedicada · "
            text="un cadete exclusivo para tu envío. Ideal para urgencias."
          />
        </TipCard>

        <TipCard tag="PROGRAMÁ" title="Retiro cuando quieras" onPress={onStartFlow}>
          <TipRow
            icon="clock-outline"
            bold="Inmediato, franja u hora exacta · "
            text="hoy o el día que elijas, al crear el envío."
          />
          <TipRow
            icon="map-marker-path"
            bold="Franja horaria · "
            text="lo lleva un cadete que ya pasa por tu zona."
          />
        </TipCard>

        <TipCard tag="VISIÓN ARTIFICIAL" title="La IA mide por vos" onPress={onAddPhoto}>
          <TipRow
            icon="camera-outline"
            bold="Sacale una foto · "
            text="estimamos el tamaño del paquete automáticamente."
          />
          <TipRow
            icon="creation"
            bold="Sin reglas ni balanza · "
            text="podés ajustar la categoría antes de confirmar."
          />
        </TipCard>

        <TipCard tag="VOLUMEN" title="¿Mudanza o algo grande?">
          <TipRow
            icon="truck-outline"
            bold="Envíos XL · "
            text="viajan siempre en modalidad dedicada, con vehículo acorde."
          />
          <TipRow
            icon="sofa-outline"
            bold="Fletes y mudanzas · "
            text="cotizá igual que un envío común, nosotros hacemos el resto."
          />
        </TipCard>
      </ScrollView>
    </View>
  );
}
