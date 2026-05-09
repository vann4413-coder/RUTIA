import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useRouteStore } from '../store/routeStore';
import { reverseGeocode } from '../lib/mapbox';
import type { Stop } from '../types/domain';

const KEY = import.meta.env['VITE_MAPTILER_KEY'] as string | undefined;

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
  const [isAdding, setIsAdding] = useState(false);

  const currentRoute = useRouteStore((s) => s.currentRoute);
  const addStop = useRouteStore((s) => s.addStop);

  const orderedStops: Stop[] = (() => {
    if (!currentRoute) return [];
    if (currentRoute.optimizedOrder) {
      return currentRoute.optimizedOrder
        .map((id) => currentRoute.stops.find((s) => s.id === id))
        .filter((s): s is Stop => s !== undefined);
    }
    return currentRoute.stops;
  })();

  // Init mapa
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    if (!KEY) return;

    mapboxgl.accessToken = 'no-token';
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: `https://api.maptiler.com/maps/streets-v2/style.json?key=${KEY}`,
      center: [MATARO.lng, MATARO.lat],
      zoom: 13,
    });

    // Clic en el mapa → añadir parada por reverse geocoding
    map.on('click', async (e) => {
      if (!useRouteStore.getState().currentRoute) return;
      const { lng, lat } = e.lngLat;
      setIsAdding(true);
      try {
        const result = await reverseGeocode(lng, lat);
        if (result) {
          await addStop(result.placeName);
        }
      } finally {
        setIsAdding(false);
      }
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [addStop]);

  // Actualizar marcadores y línea de ruta
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    if (map.isStyleLoaded()) {
      if (map.getLayer('route-line')) map.removeLayer('route-line');
      if (map.getSource('route')) map.removeSource('route');
    }

    if (orderedStops.length === 0) return;

    orderedStops.forEach((stop, i) => {
      const marker = new mapboxgl.Marker({ element: makeMarkerEl(String(i + 1), stop.visited) })
        .setLngLat([stop.lng, stop.lat])
        .setPopup(new mapboxgl.Popup({ offset: 25 }).setText(stop.label ?? stop.address))
        .addTo(map);
      markersRef.current.push(marker);
    });

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

      if (map.isStyleLoaded()) addLine();
      else map.once('load', addLine);
    }

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

  if (!KEY) {
    return (
      <div className="flex h-full items-center justify-center bg-gray-100 p-4 text-center text-sm text-gray-500">
        Clave de Maptiler no configurada.
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" />
      {/* Indicador de carga al añadir por clic */}
      {isAdding && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-lg">
          <span className="mr-2 inline-block h-3 w-3 animate-spin rounded-full border-2 border-[#0EA5A0] border-t-transparent" />
          Añadiendo parada…
        </div>
      )}
      {/* Hint para el usuario */}
      {currentRoute && !isAdding && (
        <div className="pointer-events-none absolute bottom-4 right-4 rounded-lg bg-white/80 px-3 py-1.5 text-xs text-gray-500 shadow">
          Toca el mapa para añadir una parada
        </div>
      )}
    </div>
  );
}
