import { View } from "react-native";
import { T } from "@/constants/tokens";

/** Esquinas estilo "escáner" que enmarcan la foto del paquete. */
export function ScanCorners({ color = T.emerald }: { color?: string }) {
  const corners: { top?: number; bottom?: number; left?: number; right?: number }[] = [
    { top: 0, left: 0 }, { top: 0, right: 0 }, { bottom: 0, left: 0 }, { bottom: 0, right: 0 },
  ];
  return (
    <>
      {corners.map((pos, i) => (
        <View key={i} style={[{
          position: "absolute", width: 20, height: 20, borderColor: color,
          borderTopWidth:    pos.top    !== undefined ? 2.5 : 0,
          borderBottomWidth: pos.bottom !== undefined ? 2.5 : 0,
          borderLeftWidth:   pos.left   !== undefined ? 2.5 : 0,
          borderRightWidth:  pos.right  !== undefined ? 2.5 : 0,
          borderTopLeftRadius:    i === 0 ? 6 : 0,
          borderTopRightRadius:   i === 1 ? 6 : 0,
          borderBottomLeftRadius: i === 2 ? 6 : 0,
          borderBottomRightRadius: i === 3 ? 6 : 0,
        }, pos]} />
      ))}
    </>
  );
}
