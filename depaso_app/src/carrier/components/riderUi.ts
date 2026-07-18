/** Formato de plata del rider ($ redondeado, es-AR). */
export function money(n: number): string {
  return `$${Math.round(n).toLocaleString("es-AR")}`;
}
