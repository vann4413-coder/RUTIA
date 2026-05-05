import { useState, useEffect } from 'react';
import { useRouteStore } from '../store/routeStore';
import { repo } from '../lib/repository';
import type { Template } from '../types/domain';

type Props = {
  onClose: () => void;
};

export function TemplateManager({ onClose }: Props) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [saveName, setSaveName] = useState('');
  const [view, setView] = useState<'load' | 'save'>('load');
  const [loading, setLoading] = useState(false);

  const saveCurrentAsTemplate = useRouteStore((s) => s.saveCurrentAsTemplate);
  const loadTemplate = useRouteStore((s) => s.loadTemplate);
  const currentRoute = useRouteStore((s) => s.currentRoute);

  useEffect(() => {
    repo.listTemplates().then(setTemplates).catch(console.error);
  }, []);

  async function handleSave() {
    const name = saveName.trim();
    if (!name) return;
    setLoading(true);
    await saveCurrentAsTemplate(name);
    const updated = await repo.listTemplates();
    setTemplates(updated);
    setSaveName('');
    setView('load');
    setLoading(false);
  }

  async function handleLoad(id: string) {
    await loadTemplate(id);
    onClose();
  }

  async function handleDelete(id: string) {
    if (!window.confirm('¿Eliminar esta plantilla?')) return;
    await repo.deleteTemplate(id);
    setTemplates((prev) => prev.filter((t) => t.id !== id));
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Gestionar plantillas"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 md:items-center"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md rounded-t-2xl bg-white p-5 shadow-xl md:rounded-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">Plantillas</h2>
          <button onClick={onClose} aria-label="Cerrar" className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="mb-4 flex rounded-lg border border-gray-200 p-1">
          {(['load', 'save'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setView(tab)}
              className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-colors ${
                view === tab ? 'bg-[#0EA5A0] text-white' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab === 'load' ? 'Cargar' : 'Guardar actual'}
            </button>
          ))}
        </div>

        {view === 'save' && (
          <div className="flex gap-2">
            <input
              type="text"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && void handleSave()}
              placeholder="Nombre de la plantilla…"
              aria-label="Nombre de la plantilla"
              disabled={!currentRoute || loading}
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0EA5A0] disabled:opacity-50"
            />
            <button
              onClick={() => void handleSave()}
              disabled={!saveName.trim() || !currentRoute || loading}
              className="rounded-lg bg-[#0EA5A0] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {loading ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        )}

        {view === 'load' && (
          <div className="max-h-72 overflow-y-auto">
            {templates.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-400">No hay plantillas guardadas.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {templates.map((t) => (
                  <li
                    key={t.id}
                    className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-800">{t.name}</p>
                      <p className="text-xs text-gray-400">{t.stops.length} paradas</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => void handleLoad(t.id)}
                        className="rounded-lg bg-[#0EA5A0] px-3 py-1 text-xs font-medium text-white"
                      >
                        Cargar
                      </button>
                      <button
                        onClick={() => void handleDelete(t.id)}
                        aria-label="Eliminar plantilla"
                        className="rounded-lg border border-gray-200 px-3 py-1 text-xs text-red-500 hover:bg-red-50"
                      >
                        Eliminar
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
