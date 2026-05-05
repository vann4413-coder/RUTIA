import type { Stop } from '../types/domain';

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

function haversine(a: Stop, b: Stop): number {
  const R = 6371000;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

function buildMatrix(stops: Stop[]): number[][] {
  return stops.map((a) => stops.map((b) => haversine(a, b)));
}

function totalDistance(order: number[], matrix: number[][]): number {
  let dist = 0;
  for (let i = 0; i < order.length - 1; i++) {
    dist += matrix[order[i]!]![order[i + 1]!]!;
  }
  return dist;
}

function nearestNeighbor(matrix: number[][]): number[] {
  const n = matrix.length;
  const visited = new Array<boolean>(n).fill(false);
  const order: number[] = [0];
  visited[0] = true;

  for (let step = 1; step < n; step++) {
    const last = order[order.length - 1]!;
    let nearest = -1;
    let nearestDist = Infinity;
    for (let j = 0; j < n; j++) {
      if (!visited[j] && matrix[last]![j]! < nearestDist) {
        nearest = j;
        nearestDist = matrix[last]![j]!;
      }
    }
    visited[nearest] = true;
    order.push(nearest);
  }
  return order;
}

function twoOpt(order: number[], matrix: number[][]): number[] {
  let improved = true;
  let best = [...order];
  let bestDist = totalDistance(best, matrix);
  const MAX_ITER = 1000;
  let iter = 0;

  while (improved && iter < MAX_ITER) {
    improved = false;
    iter++;
    for (let i = 1; i < best.length - 1; i++) {
      for (let j = i + 1; j < best.length; j++) {
        const candidate = [
          ...best.slice(0, i),
          ...best.slice(i, j + 1).reverse(),
          ...best.slice(j + 1),
        ];
        const candidateDist = totalDistance(candidate, matrix);
        if (candidateDist < bestDist) {
          best = candidate;
          bestDist = candidateDist;
          improved = true;
        }
      }
    }
  }
  return best;
}

export function optimizeRouteLocal(stops: Stop[]): string[] {
  if (stops.length <= 1) return stops.map((s) => s.id);
  const matrix = buildMatrix(stops);
  const initial = nearestNeighbor(matrix);
  const optimized = twoOpt(initial, matrix);
  return optimized.map((i) => stops[i]!.id);
}
