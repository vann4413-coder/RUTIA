import type { Stop } from '../types/domain';
import { optimizeRouteLocal } from './tsp';

const TOKEN = import.meta.env['VITE_MAPBOX_TOKEN'] as string | undefined;

export type MapboxError =
  | { type: 'NetworkError'; message: string }
  | { type: 'RateLimitError' }
  | { type: 'NotFoundError' }
  | { type: 'InvalidTokenError' };

export class MapboxApiError extends Error {
  readonly kind: MapboxError;
  constructor(kind: MapboxError) {
    super(kind.type);
    this.kind = kind;
  }
}

export type GeocodeResult = {
  placeName: string;
  lng: number;
  lat: number;
};

export async function geocode(
  query: string,
  proximity?: { lng: number; lat: number },
): Promise<GeocodeResult> {
  if (!TOKEN) throw new MapboxApiError({ type: 'InvalidTokenError' });

  const params = new URLSearchParams({
    q: query,
    access_token: TOKEN,
    language: 'es',
    country: 'es',
    limit: '1',
  });
  if (proximity) {
    params.set('proximity', `${proximity.lng},${proximity.lat}`);
  }

  let res: Response;
  try {
    res = await fetch(`https://api.mapbox.com/search/geocode/v6/forward?${params}`);
  } catch (e) {
    throw new MapboxApiError({ type: 'NetworkError', message: String(e) });
  }

  if (res.status === 401) throw new MapboxApiError({ type: 'InvalidTokenError' });
  if (res.status === 429) throw new MapboxApiError({ type: 'RateLimitError' });
  if (!res.ok) throw new MapboxApiError({ type: 'NetworkError', message: `HTTP ${res.status}` });

  const data = (await res.json()) as {
    features?: { properties: { full_address: string }; geometry: { coordinates: [number, number] } }[];
  };

  const feature = data.features?.[0];
  if (!feature) throw new MapboxApiError({ type: 'NotFoundError' });

  return {
    placeName: feature.properties.full_address,
    lng: feature.geometry.coordinates[0],
    lat: feature.geometry.coordinates[1],
  };
}

export async function optimizeRouteRemote(stops: Stop[]): Promise<string[]> {
  if (!TOKEN) throw new MapboxApiError({ type: 'InvalidTokenError' });
  if (stops.length <= 1) return stops.map((s) => s.id);

  const coords = stops.map((s) => `${s.lng},${s.lat}`).join(';');
  const url = `https://api.mapbox.com/optimized-trips/v1/mapbox/driving/${coords}?access_token=${TOKEN}&source=first&roundtrip=false`;

  let res: Response;
  try {
    res = await fetch(url);
  } catch (e) {
    throw new MapboxApiError({ type: 'NetworkError', message: String(e) });
  }

  if (res.status === 401) throw new MapboxApiError({ type: 'InvalidTokenError' });
  if (res.status === 429) throw new MapboxApiError({ type: 'RateLimitError' });
  if (!res.ok) throw new MapboxApiError({ type: 'NetworkError', message: `HTTP ${res.status}` });

  const data = (await res.json()) as {
    waypoints?: { waypoint_index: number }[];
  };

  if (!data.waypoints) throw new MapboxApiError({ type: 'NetworkError', message: 'No waypoints in response' });

  const order = [...data.waypoints]
    .sort((a, b) => a.waypoint_index - b.waypoint_index)
    .map((_, i) => i);

  return order.map((i) => stops[i]!.id);
}

export async function optimizeRoute(stops: Stop[]): Promise<string[]> {
  if (stops.length <= 12) {
    try {
      return await optimizeRouteRemote(stops);
    } catch {
      return optimizeRouteLocal(stops);
    }
  }
  return optimizeRouteLocal(stops);
}
