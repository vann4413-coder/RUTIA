import { useState } from 'react';
import { useRouteStore } from './store/routeStore';
import { StopForm } from './components/StopForm';
import { StopList } from './components/StopList';
import { RouteMap } from './components/RouteMap';
import { TemplateManager } from './components/TemplateManager';
import { openInGoogleMapsWeb, openInWazeWeb } from './lib/deeplinks';

function App() {
  const currentRoute = useRouteStore((s) => s.currentRoute);
  const newRoute = useRouteStore((s) => s.newRoute);
  const optimize = useRouteStore((s) => s.optimize);
  const isOptimizing = useRouteStore((s) => s.isOptimizing);
  const error = useRouteStore((s) => s.error);
  const clearError = useRouteStore((s) => s.clearError);

  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState('');
  const [showTemplates, setShowTemplates] = useState(false);

  function startEditName() {
    setNameValue(currentRoute?.name ?? '');
    setEditingName(true);
  }

  function commitName() {
    if (nameValue.trim()) {
      useRouteStore.setState((s) => ({
        currentRoute: s.currentRoute ? { ...s.currentRoute, name: nameValue.trim() } : null,
      }));
    }
    setEditingName(false);
  }

  const visitedCount = currentRoute?.stops.filter((s) => s.visited).length ?? 0;
  const totalCount = currentRoute?.stops.length ?? 0;

  if (!currentRoute) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-50 p-6">
        <h1 className="text-4xl font-bold text-[#0EA5A0]">Rutia</h1>
        <p className="text-center text-gray-500">Tus rutas, en orden.</p>
        <button
          onClick={() => newRoute('Mi ruta')}
          className="rounded-xl bg-[#0EA5A0] px-8 py-3 text-lg font-semibold text-white shadow-md active:scale-95"
        >
          Nueva ruta
        </button>
        <button
          onClick={() => setShowTemplates(true)}
          className="rounded-xl border border-gray-300 px-8 py-3 text-base font-medium text-gray-600 hover:bg-gray-100"
        >
          Cargar plantilla
        </button>
        {showTemplates && <TemplateManager onClose={() => setShowTemplates(false)} />}
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-gray-50 md:flex-row">

      {/* Mapa */}
      <div className="h-[50vh] shrink-0 md:h-full md:w-[60%]">
        <RouteMap />
      </div>

      {/* Panel */}
      <div className="flex min-h-0 flex-1 flex-col md:w-[40%] md:border-l md:border-gray-200">

        {/* Header */}
        <header className="shrink-0 border-b border-gray-200 bg-white px-4 py-3 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              {editingName ? (
                <input
                  autoFocus
                  value={nameValue}
                  onChange={(e) => setNameValue(e.target.value)}
                  onBlur={commitName}
                  onKeyDown={(e) => e.key === 'Enter' && commitName()}
                  aria-label="Nombre de la ruta"
                  className="w-full rounded border border-[#0EA5A0] px-2 py-0.5 text-lg font-semibold focus:outline-none"
                />
              ) : (
                <button
                  onClick={startEditName}
                  aria-label="Editar nombre de la ruta"
                  className="w-full truncate text-left text-lg font-semibold text-gray-800 hover:text-[#0EA5A0]"
                >
                  {currentRoute.name}
                </button>
              )}
              {totalCount > 0 && (
                <p className="text-xs text-gray-500">
                  {visitedCount} de {totalCount} visitadas
                </p>
              )}
            </div>
            <div className="flex shrink-0 gap-1">
              <button
                onClick={() => setShowTemplates(true)}
                aria-label="Gestionar plantillas"
                title="Plantillas"
                className="rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
              >
                📋
              </button>
              <button
                onClick={() => {
                  if (
                    !currentRoute.stops.length ||
                    window.confirm('¿Crear una nueva ruta? La actual se guardará.')
                  ) {
                    newRoute('Mi ruta');
                  }
                }}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
              >
                Nueva
              </button>
            </div>
          </div>
        </header>

        {/* Error banner */}
        {error && (
          <div
            role="alert"
            className="mx-4 mt-3 shrink-0 flex items-start justify-between gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            <span>{error}</span>
            <button onClick={clearError} aria-label="Cerrar error" className="shrink-0 font-bold">
              ✕
            </button>
          </div>
        )}

        {/* Stop form */}
        <div className="shrink-0">
          <StopForm />
        </div>

        {/* Optimize button */}
        {currentRoute.stops.length >= 2 && (
          <div className="shrink-0 px-4 pb-2">
            <button
              onClick={() => void optimize()}
              disabled={isOptimizing}
              className="w-full rounded-xl bg-[#0EA5A0] py-3 text-base font-semibold text-white shadow-sm disabled:opacity-60 active:scale-[0.98]"
            >
              {isOptimizing ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Optimizando…
                </span>
              ) : (
                'Optimizar ruta'
              )}
            </button>
          </div>
        )}

        {/* Stop list — scrollable */}
        <div className="flex-1 overflow-y-auto">
          <StopList />

          {/* Deeplinks — solo con ruta optimizada */}
          {currentRoute.optimizedOrder && currentRoute.stops.length >= 2 && (
            <div className="flex flex-col gap-2 px-4 pb-6 pt-2">
              <a
                href={openInGoogleMapsWeb(
                  currentRoute.optimizedOrder
                    .map((id) => currentRoute.stops.find((s) => s.id === id))
                    .filter((s): s is NonNullable<typeof s> => s !== undefined),
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-base font-semibold text-white shadow-sm active:scale-[0.98]"
              >
                Abrir en Google Maps
              </a>
              <a
                href={openInWazeWeb(
                  currentRoute.optimizedOrder
                    .map((id) => currentRoute.stops.find((s) => s.id === id))
                    .filter((s): s is NonNullable<typeof s> => s !== undefined),
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white py-3 text-base font-medium text-gray-700 shadow-sm active:scale-[0.98]"
              >
                Abrir en Waze
              </a>
              <p className="text-center text-xs text-gray-400">
                Waze abre la primera parada pendiente. Continúa el resto manualmente.
              </p>
            </div>
          )}
        </div>
      </div>

      {showTemplates && <TemplateManager onClose={() => setShowTemplates(false)} />}
    </div>
  );
}

export default App;
