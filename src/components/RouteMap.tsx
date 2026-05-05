import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useRouteStore } from '../store/routeStore';
import type { Stop } from '../types/domain';

const TOKEN = import.meta.env['VITE_MAPBOX_TOKEN'] as string | undefined;

const MATARO = { lng: 2.4449, lat: 41.5388 };

function makeMarkerEl(label: string, visited: boolean): HTMLElement {
  const el = document.createElement('div');
  el.className = 'flex h-7 w-7 items-center justify-center rounded-full border-2 border-white text-xs font-bold shadow-md';
  el.style.backgroundColor = visited ? '#9CA3AF' : '#0EA5A0';
  el.style.color = '#fff';
  el.textContent = label;
  return el;
}

export function RouteMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  const currentRoute = useRouteStore((s) => s.currentRoute);

  const orderedStops: Stop[] = (() => {
    if (!currentRoute) return [];
    if (currentRoute.optimizedOrder) {
      return currentRoute.optimizedOrder
        .map((id) => currentRoute.stops.find((s) => s.id === id))
        .filter((s): s is Stop => s !== undefined);
    }
    return currentRoute.stops;
  })();

  // Init map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    if (!TOKEN) return;

    mapboxgl.accessToken = TOKEN;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [MATARO.lng, MATARO.lat],
      zoom: 13,
    });
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update markers + route line
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // Remove old route layer/source
    if (map.isStyleLoaded()) {
      if (map.getLayer('route-line')) map.removeLayer('route-line');
      if (map.getSource('route')) map.removeSource('route');
    }

    if (orderedStops.length === 0) return;

    // Add markers
    orderedStops.forEach((stop, i) => {
      const marker = new mapboxgl.Marker({ element: makeMarkerEl(String(i + 1), stop.visited) })
        .setLngLat([stop.lng, stop.lat])
        .setPopup(new mapboxgl.Popup({ offset: 25 }).setText(stop.label ?? stop.address))
        .addTo(map);
      markersRef.current.push(marker);
    });

    // Draw route line when optimized
    if (currentRoute?.optimizedOrder && orderedStops.length >= 2) {
      const addLine = () => {
        if (map.getLayer('route-line')) map.removeLayer('route-line');
        if (map.getSource('route')) map.removeSource('route');

        map.addSource('route', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: orderedStops.map((s) => [s.lng, s.lat]),
            },
          },
        });
        map.addLayer({
          id: 'route-line',
          type: 'line',
          source: 'route',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: { 'line-color': '#0EA5A0', 'line-width': 3, 'line-opacity': 0.8 },
        });
      };

      if (map.isStyleLoaded()) {
        addLine();
      } else {
        map.once('load', addLine);
      }
    }

    // fitBounds
    if (orderedStops.length === 1) {
      map.flyTo({ center: [orderedStops[0]!.lng, orderedStops[0]!.lat], zoom: 15 });
    } else {
      const bounds = orderedStops.reduce(
        (b, s) => b.extend([s.lng, s.lat]),
        new mapboxgl.LngLatBounds(
          [orderedStops[0]!.lng, orderedStops[0]!.lat],
          [orderedStops[0]!.lng, orderedStops[0]!.lat],
        ),
      );
      map.fitBounds(bounds, { padding: 60, maxZoom: 16 });
    }
  }, [orderedStops, currentRoute?.optimizedOrder]);

  if (!TOKEN) {
    return (
      <div className="flex h-full items-center justify-center bg-gray-100 p-4 text-center text-sm text-gray-500">
        Token de Mapbox no configurado. Crea <code className="rounded bg-gray-200 px-1">.env.local</code> con{' '}
        <code className="rounded bg-gray-200 px-1">VITE_MAPBOX_TOKEN</code>.
      </div>
    );
  }

  return <div ref={containerRef} className="h-full w-full" />;
}
