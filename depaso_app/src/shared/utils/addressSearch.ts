/**
 * Shared address autocomplete against Photon (Komoot / OSM, no rate-limit).
 * Used by the shipper send-flow and the rider publish-trip flow so both
 * roles get the exact same address UX.
 *
 * Photon only supports lang: default | de | en | fr — never pass "es".
 */

export type Suggestion = {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    road?: string;
    house_number?: string;
    neighbourhood?: string;
    suburb?: string;
    city_district?: string;
    city?: string;
    town?: string;
    postcode?: string;
  };
};

export async function searchAddresses(query: string): Promise<Suggestion[]> {
  if (query.length < 3) return [];
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
    const data = await res.json();
    const seen = new Set<string>();
    return (data.features ?? [])
      .filter((f: any) => (f.properties?.countrycode ?? "AR").toUpperCase() === "AR")
      .map((f: any): Suggestion => {
        const p = f.properties ?? {};
        const street = [p.street, p.housenumber].filter(Boolean).join(" ");
        return {
          place_id: p.osm_id ?? Math.floor(Math.random() * 1e9),
          lat: String(f.geometry.coordinates[1]),
          lon: String(f.geometry.coordinates[0]),
          display_name: [street || p.name, p.city ?? p.county].filter(Boolean).join(", "),
          address: {
            road: p.street,
            house_number: p.housenumber,
            neighbourhood: p.district ?? p.locality,
            city: p.city ?? p.county,
            postcode: p.postcode,
          },
        };
      })
      .filter((r: Suggestion) => {
        const key = `${parseFloat(r.lat).toFixed(3)},${parseFloat(r.lon).toFixed(3)}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 5);
  } catch {
    clearTimeout(tid);
    return [];
  }
}

export function formatAddress(s: Suggestion): { label: string; sublabel: string } {
  const a = s.address;
  if (!a) {
    const parts = s.display_name.split(",").map((p) => p.trim());
    return { label: parts[0] ?? "", sublabel: parts.slice(1, 3).join(", ") };
  }
  const street = [a.road, a.house_number].filter(Boolean).join(" ");
  const neighborhood = a.neighbourhood ?? a.suburb ?? a.city_district ?? "";
  const postcode = a.postcode ? `(${a.postcode})` : "";
  const label = street || a.city || a.town || "Buenos Aires";
  const sublabel = [neighborhood, postcode].filter(Boolean).join(" ");
  return { label, sublabel };
}
