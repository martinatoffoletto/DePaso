import { View, TouchableOpacity, ActivityIndicator, Text } from "react-native";
import { T } from "@/constants/tokens";

function fmtPrice(v: number | undefined): string {
  return v != null ? `$${v.toLocaleString("es-AR")}` : "—";
}

type BadgeTone = "neutral" | "scheduled" | "eco";

type Props = {
  /** "eco" pinta la card destacada (fondo verde, texto claro, precio tachado). */
  variant?: "plain" | "eco";
  selected: boolean;
  /** Atenúa la card sin bloquearla (De paso cuando no hay viajes vivos). */
  dimmed?: boolean;
  onPress: () => void;
  title: string;
  badgeLabel: string;
  badgeTone?: BadgeTone;
  /** Línea secundaria (ETA, nota) bajo el título — la arma la pantalla. */
  meta?: React.ReactNode;
  loading: boolean;
  price: number | undefined;
  /** Precio de referencia tachado (solo variante eco). */
  strikePrice?: number;
  /** Contenido a lo ancho debajo de la fila principal (franja, chip de disponibilidad). */
  children?: React.ReactNode;
};

/**
 * Card de un producto de envío (Ya / Hoy / De paso). Presentacional: la pantalla
 * decide selección, precios y contenido extra. Ver MODALIDADES.md §4.1.
 */
export function ProductOptionCard({
  variant = "plain", selected, dimmed, onPress,
  title, badgeLabel, badgeTone = "neutral", meta,
  loading, price, strikePrice, children,
}: Props) {
  const eco = variant === "eco";
  const ecoActive = eco && selected;

  const containerClass = ecoActive
    ? "bg-forest border-forest"
    : selected
    ? "bg-card border-forest"
    : "bg-card border-border";

  const titleClass = ecoActive ? "text-[#F4EFE3]" : "text-ink";
  const radioBorder = ecoActive ? "border-lime" : selected ? "border-forest" : "border-border";
  const radioDot = eco ? "bg-lime" : "bg-forest";

  const badgeClass =
    badgeTone === "eco"
      ? "bg-lime"
      : badgeTone === "scheduled"
      ? "bg-mint"
      : "bg-bg";
  const badgeTextClass =
    badgeTone === "eco"
      ? "text-forest font-bold"
      : badgeTone === "scheduled"
      ? "text-forest font-bold"
      : "text-inkMute";

  return (
    <TouchableOpacity
      className={`rounded-2xl border-[1.5px] p-3 px-[14px] overflow-hidden ${containerClass}`}
      style={[
        ecoActive
          ? { shadowColor: T.forest, shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.4, shadowRadius: 24, elevation: 5 }
          : undefined,
        dimmed && !selected ? { opacity: 0.72 } : undefined,
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {ecoActive && <View className="absolute -right-[10px] -top-[10px] w-[130px] h-[90px] rounded-[60px] bg-lime opacity-[0.16]" />}

      <View className="flex-row items-center gap-3">
        <View className={`w-[22px] h-[22px] rounded-full border-2 items-center justify-center ${radioBorder}`}>
          {selected && <View className={`w-[10px] h-[10px] rounded-full ${radioDot}`} />}
        </View>

        <View className="flex-1">
          <View className="flex-row items-center gap-[6px] mb-[2px]">
            <Text className={`text-[15px] font-bold tracking-[-0.3px] ${titleClass}`}>{title}</Text>
            <View className={`rounded px-[5px] py-[2px] ${badgeClass}`}>
              <Text className={`text-[8px] tracking-[1px] uppercase ${badgeTextClass}`}>{badgeLabel}</Text>
            </View>
          </View>
          {meta}
        </View>

        <View className="items-end">
          {loading ? (
            <ActivityIndicator size="small" color={ecoActive ? T.lime : T.forest} />
          ) : (
            <>
              <Text className={`text-lg font-bold tracking-[-0.5px] ${ecoActive ? "text-[#F4EFE3]" : "text-ink"}`}>
                {fmtPrice(price)}
              </Text>
              {eco && strikePrice != null && (
                <Text className={`text-[10px] line-through ${ecoActive ? "text-[#F4EFE3]/60" : "text-inkFaint"}`}>
                  {fmtPrice(strikePrice)}
                </Text>
              )}
            </>
          )}
        </View>
      </View>

      {children}
    </TouchableOpacity>
  );
}
