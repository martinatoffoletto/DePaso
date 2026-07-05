import Svg, { Circle, Path } from "react-native-svg";

type MotoIconProps = {
  size?: number;
  color?: string;
  strokeWidth?: number;
};

/**
 * Custom motorcycle glyph — more characteristic of the cadete than a generic truck.
 * Ported from the rider mockup (screens/rider.jsx) to react-native-svg.
 */
export function MotoIcon({ size = 22, color = "currentColor", strokeWidth = 2 }: MotoIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx="5.5" cy="17" r="3.5" />
      <Circle cx="18.5" cy="17" r="3.5" />
      <Path d="M 14 5h3l2 5" />
      <Path d="M 5.5 17l4-6h6l3 6" />
      <Path d="M 11 11l-2-3h-3" />
    </Svg>
  );
}
