const cache = new Map<string, string>();
const fwdCache = new Map<string, { lat: number; lon: number } | null>();

export async function forwardGeocode(address: string): Promise<{ lat: number; lon: number } | null> {
  const key = address.trim().toLowerCase();
  if (fwdCache.has(key)) return fwdCache.get(key)!;
  try {
    const q = encodeURIComponent(address + ", Buenos Aires, Argentina");
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1&countrycodes=ar`,
      { headers: { "User-Agent": "DePaso-App/1.0" } }
    );
    const data = await res.json();
    const result = data.length ? { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) } : null;
    fwdCache.set(key, result);
    return result;
  } catch {
    return null;
  }
}

export async function reverseGeocode(lat: number, lon: number): Promise<string> {
  const key = `${lat.toFixed(5)},${lon.toFixed(5)}`;
  if (cache.has(key)) return cache.get(key)!;

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`,
      { headers: { "User-Agent": "DePaso-App/1.0" } }
    );
    const data = await res.json();
    const a = data.address ?? {};
    const street = [a.road, a.house_number].filter(Boolean).join(" ");
    const neighborhood = a.neighbourhood ?? a.suburb ?? a.city_district ?? "";
    const result = [street, neighborhood].filter(Boolean).join(", ") || data.display_name?.split(",")[0] || `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
    cache.set(key, result);
    return result;
  } catch {
    return `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
  }
}
