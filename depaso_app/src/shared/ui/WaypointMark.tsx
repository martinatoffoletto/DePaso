import { View } from "react-native";
import { T } from "@/constants/tokens";

/** Marca de la landing: origen, puntitos de ruta y pin de destino. */
export function WaypointMark({ size = 68 }: { size?: number }) {
  const s = size;
  return (
    <View style={{ width: s, height: s, alignItems: "center", justifyContent: "center", position: "relative" }}>
      {/* Origin ring */}
      <View style={{
        position: "absolute", bottom: 6, left: s * 0.18,
        width: s * 0.18, height: s * 0.18, borderRadius: s * 0.09,
        backgroundColor: "#F4EFE3",
      }} />
      <View style={{
        position: "absolute", bottom: 6, left: s * 0.18 + s * 0.05,
        width: s * 0.08, height: s * 0.08, borderRadius: s * 0.04,
        backgroundColor: T.forest,
      }} />
      {/* Route dots */}
      {[0, 1, 2, 3].map((i) => (
        <View key={i} style={{
          position: "absolute",
          bottom: s * 0.18 + i * s * 0.09,
          left: s * 0.22 + i * s * 0.07,
          width: 4, height: 4, borderRadius: 2,
          backgroundColor: "rgba(244,239,227,0.5)",
        }} />
      ))}
      {/* Destination pin */}
      <View style={{
        position: "absolute", top: 6, right: s * 0.1,
        width: s * 0.32, height: s * 0.32, borderRadius: s * 0.16,
        backgroundColor: T.lime,
        alignItems: "center", justifyContent: "center",
      }}>
        <View style={{ width: s * 0.1, height: s * 0.1, borderRadius: s * 0.05, backgroundColor: T.forest }} />
      </View>
    </View>
  );
}
