import { useMemo, useRef, useState } from "react";
import {
  View,
  Modal,
  Image,
  TouchableOpacity,
  PanResponder,
  TextInput,
  LayoutChangeEvent,
} from "react-native";
import { Text } from "react-native-paper";
import Svg, { Line, Rect } from "react-native-svg";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { T } from "@/constants/tokens";
import {
  REFERENCES,
  ReferenceId,
  Point,
  estimateDimensions,
  DimensionEstimate,
} from "@/src/sender/dimensioning";

const CAT_LABEL: Record<string, string> = {
  s: "Pequeño / Documentos",
  m: "Carga mediana",
  l: "Grande / Voluminoso",
  xl: "Mudanza / Flete",
};

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

/** A draggable handle positioned in the overlay's coordinate space. */
function DraggableDot({
  point,
  onChange,
  color,
  bounds,
}: {
  point: Point;
  onChange: (p: Point) => void;
  color: string;
  bounds: { w: number; h: number };
}) {
  const pointRef = useRef(point);
  pointRef.current = point;
  const start = useRef(point);

  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          start.current = pointRef.current;
        },
        onPanResponderMove: (_evt, g) => {
          onChange({
            x: clamp(start.current.x + g.dx, 0, bounds.w),
            y: clamp(start.current.y + g.dy, 0, bounds.h),
          });
        },
      }),
    [onChange, bounds.w, bounds.h],
  );

  const R = 16;
  return (
    <View
      {...responder.panHandlers}
      style={{
        position: "absolute",
        left: point.x - R,
        top: point.y - R,
        width: R * 2,
        height: R * 2,
        borderRadius: R,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <View
        style={{
          width: 16,
          height: 16,
          borderRadius: 8,
          backgroundColor: color,
          borderWidth: 3,
          borderColor: "#fff",
        }}
      />
    </View>
  );
}

type Props = {
  photoUri: string;
  onClose: () => void;
  onResult: (estimate: DimensionEstimate) => void;
};

export function DimensioningModal({ photoUri, onClose, onResult }: Props) {
  const insets = useSafeAreaInsets();
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [refId, setRefId] = useState<ReferenceId>("card");
  const [customCm, setCustomCm] = useState("");

  // Reference line + package diagonal, initialised once the canvas is measured.
  const [refA, setRefA] = useState<Point>({ x: 0, y: 0 });
  const [refB, setRefB] = useState<Point>({ x: 0, y: 0 });
  const [boxA, setBoxA] = useState<Point>({ x: 0, y: 0 });
  const [boxB, setBoxB] = useState<Point>({ x: 0, y: 0 });
  const [placed, setPlaced] = useState(false);

  const onCanvasLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setBox({ w: width, h: height });
    if (!placed && width > 0 && height > 0) {
      setRefA({ x: width * 0.25, y: height * 0.82 });
      setRefB({ x: width * 0.6, y: height * 0.82 });
      setBoxA({ x: width * 0.3, y: height * 0.25 });
      setBoxB({ x: width * 0.7, y: height * 0.6 });
      setPlaced(true);
    }
  };

  const refObj = REFERENCES.find((r) => r.id === refId)!;
  const refRealCm = refId === "custom" ? parseFloat(customCm) || 0 : refObj.realCm ?? 0;

  const estimate = useMemo(
    () => (refRealCm > 0 ? estimateDimensions(refRealCm, refA, refB, boxA, boxB) : null),
    [refRealCm, refA, refB, boxA, boxB],
  );

  const rectX = Math.min(boxA.x, boxB.x);
  const rectY = Math.min(boxA.y, boxB.y);
  const rectW = Math.abs(boxA.x - boxB.x);
  const rectH = Math.abs(boxA.y - boxB.y);

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
        {/* Header */}
        <View className="flex-row items-center justify-between px-5 py-3">
          <TouchableOpacity onPress={onClose} hitSlop={10}>
            <MaterialCommunityIcons name="close" size={24} color={T.ink} />
          </TouchableOpacity>
          <Text className="text-[15px] font-bold text-ink">Medir con referencia</Text>
          <View style={{ width: 24 }} />
        </View>

        <Text className="text-[12.5px] text-inkMute px-5 mb-2 leading-[17px]">
          Marcá el largo de la referencia (azul) y encuadrá el paquete (verde). Estimamos el tamaño
          real para sugerirte la categoría.
        </Text>

        {/* Reference picker */}
        <View className="flex-row gap-2 px-5 mb-1">
          {REFERENCES.map((r) => (
            <TouchableOpacity
              key={r.id}
              onPress={() => setRefId(r.id)}
              className={`px-3 py-[7px] rounded-lg border ${refId === r.id ? "border-forest bg-forest" : "border-border bg-card"}`}
              activeOpacity={0.8}
            >
              <Text className={`text-xs font-semibold ${refId === r.id ? "text-white" : "text-inkMute"}`}>
                {r.label}
              </Text>
            </TouchableOpacity>
          ))}
          {refId === "custom" && (
            <View className="flex-row items-center border border-border bg-card rounded-lg px-2">
              <TextInput
                value={customCm}
                onChangeText={setCustomCm}
                keyboardType="numeric"
                placeholder="cm"
                placeholderTextColor={T.inkMute}
                className="text-sm text-ink w-12 py-[6px]"
              />
              <Text className="text-xs text-inkMute">cm</Text>
            </View>
          )}
        </View>
        <Text className="text-[11px] text-inkMute px-5 mb-2">{refObj.hint}</Text>

        {/* Canvas: photo + overlay */}
        <View className="mx-4 rounded-2xl overflow-hidden border border-border" style={{ flex: 1 }}>
          <View style={{ flex: 1 }} onLayout={onCanvasLayout}>
            <Image source={{ uri: photoUri }} style={{ width: "100%", height: "100%" }} resizeMode="contain" />
            {placed && (
              <Svg style={{ position: "absolute", width: "100%", height: "100%" }}>
                <Line x1={refA.x} y1={refA.y} x2={refB.x} y2={refB.y} stroke="#2563EB" strokeWidth={3} strokeDasharray="2 0" />
                <Rect x={rectX} y={rectY} width={rectW} height={rectH} stroke={T.forest} strokeWidth={3} fill="rgba(45,90,61,0.12)" />
              </Svg>
            )}
            {placed && (
              <>
                <DraggableDot point={refA} onChange={setRefA} color="#2563EB" bounds={box} />
                <DraggableDot point={refB} onChange={setRefB} color="#2563EB" bounds={box} />
                <DraggableDot point={boxA} onChange={setBoxA} color={T.forest} bounds={box} />
                <DraggableDot point={boxB} onChange={setBoxB} color={T.forest} bounds={box} />
              </>
            )}
          </View>
        </View>

        {/* Result + CTA */}
        <View className="px-5 pt-3" style={{ paddingBottom: insets.bottom + 12 }}>
          <View className="bg-card rounded-2xl border border-border p-4 mb-3">
            {estimate ? (
              <>
                <Text className="text-[13px] text-inkMute">Tamaño estimado (cara visible)</Text>
                <Text className="text-2xl font-bold text-ink tracking-[-0.6px] mt-1">
                  ≈ {estimate.widthCm} × {estimate.heightCm} cm
                </Text>
                <Text className="text-[13px] text-forest font-semibold mt-1">
                  Categoría sugerida: {CAT_LABEL[estimate.category]}
                </Text>
              </>
            ) : (
              <Text className="text-[13px] text-inkMute">
                {refId === "custom" && refRealCm <= 0
                  ? "Ingresá los cm de tu objeto de referencia."
                  : "Ajustá los puntos sobre la foto para estimar el tamaño."}
              </Text>
            )}
          </View>

          <TouchableOpacity
            className="flex-row bg-forest rounded-[14px] py-4 items-center justify-center gap-[10px]"
            style={{ opacity: estimate ? 1 : 0.5 }}
            onPress={() => estimate && onResult(estimate)}
            disabled={!estimate}
            activeOpacity={0.88}
          >
            <MaterialCommunityIcons name="check-circle-outline" size={20} color="#fff" />
            <Text className="text-[#F4EFE3] font-bold text-[16px]">Usar esta estimación</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
