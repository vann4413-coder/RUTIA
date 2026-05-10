import { useRouteStore } from '../store/routeStore';
import type { Stop } from '../types/domain';

type Props = {
  onClose: () => void;
};

export function NavMode({ onClose }: Props) {
  const currentRoute = useRouteStore((s) => s.currentRoute);
  const markVisited = useRouteStore((s) => s.markVisited);

  if (!currentRoute) return null;

  const orderedStops: Stop[] = currentRoute.optimizedOrder
    ? currentRoute.optimizedOrder
        .map((id) => currentRoute.stops.find((s) => s.id === id))
        .filter((s): s is Stop => s !== undefined)
    : currentRoute.stops;

  const currentIndex = orderedStops.findIndex((s) => !s.visited);
  const currentStop = currentIndex !== -1 ? orderedStops[currentIndex] : null;
  const visitedCount = orderedStops.filter((s) => s.visited).length;
  const total = orderedStops.length;
  const allDone = currentIndex === -1;

  function handleVisited() {
    if (!currentStop) return;
    markVisited(currentStop.id, true);
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Modo navegación"
      className="fixed inset-0 z-50 flex flex-col bg-gray-900/60 backdrop-blur-sm"
    >
      {/* Barra superior */}
      <div className="flex items-center justify-between bg-[#0EA5A0] px-4 py-3 text-white">
        <span className="text-sm font-medium">Modo navegación</span>
        <div className="flex items-center gap-3">
          <span className="text-sm opacity-80">{visitedCount} / {total}</span>
          <button onClick={onClose} aria-label="Salir del modo navegación" className="text-white/80 hover:text-white">
            ✕
          </button>
        </div>
      </div>

      {/* Barra de progreso */}
      <div className="h-1 bg-teal-200">
        <div
          className="h-full bg-white transition-all"
          style={{ width: `${total > 0 ? (visitedCount / total) * 100 : 0}%` }}
        />
      </div>

      {/* Contenido principal */}
      <div className="flex flex-1 flex-col items-center justify-center p-6">
        {allDone ? (
          <div className="text-center">
            <p className="text-5xl mb-4">✅</p>
            <p className="text-xl font-bold text-white">¡Ruta completada!</p>
            <p className="mt-2 text-white/70">Todas las paradas visitadas.</p>
            <button
              onClick={onClose}
              className="mt-6 rounded-xl bg-white px-8 py-3 font-semibold text-[#0EA5A0]"
            >
              Volver a Rutia
            </button>
          </div>
        ) : (
          <div className="w-full max-w-sm">
            {/* Número de parada */}
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0EA5A0] text-lg font-bold text-white">
                {currentIndex + 1}
              </span>
              <span className="text-sm text-white/60">
                Siguiente: {currentIndex + 1 < total ? orderedStops[currentIndex + 1]?.label ?? orderedStops[currentIndex + 1]?.address : '— última parada'}
              </span>
            </div>

            {/* Tarjeta de parada actual */}
            <div className="rounded-2xl bg-white p-5 shadow-xl">
              <p className="text-lg font-bold text-gray-800">
                {currentStop?.label ?? currentStop?.address}
              </p>
              {currentStop?.label && (
                <p className="mt-0.5 text-sm text-gray-500">{currentStop.address}</p>
              )}

              {currentStop?.note && (
                <div className="mt-3 rounded-lg bg-amber-50 px-3 py-2">
                  <p className="text-xs font-medium text-amber-700 mb-0.5">Nota</p>
                  <p className="text-sm text-amber-800">{currentStop.note}</p>
                </div>
              )}

              {currentStop?.phone && (
                <a
                  href={`tel:${currentStop.phone}`}
                  className="mt-3 flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-[#0EA5A0]"
                >
                  📞 <span>{currentStop.phone}</span>
                </a>
              )}
            </div>

            {/* Botones de acción */}
            <div className="mt-4 flex flex-col gap-3">
              <button
                onClick={handleVisited}
                className="w-full rounded-xl bg-[#0EA5A0] py-4 text-base font-semibold text-white shadow-lg active:scale-[0.98]"
              >
                Visitada → siguiente
              </button>
              <button
                onClick={() => {
                  if (currentStop) markVisited(currentStop.id, false);
                }}
                className="w-full rounded-xl border border-white/30 py-2.5 text-sm text-white/70"
              >
                Marcar como pendiente
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Lista compacta del resto de paradas */}
      {!allDone && (
        <div className="shrink-0 rounded-t-2xl bg-white px-4 pt-3 pb-6 shadow-2xl max-h-48 overflow-y-auto">
          <p className="mb-2 text-xs font-medium text-gray-400 uppercase tracking-wide">Próximas paradas</p>
          <ul className="flex flex-col gap-1">
            {orderedStops.map((stop, i) => (
              <li key={stop.id} className={`flex items-center gap-2 text-sm py-1 ${stop.visited ? 'opacity-40 line-through' : ''}`}>
                <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${i === currentIndex ? 'bg-[#0EA5A0]' : 'bg-gray-300'}`}>
                  {i + 1}
                </span>
                <span className="truncate text-gray-700">{stop.label ?? stop.address}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
