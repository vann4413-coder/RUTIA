import { create } from 'zustand';
import { repo } from '../lib/repository';
import { geocode } from '../lib/mapbox';
import { optimizeRoute } from '../lib/mapbox';
import type { Route, Stop, Template } from '../types/domain';

type RouteState = {
  currentRoute: Route | null;
  isOptimizing: boolean;
  isGeocoding: boolean;
  error: string | null;
};

type RouteActions = {
  newRoute: (name: string) => void;
  addStop: (address: string) => Promise<void>;
  removeStop: (id: string) => void;
  reorderStops: (newOrder: string[]) => void;
  updateStop: (id: string, patch: Partial<Stop>) => void;
  markVisited: (id: string, visited: boolean) => void;
  optimize: () => Promise<void>;
  saveCurrentAsTemplate: (name: string) => Promise<void>;
  loadTemplate: (id: string) => Promise<void>;
  persist: () => Promise<void>;
  clearError: () => void;
};

function uid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

let persistTimer: ReturnType<typeof setTimeout> | null = null;

export const useRouteStore = create<RouteState & RouteActions>((set, get) => ({
  currentRoute: null,
  isOptimizing: false,
  isGeocoding: false,
  error: null,

  newRoute(name) {
    const route: Route = {
      id: uid(),
      name,
      stops: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    set({ currentRoute: route, error: null });
  },

  async addStop(address) {
    set({ isGeocoding: true, error: null });
    try {
      const current = get().currentRoute;
      const proximity = current?.stops.length
        ? { lng: current.stops[current.stops.length - 1]!.lng, lat: current.stops[current.stops.length - 1]!.lat }
        : { lng: 2.4449, lat: 41.5388 };

      const result = await geocode(address, proximity);
      const stop: Stop = {
        id: uid(),
        address: address, // texto exacto que escribió el usuario
        lng: result.lng,
        lat: result.lat,
        visited: false,
      };

      set((s) => ({
        currentRoute: s.currentRoute
          ? { ...s.currentRoute, stops: [...s.currentRoute.stops, stop], updatedAt: Date.now() }
          : { id: uid(), name: 'Nueva ruta', stops: [stop], createdAt: Date.now(), updatedAt: Date.now() },
      }));
      get().persist();
    } catch (e) {
      set({ error: `No se pudo añadir la parada: ${e instanceof Error ? e.message : 'Error desconocido'}` });
    } finally {
      set({ isGeocoding: false });
    }
  },

  removeStop(id) {
    set((s) => ({
      currentRoute: s.currentRoute
        ? {
            ...s.currentRoute,
            stops: s.currentRoute.stops.filter((stop) => stop.id !== id),
            optimizedOrder: s.currentRoute.optimizedOrder?.filter((oid) => oid !== id),
            updatedAt: Date.now(),
          }
        : null,
    }));
    get().persist();
  },

  reorderStops(newOrder) {
    set((s) => {
      if (!s.currentRoute) return {};
      const map = Object.fromEntries(s.currentRoute.stops.map((stop) => [stop.id, stop]));
      const stops = newOrder.map((id) => map[id]).filter((s): s is Stop => s !== undefined);
      return { currentRoute: { ...s.currentRoute, stops, updatedAt: Date.now() } };
    });
    get().persist();
  },

  updateStop(id, patch) {
    set((s) => ({
      currentRoute: s.currentRoute
        ? {
            ...s.currentRoute,
            stops: s.currentRoute.stops.map((stop) => (stop.id === id ? { ...stop, ...patch } : stop)),
            updatedAt: Date.now(),
          }
        : null,
    }));
    get().persist();
  },

  markVisited(id, visited) {
    get().updateStop(id, { visited });
  },

  async optimize() {
    const { currentRoute } = get();
    if (!currentRoute || currentRoute.stops.length < 2) {
      set({ error: 'Añade al menos 2 paradas para optimizar la ruta.' });
      return;
    }
    set({ isOptimizing: true, error: null });
    try {
      const optimizedOrder = await optimizeRoute(currentRoute.stops);
      set((s) => ({
        currentRoute: s.currentRoute
          ? { ...s.currentRoute, optimizedOrder, updatedAt: Date.now() }
          : null,
      }));
      get().persist();
    } catch (e) {
      set({ error: `Error al optimizar: ${e instanceof Error ? e.message : 'Error desconocido'}` });
    } finally {
      set({ isOptimizing: false });
    }
  },

  async saveCurrentAsTemplate(name) {
    const { currentRoute } = get();
    if (!currentRoute) return;
    const template: Template = {
      id: uid(),
      name,
      stops: currentRoute.stops.map(({ visited: _v, ...rest }) => rest),
      createdAt: Date.now(),
    };
    try {
      await repo.saveTemplate(template);
    } catch (e) {
      set({ error: `Error al guardar plantilla: ${e instanceof Error ? e.message : 'Error desconocido'}` });
    }
  },

  async loadTemplate(id) {
    try {
      const template = await repo.getTemplate(id);
      if (!template) { set({ error: 'Plantilla no encontrada.' }); return; }
      const route: Route = {
        id: uid(),
        name: template.name,
        stops: template.stops.map((s) => ({ ...s, visited: false })),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      set({ currentRoute: route, error: null });
      get().persist();
    } catch (e) {
      set({ error: `Error al cargar plantilla: ${e instanceof Error ? e.message : 'Error desconocido'}` });
    }
  },

  async persist() {
    const { currentRoute } = get();
    if (!currentRoute) return;
    if (persistTimer) clearTimeout(persistTimer);
    persistTimer = setTimeout(async () => {
      try {
        await repo.saveRoute(currentRoute);
      } catch (e) {
        console.error('Error al persistir ruta:', e);
      }
    }, 500);
  },

  clearError() {
    set({ error: null });
  },
}));
