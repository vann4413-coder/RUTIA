import type { Stop } from '../types/domain';

function isIOS(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isAndroid(): boolean {
  return /android/i.test(navigator.userAgent);
}

export function openInGoogleMaps(stops: Stop[]): string {
  if (stops.length === 0) return '';

  const origin = `${stops[0]!.lat},${stops[0]!.lng}`;
  const destination = `${stops[stops.length - 1]!.lat},${stops[stops.length - 1]!.lng}`;
  const waypoints = stops
    .slice(1, -1)
    .map((s) => `${s.lat},${s.lng}`)
    .join('|');

  const webUrl =
    `https://www.google.com/maps/dir/?api=1` +
    `&origin=${encodeURIComponent(origin)}` +
    `&destination=${encodeURIComponent(destination)}` +
    (waypoints ? `&waypoints=${encodeURIComponent(waypoints)}` : '') +
    `&travelmode=driving`;

  if (isIOS()) {
    return `comgooglemaps://?saddr=${origin}&daddr=${destination}${waypoints ? `&waypoints=${encodeURIComponent(waypoints)}` : ''}&directionsmode=driving`;
  }
  if (isAndroid()) {
    return `google.navigation:q=${destination}`;
  }
  return webUrl;
}

export function openInGoogleMapsWeb(stops: Stop[]): string {
  if (stops.length === 0) return '';
  const origin = `${stops[0]!.lat},${stops[0]!.lng}`;
  const destination = `${stops[stops.length - 1]!.lat},${stops[stops.length - 1]!.lng}`;
  const waypoints = stops
    .slice(1, -1)
    .map((s) => `${s.lat},${s.lng}`)
    .join('|');
  return (
    `https://www.google.com/maps/dir/?api=1` +
    `&origin=${encodeURIComponent(origin)}` +
    `&destination=${encodeURIComponent(destination)}` +
    (waypoints ? `&waypoints=${encodeURIComponent(waypoints)}` : '') +
    `&travelmode=driving`
  );
}

// Waze solo soporta un destino por URL. Abrimos la primera parada no visitada
// (o la última si todas están visitadas) y el usuario continúa manualmente.
export function openInWaze(stops: Stop[]): string {
  if (stops.length === 0) return '';
  const target = stops.find((s) => !s.visited) ?? stops[stops.length - 1]!;

  const webUrl = `https://waze.com/ul?ll=${target.lat},${target.lng}&navigate=yes`;

  if (isIOS()) {
    return `waze://?ll=${target.lat},${target.lng}&navigate=yes`;
  }
  if (isAndroid()) {
    return `waze://?ll=${target.lat},${target.lng}&navigate=yes`;
  }
  return webUrl;
}

export function openInWazeWeb(stops: Stop[]): string {
  if (stops.length === 0) return '';
  const target = stops.find((s) => !s.visited) ?? stops[stops.length - 1]!;
  return `https://waze.com/ul?ll=${target.lat},${target.lng}&navigate=yes`;
}
