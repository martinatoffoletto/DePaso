import { useEffect, useRef, useState } from "react";
import { Animated, Text, type StyleProp, type TextStyle } from "react-native";
import { useReducedMotion } from "react-native-reanimated";

/**
 * Número que "sube" hasta su valor al montar y cuando cambia (contador animado).
 * Renderiza un Text nativo, así que acepta `className`/`style` como cualquier texto.
 * Respeta reduce motion: salta directo al valor final.
 */
export function AnimatedCounter({
  value,
  format = (n) => String(Math.round(n)),
  duration = 750,
  className,
  style,
}: {
  value: number;
  /** Cómo formatear el número intermedio (ej. `money`). */
  format?: (n: number) => string;
  duration?: number;
  className?: string;
  style?: StyleProp<TextStyle>;
}) {
  const reduced = useReducedMotion();
  const anim = useRef(new Animated.Value(value)).current;
  const prev = useRef(value);
  // format es una prop que suele ser inline: la leemos por ref para no reiniciar
  // la animación en cada render.
  const fmt = useRef(format);
  fmt.current = format;
  const [display, setDisplay] = useState(() => format(value));

  useEffect(() => {
    if (reduced) {
      setDisplay(fmt.current(value));
      prev.current = value;
      return;
    }
    anim.setValue(prev.current);
    const id = anim.addListener(({ value: v }) => setDisplay(fmt.current(v)));
    const animation = Animated.timing(anim, { toValue: value, duration, useNativeDriver: false });
    animation.start();
    prev.current = value;
    return () => {
      animation.stop();
      anim.removeListener(id);
    };
  }, [value, duration, reduced, anim]);

  return (
    <Text className={className} style={style}>
      {display}
    </Text>
  );
}
