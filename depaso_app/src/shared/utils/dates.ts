/**
 * Fechas del backend: se guardan como UTC naive y llegan SIN sufijo "Z"
 * ("2026-07-18T20:15:00"). `new Date()` interpretaría eso como hora local
 * (UTC-3 en Argentina), corriendo todo 3 horas. Este parser las trata como
 * UTC reales; si el string ya trae zona horaria, la respeta.
 */
export function parseApiDate(iso: string): Date {
  const hasTz = /Z$|[+-]\d{2}:?\d{2}$/.test(iso);
  return new Date(hasTz ? iso : `${iso}Z`);
}
