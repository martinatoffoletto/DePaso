import { useEffect, useState } from "react";
import { reverseGeocode } from "@/src/shared/utils/geocoding";

/** Reverse-geocodea coordenadas a una dirección legible, con las coords como placeholder. */
export function useAddress(lat: number, lon: number): string {
  const [addr, setAddr] = useState(`${lat.toFixed(3)}, ${lon.toFixed(3)}`);
  useEffect(() => {
    let alive = true;
    reverseGeocode(lat, lon).then((r) => { if (alive) setAddr(r); });
    return () => { alive = false; };
  }, [lat, lon]);
  return addr;
}
