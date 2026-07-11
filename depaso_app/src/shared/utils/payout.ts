import { PLATFORM_COMMISSION_RATE } from "../types";

/**
 * Lo que el carrier cobra por un envío: el precio menos la comisión de la
 * plataforma (espejo de pricing.carrier_payout del backend). Todas las
 * pantallas del cadete muestran este neto — mostrar el bruto en la oferta
 * y el neto en el resumen hacía que "no cierren" los números.
 */
export const carrierPayout = (gross: number): number =>
  gross * (1 - PLATFORM_COMMISSION_RATE);
