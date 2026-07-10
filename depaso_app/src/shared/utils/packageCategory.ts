/**
 * Canonical labels for the 4 package categories (s | m | l | xl).
 * Single source of truth — replaces the per-screen copies that had drifted
 * ("Chico" vs "Pequeño", etc.).
 */
export const PACKAGE_LABEL: Record<string, string> = {
  s: "Pequeño / Documentos",
  m: "Carga mediana",
  l: "Grande / Voluminoso",
  xl: "Mudanza / Flete",
};

export const PACKAGE_LABEL_SHORT: Record<string, string> = {
  s: "Pequeño",
  m: "Mediano",
  l: "Grande",
  xl: "Flete",
};

export const sizeLabel = (category: string): string => PACKAGE_LABEL[category] ?? category;
export const sizeLabelShort = (category: string): string => PACKAGE_LABEL_SHORT[category] ?? category;
