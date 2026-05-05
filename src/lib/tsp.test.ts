import { describe, expect, it } from 'vitest';
import { optimizeRouteLocal } from './tsp';
import type { Stop } from '../types/domain';

function makeStop(id: string, lat: number, lng: number): Stop {
  return { id, address: id, lat, lng, visited: false };
}

function routeDistance(ids: string[], stops: Stop[]): number {
  const map = Object.fromEntries(stops.map((s) => [s.id, s]));
  let dist = 0;
  for (let i = 0; i < ids.length - 1; i++) {
    const a = map[ids[i]!]!;
    const b = map[ids[i + 1]!]!;
    const dLat = ((b.lat - a.lat) * Math.PI) / 180;
    const dLng = ((b.lng - a.lng) * Math.PI) / 180;
    const s =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((a.lat * Math.PI) / 180) *
        Math.cos((b.lat * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2;
    dist += 6371000 * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
  }
  return dist;
}

describe('optimizeRouteLocal', () => {
  it('devuelve el id de una sola parada', () => {
    const stops = [makeStop('a', 41.5, 2.4)];
    expect(optimizeRouteLocal(stops)).toEqual(['a']);
  });

  it('devuelve ambos ids para dos paradas', () => {
    const stops = [makeStop('a', 41.5, 2.4), makeStop('b', 41.6, 2.5)];
    const result = optimizeRouteLocal(stops);
    expect(result).toHaveLength(2);
    expect(result).toContain('a');
    expect(result).toContain('b');
  });

  it('optimiza un cuadrado de 4 puntos — no repite ni omite paradas', () => {
    // Cuadrado: NW, NE, SE, SW
    const stops = [
      makeStop('nw', 41.6, 2.4),
      makeStop('ne', 41.6, 2.5),
      makeStop('se', 41.5, 2.5),
      makeStop('sw', 41.5, 2.4),
    ];
    const result = optimizeRouteLocal(stops);
    expect(result).toHaveLength(4);
    expect(new Set(result).size).toBe(4);
  });

  it('optimiza un cuadrado — el orden no cruza diagonales (perímetro)', () => {
    const stops = [
      makeStop('nw', 41.6, 2.4),
      makeStop('ne', 41.6, 2.5),
      makeStop('se', 41.5, 2.5),
      makeStop('sw', 41.5, 2.4),
    ];
    const result = optimizeRouteLocal(stops);
    const dist = routeDistance(result, stops);
    // La diagonal mide ~15km, el perímetro ~28km. Una ruta sin cruce < 16km (dos lados)
    // El orden óptimo nunca cruza la diagonal: distancia total < ~15000m * 2
    expect(dist).toBeLessThan(30000);
  });

  it('mejora la distancia total respecto al orden de entrada (8 puntos)', () => {
    // 8 paradas dispersas — orden de entrada es zigzag ineficiente
    const stops = [
      makeStop('1', 41.50, 2.40),
      makeStop('2', 41.60, 2.50),
      makeStop('3', 41.51, 2.41),
      makeStop('4', 41.59, 2.49),
      makeStop('5', 41.52, 2.42),
      makeStop('6', 41.58, 2.48),
      makeStop('7', 41.53, 2.43),
      makeStop('8', 41.57, 2.47),
    ];
    const originalOrder = stops.map((s) => s.id);
    const optimizedOrder = optimizeRouteLocal(stops);

    const originalDist = routeDistance(originalOrder, stops);
    const optimizedDist = routeDistance(optimizedOrder, stops);

    expect(optimizedDist).toBeLessThan(originalDist);
  });

  it('devuelve todos los ids sin repetición (8 puntos)', () => {
    const stops = [
      makeStop('a', 41.50, 2.40),
      makeStop('b', 41.55, 2.45),
      makeStop('c', 41.52, 2.43),
      makeStop('d', 41.58, 2.48),
      makeStop('e', 41.51, 2.41),
      makeStop('f', 41.57, 2.47),
      makeStop('g', 41.53, 2.43),
      makeStop('h', 41.56, 2.46),
    ];
    const result = optimizeRouteLocal(stops);
    expect(result).toHaveLength(8);
    expect(new Set(result).size).toBe(8);
  });
});
