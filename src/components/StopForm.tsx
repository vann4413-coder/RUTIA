import { useState } from 'react';
import { useRouteStore } from '../store/routeStore';

export function StopForm() {
  const [value, setValue] = useState('');
  const addStop = useRouteStore((s) => s.addStop);
  const isGeocoding = useRouteStore((s) => s.isGeocoding);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    await addStop(trimmed);
    setValue('');
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 p-4">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Añadir dirección..."
        disabled={isGeocoding}
        aria-label="Dirección de la parada"
        className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0EA5A0] disabled:opacity-50"
      />
      <button
        type="button"
        disabled
        aria-label="Dictado por voz (disponible próximamente)"
        title="Tu navegador no soporta dictado por voz"
        className="rounded-lg border border-gray-300 px-3 py-2 text-gray-400 disabled:cursor-not-allowed"
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
  );
}
