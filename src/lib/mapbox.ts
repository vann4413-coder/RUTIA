import type { Stop } from '../types/domain';
import { optimizeRouteLocal } from './tsp';

const KEY = import.meta.env['VITE_MAPTILER_KEY'] as string | undefined;

export type GeoError =
  | { type: 'NetworkError'; message: string }
  | { type: 'RateLimitError' }
  | { type: 'NotFoundError' }
  | { type: 'InvalidKeyError' };

export class GeoApiError extends Error {
  readonly kind: GeoError;
  constructor(kind: GeoError) {
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
  if (!KEY) throw new GeoApiError({ type: 'InvalidKeyError' });

  const params = new URLSearchParams({
    key: KEY,
    language: 'es',
    country: 'es',
    limit: '1',
  });
  if (proximity) {
    params.set('proximity', `${proximity.lng},${proximity.lat}`);
  }

  const encoded = encodeURIComponent(query);
  let res: Response;
  try {
    res = await fetch(`https://api.maptiler.com/geocoding/${encoded}.json?${params}`);
  } catch (e) {
    throw new GeoApiError({ type: 'NetworkError', message: String(e) });
  }

  if (res.status === 401 || res.status === 403) throw new GeoApiError({ type: 'InvalidKeyError' });
  if (res.status === 429) throw new GeoApiError({ type: 'RateLimitError' });
  if (!res.ok) throw new GeoApiError({ type: 'NetworkError', message: `HTTP ${res.status}` });

  const data = (await res.json()) as {
    features?: { place_name: string; center: [number, number] }[];
  };

  const feature = data.features?.[0];
  if (!feature) throw new GeoApiError({ type: 'NotFoundError' });

  return {
    placeName: feature.place_name,
    lng: feature.center[0],
    lat: feature.center[1],
  };
}

export async function geocodeSuggestions(
  query: string,
  proximity?: { lng: number; lat: number },
): Promise<GeocodeResult[]> {
  if (!KEY || query.trim().length < 3) return [];

  const params = new URLSearchParams({
    key: KEY,
    language: 'es',
    country: 'es',
    limit: '5',
  });
  if (proximity) {
    params.set('proximity', `${proximity.lng},${proximity.lat}`);
  }

  try {
    const res = await fetch(
      `https://api.maptiler.com/geocoding/${encodeURIComponent(query)}.json?${params}`,
    );
    if (!res.ok) return [];
    const data = (await res.json()) as {
      features?: { place_name: string; center: [number, number] }[];
    };
    return (data.features ?? []).map((f) => ({
      placeName: f.place_name,
      lng: f.center[0],
      lat: f.center[1],
    }));
  } catch {
    return [];
  }
}

// Maptiler no tiene API de optimización — usamos siempre el algoritmo local TSP
export async function optimizeRoute(stops: Stop[]): Promise<string[]> {
  return optimizeRouteLocal(stops);
}
