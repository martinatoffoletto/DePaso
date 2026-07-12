/*
  Autocomplete de direcciones contra Photon (Komoot / OSM, sin rate-limit).
  Port del helper de la app móvil (depaso_app/src/shared/utils/addressSearch.ts)
  para que la pyme cargue direcciones reales en vez de coordenadas crudas.

  Photon solo soporta lang: default | de | en | fr — nunca pasar "es".
*/

export interface AddressSuggestion {
  id: string;
  label: string; // "Av. Corrientes 1234"
  sublabel: string; // "Balvanera (C1043)"
  lat: number;
  lon: number;
}

interface PhotonFeature {
  geometry: { coordinates: [number, number] };
  properties?: {
    osm_id?: number;
    countrycode?: string;
    name?: string;
    street?: string;
    housenumber?: string;
    district?: string;
    locality?: string;
    city?: string;
    county?: string;
    postcode?: string;
  };
}

export async function searchAddresses(query: string): Promise<AddressSuggestion[]> {
  if (query.trim().length < 3) return [];
  const params = new URLSearchParams({
    q: `${query} Buenos Aires`,
    limit: "7",
    lat: "-34.6118",
    lon: "-58.4173",
  });
  const controller = new AbortController();
  const tid = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(`https://photon.komoot.io/api/?${params}`, {
      signal: controller.signal,
    });
    clearTimeout(tid);
    if (!res.ok) return [];
    const data: { features?: PhotonFeature[] } = await res.json();
    const seen = new Set<string>();
    const out: AddressSuggestion[] = [];
    for (const f of data.features ?? []) {
      const p = f.properties ?? {};
      if ((p.countrycode ?? "AR").toUpperCase() !== "AR") continue;
      const lat = f.geometry.coordinates[1];
      const lon = f.geometry.coordinates[0];
      const key = `${lat.toFixed(3)},${lon.toFixed(3)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const street = [p.street, p.housenumber].filter(Boolean).join(" ");
      const neighborhood = p.district ?? p.locality ?? "";
      const postcode = p.postcode ? `(${p.postcode})` : "";
      out.push({
        id: String(p.osm_id ?? key),
        label: street || p.name || p.city || "Buenos Aires",
        sublabel: [neighborhood || (p.city ?? p.county), postcode]
          .filter(Boolean)
          .join(" "),
        lat,
        lon,
      });
      if (out.length >= 5) break;
    }
    return out;
  } catch {
    clearTimeout(tid);
    return [];
  }
}
