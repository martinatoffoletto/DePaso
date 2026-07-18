import { View } from "react-native";
import { Text } from "react-native-paper";

/**
 * Card verde "hero" con las franjas diagonales decorativas (la "ruta").
 * La usan el home del sender y el perfil; el contenido lo pone cada pantalla.
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
  valueClassName = "text-[#F4EFE3]",
  trailing,
}: {
  value: React.ReactNode;
  label: string;
  divider?: boolean;
  /** Color del valor (ej. text-lime para CO₂). */
  valueClassName?: string;
  /** Elemento a la derecha del valor (ej. estrellita de reputación). */
  trailing?: React.ReactNode;
}) {
  return (
    <View className={`flex-1 ${divider ? "border-r border-[#F4EFE3]/[0.12] pr-[10px] mr-[14px]" : ""}`}>
      {trailing ? (
        <View className="flex-row items-center gap-1">
          <Text className={`text-[22px] font-bold tracking-[-0.5px] ${valueClassName}`}>{value}</Text>
          {trailing}
        </View>
      ) : (
        <Text className={`text-[22px] font-bold tracking-[-0.5px] ${valueClassName}`}>{value}</Text>
      )}
      <Text className="text-[9px] tracking-[1.5px] text-[#F4EFE3]/80 uppercase mt-[2px]">{label}</Text>
    </View>
  );
}
