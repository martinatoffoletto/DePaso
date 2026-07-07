/**
 * Everyday equivalences of saved CO2, for per-shipment feedback.
 *
 * Same factors the backend uses for the accumulated impact screen, so the
 * per-shipment number and the accumulated total stay consistent:
 *   - average car: 0.18 kg CO2/km
 *   - urban tree:  21 kg CO2/year (FAO/EPA)
 *   - phone charge: 0.008 kg CO2 (EPA)
 */
export const CAR_KG_PER_KM = 0.18;
export const TREE_KG_PER_YEAR = 21.0;
export const SMARTPHONE_KG_PER_CHARGE = 0.008;

/** Kilometres in an average car that this CO2 saving avoids. */
export function carKmFromCo2(kg: number): number {
  return (kg || 0) / CAR_KG_PER_KM;
}

export function treeMonthsFromCo2(kg: number): number {
  return ((kg || 0) / TREE_KG_PER_YEAR) * 12;
}

export function phoneChargesFromCo2(kg: number): number {
  return Math.round((kg || 0) / SMARTPHONE_KG_PER_CHARGE);
}

/**
 * Short, relatable one-liner for a per-shipment CO2 saving. "km en auto" is the
 * most intuitive equivalence for the small values of a single shipment.
 */
export function co2EquivalenceLabel(kg: number): string {
  const km = carKmFromCo2(kg);
  return `≈ ${km.toFixed(1)} km en auto no recorridos`;
}
