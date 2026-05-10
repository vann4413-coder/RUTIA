import type { Stop } from '../types/domain';

function stopAddress(stop: Stop): string {
  return stop.label ?? stop.address;
}

export function openInGoogleMapsWeb(stops: Stop[]): string {
  if (stops.length === 0) return '';

  const origin = stopAddress(stops[0]!);
  const destination = stopAddress(stops[stops.length - 1]!);
  const waypoints = stops
    .slice(1, -1)
    .map((s) => stopAddress(s))
    .join('|');

  return (
    `https://www.google.com/maps/dir/?api=1` +
    `&origin=${encodeURIComponent(origin)}` +
    `&destination=${encodeURIComponent(destination)}` +
    (waypoints ? `&waypoints=${encodeURIComponent(waypoints)}` : '') +
    `&travelmode=driving`
  );
}

// Waze solo soporta un destino por URL — abrimos la primera parada no visitada
export function openInWazeWeb(stops: Stop[]): string {
  if (stops.length === 0) return '';
  const target = stops.find((s) => !s.visited) ?? stops[stops.length - 1]!;
  return `https://waze.com/ul?ll=${target.lat},${target.lng}&navigate=yes`;
}
