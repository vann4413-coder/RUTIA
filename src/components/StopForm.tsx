import { useState, useEffect } from 'react';
import { useRouteStore } from '../store/routeStore';
import { useVoiceInput } from '../lib/voice';

const ERROR_MESSAGES: Record<string, string> = {
  'not-allowed': 'Permiso de micrófono denegado. Actívalo en la configuración del navegador.',
  'no-speech': 'No se detectó voz. Inténtalo de nuevo.',
  network: 'Error de red al procesar la voz.',
  unknown: 'Error al usar el micrófono.',
};

export function StopForm() {
  const [value, setValue] = useState('');
  const addStop = useRouteStore((s) => s.addStop);
  const isGeocoding = useRouteStore((s) => s.isGeocoding);

  const { start, transcript, clearTranscript, isListening, error: voiceError, isSupported } = useVoiceInput();

  useEffect(() => {
    if (transcript) setValue(transcript);
  }, [transcript]);

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    clearTranscript();
    await addStop(trimmed);
    setValue('');
  }

  return (
    <div className="px-4 pt-3 pb-2">
      {voiceError && (
        <p role="alert" className="mb-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
          {ERROR_MESSAGES[voiceError] ?? ERROR_MESSAGES['unknown']}
        </p>
      )}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={isListening ? 'Escuchando…' : 'Añadir dirección...'}
          disabled={isGeocoding}
          aria-label="Dirección de la parada"
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0EA5A0] disabled:opacity-50"
        />
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
