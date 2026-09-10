import type { Point } from './taxi-motion';
export type Destination = { id: string; label: string; point: Point };
export type Trip = {
  destination: Destination;
  route: Point[];
  distance: number;
  duration: number;
  arrivalDistance: number;
};
type SearchResponse = {
  features?: {
    geometry?: { coordinates?: number[] };
    properties?: Record<string, string | number>;
  }[];
};
type RouteResponse = {
  code?: string;
  routes?: {
    geometry: { coordinates: number[][] };
    duration: number;
    distance: number;
  }[];
  waypoints?: { distance: number }[];
};
const cache = new Map<string, Destination[]>();
async function getJson<T>(url: string, signal: AbortSignal) {
  const controller = new AbortController(),
    abort = () => controller.abort();
  signal.addEventListener('abort', abort, { once: true });
  if (signal.aborted) controller.abort();
  const timeout = setTimeout(abort, 20000);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok)
      throw new Error('Palvelu ei vastaa. Yritä hetken kuluttua uudelleen.');
    return (await response.json()) as T;
  } finally {
    clearTimeout(timeout);
    signal.removeEventListener('abort', abort);
  }
}
export async function searchDestinations(
  query: string,
  signal: AbortSignal,
): Promise<Destination[]> {
  const key = query.trim().toLocaleLowerCase();
  if (cache.has(key)) return cache.get(key)!;
  const params = new URLSearchParams({
    q: query.trim(),
    lat: '60.16755',
    lon: '24.94275',
    limit: '5',
  });
  const data = await getJson<SearchResponse>(
    `https://photon.komoot.io/api/?${params}`,
    signal,
  );
  const results: Destination[] = [];
  const seenAddresses = new Set<string>();
  for (const f of data.features ?? []) {
    const [lon, lat] = f.geometry?.coordinates ?? [];
    const p = f.properties ?? {};
    if (
      !Number.isFinite(lat) ||
      !Number.isFinite(lon) ||
      Math.abs(lat) > 90 ||
      Math.abs(lon) > 180
    )
      continue;
    const street = [p.street, p.housenumber].filter(Boolean).join(' ');
    const label = [
      ...new Set(
        [
          p.name,
          street,
          p.postcode,
          p.city ?? p.town ?? p.village,
          p.country,
        ].filter(Boolean),
      ),
    ].join(', ');
    const addressKey = label
      .normalize('NFKC')
      .toLocaleLowerCase('fi-FI')
      .replace(/\s+/g, ' ')
      .replace(/\s*,\s*/g, ',')
      .trim();
    if (!addressKey || seenAddresses.has(addressKey)) continue;
    seenAddresses.add(addressKey);
    results.push({
      id: `${p.osm_type}-${p.osm_id}`,
      label,
      point: [lat, lon],
    });
  }
  cache.set(key, results);
  return results;
}
export async function routeToDestination(
  pickup: Point,
  destination: Destination,
  signal: AbortSignal,
): Promise<Trip> {
  const coords = [pickup, destination.point]
    .map((p) => `${p[1]},${p[0]}`)
    .join(';');
  const data = await getJson<RouteResponse>(
    `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson&radiuses=200;200`,
    signal,
  );
  const result = data.routes?.[0];
  if (
    data.code !== 'Ok' ||
    !result ||
    !Array.isArray(result.geometry?.coordinates) ||
    result.geometry.coordinates.length < 2
  )
    throw new Error(
      'Kohteeseen ei löytynyt ajoreittiä. Valitse toinen osoite.',
    );
  const route: Point[] = result.geometry.coordinates.map((p: number[]) => [
    p[1],
    p[0],
  ]);
  if (
    route.some((p) => !Number.isFinite(p[0]) || !Number.isFinite(p[1])) ||
    !Number.isFinite(result.duration) ||
    !Number.isFinite(result.distance)
  )
    throw new Error('Reitin tiedot ovat puutteelliset. Yritä uudelleen.');
  return {
    destination,
    route,
    duration: result.duration,
    distance: result.distance,
    arrivalDistance: data.waypoints?.[1]?.distance ?? 0,
  };
}
