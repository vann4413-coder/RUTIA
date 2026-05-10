import { useState, useEffect, useRef } from 'react';
import { useRouteStore } from '../store/routeStore';
import { useVoiceInput } from '../lib/voice';
import { geocodeSuggestions } from '../lib/mapbox';
import type { GeocodeResult } from '../lib/mapbox';

const ERROR_MESSAGES: Record<string, string> = {
  'not-allowed': 'Permiso de micrófono denegado. Actívalo en la configuración del navegador.',
  'no-speech': 'No se detectó voz. Inténtalo de nuevo.',
  network: 'Error de red al procesar la voz.',
  unknown: 'Error al usar el micrófono.',
};

export function StopForm() {
  const [value, setValue] = useState('');
  const [suggestions, setSuggestions] = useState<GeocodeResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const addStop = useRouteStore((s) => s.addStop);
  const isGeocoding = useRouteStore((s) => s.isGeocoding);
  const currentRoute = useRouteStore((s) => s.currentRoute);

  const { start, transcript, clearTranscript, isListening, error: voiceError, isSupported } =
    useVoiceInput();

  useEffect(() => {
    if (transcript) setValue(transcript);
  }, [transcript]);

  // Debounce geocoding suggestions mientras el usuario escribe
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.trim().length < 3) {
      setSuggestions([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      const lastStop = currentRoute?.stops[currentRoute.stops.length - 1];
      const proximity = lastStop
        ? { lng: lastStop.lng, lat: lastStop.lat }
        : { lng: 2.4449, lat: 41.5388 };
      const results = await geocodeSuggestions(value, proximity);
      setSuggestions(results);
      setShowSuggestions(results.length > 0);
    }, 350);
  }, [value, currentRoute?.stops]);

  // Cerrar sugerencias al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    setShowSuggestions(false);
    clearTranscript();
    await addStop(trimmed);
    setValue('');
    setSuggestions([]);
  }

  async function handleSelectSuggestion(suggestion: GeocodeResult) {
    setShowSuggestions(false);
    setValue('');
    setSuggestions([]);
    clearTranscript();
    // Añadimos directamente con la dirección ya resuelta
    await addStop(suggestion.placeName);
  }

  return (
    <div className="px-4 pt-3 pb-2" ref={containerRef}>
      {voiceError && (
        <p role="alert" className="mb-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
          {ERROR_MESSAGES[voiceError] ?? ERROR_MESSAGES['unknown']}
        </p>
      )}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            placeholder={isListening ? 'Escuchando…' : 'Ej: Carrer de l\'Energia 11, Mataró'}
            disabled={isGeocoding}
            aria-label="Dirección de la parada"
            aria-autocomplete="list"
            aria-expanded={showSuggestions}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0EA5A0] disabled:opacity-50"
          />

          {/* Dropdown de sugerencias */}
          {showSuggestions && suggestions.length > 0 && (
            <ul
              role="listbox"
              className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg"
            >
              {suggestions.map((s, i) => (
                <li key={i}>
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault(); // evita que el input pierda el foco antes del click
                      void handleSelectSuggestion(s);
                    }}
                    className="w-full px-3 py-2.5 text-left text-sm text-gray-700 hover:bg-teal-50 hover:text-[#0EA5A0]"
                  >
                    {s.placeName}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <button
          type="button"
          onClick={start}
          disabled={!isSupported || isGeocoding}
          aria-label={isListening ? 'Detener dictado' : 'Iniciar dictado por voz'}
          title={!isSupported ? 'Tu navegador no soporta dictado por voz' : undefined}
          className={`rounded-lg border px-3 py-2 text-base transition-colors ${
            isListening
              ? 'animate-pulse border-[#0EA5A0] bg-teal-50 text-[#0EA5A0]'
              : 'border-gray-300 text-gray-500 hover:bg-gray-50'
          } disabled:cursor-not-allowed disabled:opacity-40`}
        >
          🎤
        </button>
        <button
          type="submit"
          disabled={isGeocoding || !value.trim()}
          className="rounded-lg bg-[#0EA5A0] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {isGeocoding ? 'Buscando…' : 'Añadir'}
        </button>
      </form>
    </div>
  );
}
