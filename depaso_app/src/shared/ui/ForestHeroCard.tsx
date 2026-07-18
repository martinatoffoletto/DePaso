import { View, Text } from "react-native";
import { ForestGradient } from "./ForestGradient";

/**
 * Card verde "hero" con las franjas diagonales decorativas (la "ruta").
 * La usan el home del sender y el perfil; el contenido lo pone cada pantalla.
 *
 * Importante: acá se usa Text de react-native (no react-native-paper) con
 * colores por style — el Text de paper aplica el color oscuro de su tema y
 * pisa los colores por className, dejando el texto ilegible sobre verde.
 */
export function ForestHeroCard({
  stripes = "bottom",
  className = "",
  children,
}: {
  /** Dónde van las franjas decorativas: arriba (home) o abajo (perfil). */
  stripes?: "top" | "bottom";
  /** Margen/padding/radio específicos de cada pantalla. */
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <View className={`bg-forest overflow-hidden ${className}`}>
      <ForestGradient />
      {stripes === "top" ? (
        <>
          <View
            className="absolute h-4 rounded-lg bg-white/5"
            style={{ top: 40, left: -20, right: -20, transform: [{ rotate: "-6deg" }] }}
          />
          <View
            className="absolute h-4 rounded-lg"
            style={{ top: 62, left: -20, right: -20, backgroundColor: "rgba(255,255,255,0.04)", transform: [{ rotate: "-6deg" }] }}
          />
        </>
      ) : (
        <>
          <View className="absolute bottom-7 -left-5 -right-5 h-5 rounded-[10px] bg-white/5 -rotate-3" />
          <View className="absolute bottom-2 -left-5 -right-5 h-5 rounded-[10px] bg-white/[0.04] -rotate-3" />
        </>
      )}
      {children}
    </View>
  );
}

/** Fila de estadísticas del hero (envíos / CO₂ / reputación). */
export function HeroStatsRow({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return <View className={`flex-row ${className}`}>{children}</View>;
}

/**
 * Una celda de la fila de stats: valor grande + label chiquito en mayúsculas.
 * `divider` dibuja el borde derecho (todas menos la última).
 */
export function HeroStat({
  value,
  label,
  divider = false,
  valueColor = "#F4EFE3",
  trailing,
}: {
  value: React.ReactNode;
  label: string;
  divider?: boolean;
  /** Color del valor (ej. T.lime para CO₂). */
  valueColor?: string;
  /** Elemento a la derecha del valor (ej. estrellita de reputación). */
  trailing?: React.ReactNode;
}) {
  const valueText = (
    <Text className="text-[22px] font-bold tracking-[-0.5px]" style={{ color: valueColor }}>
      {value}
    </Text>
  );
  return (
    <View
      className={`flex-1 ${divider ? "pr-[10px] mr-[14px]" : ""}`}
      style={divider ? { borderRightWidth: 1, borderRightColor: "rgba(244,239,227,0.12)" } : undefined}
    >
      {trailing ? (
        <View className="flex-row items-center gap-1">
          {valueText}
          {trailing}
        </View>
      ) : (
        valueText
      )}
      <Text className="text-[9px] tracking-[1.5px] uppercase mt-[2px]" style={{ color: "rgba(244,239,227,0.8)" }}>
        {label}
      </Text>
    </View>
  );
}

/** Sufijo de unidad dentro del valor de un HeroStat (ej. "kg"). */
export function HeroStatUnit({ children }: { children: React.ReactNode }) {
  return <Text className="text-xs font-normal" style={{ color: "#F4EFE3" }}>{children}</Text>;
}
