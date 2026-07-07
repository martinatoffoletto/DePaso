/**
 * Monocular scale-from-reference dimensioning.
 *
 * With a known-size object in the same photo, the pixels-per-cm ratio gives a
 * 2D estimate of the package's visible face. Reference and package are measured
 * in the SAME screen coordinates, so the display scale cancels out — no camera
 * calibration or image resolution needed.
 *
 * This is an ASSISTIVE estimate, not exact volumetry: it only sees the visible
 * face (no depth from a single photo). It informs the category suggestion.
 */

export type ReferenceId = "card" | "a4" | "custom";

export interface ReferenceObject {
  id: ReferenceId;
  label: string;
  /** Real length in cm of the side the user marks. Undefined for "custom". */
  realCm?: number;
  hint: string;
}

// Standardized, universally available references.
export const REFERENCES: ReferenceObject[] = [
  { id: "card", label: "Tarjeta", realCm: 8.56, hint: "Lado largo de una tarjeta (débito/SUBE): 8,56 cm" },
  { id: "a4", label: "Hoja A4", realCm: 29.7, hint: "Lado largo de una hoja A4: 29,7 cm" },
  { id: "custom", label: "Otro", hint: "Ingresá los cm del objeto que uses de referencia" },
];

export interface Point {
  x: number;
  y: number;
}

/** Euclidean distance between two screen points (px). */
export function distancePx(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/** cm per on-screen pixel, from the marked reference. Returns 0 if invalid. */
export function scaleCmPerPx(referenceRealCm: number, referencePx: number): number {
  if (!referenceRealCm || !referencePx || referencePx <= 0) return 0;
  return referenceRealCm / referencePx;
}

export interface DimensionEstimate {
  widthCm: number;
  heightCm: number;
  longestCm: number;
  category: "s" | "m" | "l" | "xl";
}

/**
 * Category from the largest estimated visible dimension (documented heuristic).
 * s ≤ 35 cm · m ≤ 60 cm · l ≤ 100 cm · xl > 100 cm.
 */
export function categoryFromLongestCm(longestCm: number): DimensionEstimate["category"] {
  if (longestCm <= 35) return "s";
  if (longestCm <= 60) return "m";
  if (longestCm <= 100) return "l";
  return "xl";
}

/**
 * Estimate package dimensions from the reference length and the package box,
 * all measured in the same screen-coordinate space.
 */
export function estimateDimensions(
  referenceRealCm: number,
  refA: Point,
  refB: Point,
  boxA: Point,
  boxB: Point,
): DimensionEstimate | null {
  const scale = scaleCmPerPx(referenceRealCm, distancePx(refA, refB));
  if (scale <= 0) return null;
  const widthCm = Math.abs(boxA.x - boxB.x) * scale;
  const heightCm = Math.abs(boxA.y - boxB.y) * scale;
  const longestCm = Math.max(widthCm, heightCm);
  if (longestCm <= 0) return null;
  return {
    widthCm: Math.round(widthCm),
    heightCm: Math.round(heightCm),
    longestCm: Math.round(longestCm),
    category: categoryFromLongestCm(longestCm),
  };
}
