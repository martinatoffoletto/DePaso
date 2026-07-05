import Svg, { Circle, G, Line, Rect } from "react-native-svg";
import { T } from "@/constants/tokens";

/**
 * Decorative stylised city map used as the background of the online rider home
 * and the incoming-offer screen. Ported from screens/rider.jsx (RiderMap).
 * Purely visual — no interaction, no data.
 */
export function RiderMap() {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 390 800" preserveAspectRatio="xMidYMid slice">
      <Rect width="390" height="800" fill="#EFE9D6" />

      {/* parks */}
      <Rect x="40" y="80" width="100" height="50" rx="4" fill="#D5E6C8" />
      <Rect x="220" y="220" width="120" height="70" rx="4" fill="#D5E6C8" />
      <Rect x="30" y="380" width="80" height="60" rx="4" fill="#D5E6C8" />
      <Rect x="230" y="500" width="120" height="40" rx="4" fill="#D5E6C8" />
      <Circle cx="80" cy="640" r="35" fill="#D5E6C8" />

      {/* grid */}
      {Array.from({ length: 36 }).map((_, i) => (
        <Line key={`h${i}`} x1="0" y1={i * 22 + 8} x2="390" y2={i * 22 + 8} stroke="#E0D4B0" strokeWidth="1" />
      ))}
      {Array.from({ length: 12 }).map((_, i) => (
        <Line key={`v${i}`} x1={i * 36 + 12} y1="0" x2={i * 36 + 12} y2="800" stroke="#E0D4B0" strokeWidth="1" />
      ))}

      {/* avenues */}
      <Line x1="0" y1="180" x2="390" y2="180" stroke="#D8C99B" strokeWidth="8" />
      <Line x1="0" y1="420" x2="390" y2="420" stroke="#D8C99B" strokeWidth="8" />
      <Line x1="180" y1="0" x2="180" y2="800" stroke="#D8C99B" strokeWidth="6" />

      {/* other riders (faded) */}
      <G opacity={0.5}>
        <Circle cx="100" cy="260" r="9" fill={T.forestDeep} />
        <Circle cx="260" cy="160" r="9" fill={T.forestDeep} />
        <Circle cx="320" cy="380" r="9" fill={T.forestDeep} />
      </G>

      {/* pending packages — amber dots */}
      <G>
        <Circle cx="140" cy="300" r="14" fill="rgba(232,158,42,0.2)" />
        <Circle cx="140" cy="300" r="8" fill={T.amber} stroke="#F4EFE3" strokeWidth="2" />
      </G>
      <G>
        <Circle cx="240" cy="500" r="14" fill="rgba(232,158,42,0.2)" />
        <Circle cx="240" cy="500" r="8" fill={T.amber} stroke="#F4EFE3" strokeWidth="2" />
      </G>
      <G>
        <Circle cx="80" cy="180" r="14" fill="rgba(232,158,42,0.2)" />
        <Circle cx="80" cy="180" r="8" fill={T.amber} stroke="#F4EFE3" strokeWidth="2" />
      </G>

      {/* my position — big lime with pulse rings */}
      <G>
        <Circle cx="195" cy="340" r="34" fill="rgba(163,230,53,0.18)" />
        <Circle cx="195" cy="340" r="22" fill="rgba(163,230,53,0.3)" />
        <Circle cx="195" cy="340" r="14" fill={T.lime} stroke={T.forest} strokeWidth="3.5" />
        <Circle cx="195" cy="340" r="5" fill={T.forest} />
      </G>
    </Svg>
  );
}
