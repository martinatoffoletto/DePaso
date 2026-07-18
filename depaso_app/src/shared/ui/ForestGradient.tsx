import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet } from "react-native";
import { T } from "@/constants/tokens";

/**
 * Relleno diagonal en verdes de marca — se suelta como primer hijo de cualquier
 * contenedor con `overflow-hidden` para darle profundidad a un hero forest.
 * Los hijos siguientes pintan por encima (queda en position absolute).
 */
export function ForestGradient({
  colors = [T.forestMid, T.forest, T.forestDeep],
}: {
  colors?: readonly [string, string, ...string[]];
}) {
  return (
    <LinearGradient
      colors={colors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={StyleSheet.absoluteFill}
    />
  );
}
