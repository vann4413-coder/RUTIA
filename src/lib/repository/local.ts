import type { Route, Template } from '../../types/domain';
import type { Repository } from './types';

const PREFIX = 'rutia:';
const ROUTES_KEY = `${PREFIX}routes`;
const TEMPLATES_KEY = `${PREFIX}templates`;

function load<T>(key: string): Record<string, T> {
  try {
    return JSON.parse(localStorage.getItem(key) ?? '{}') as Record<string, T>;
  } catch {
    return {};
  }
}

function save<T>(key: string, data: Record<string, T>): void {
  localStorage.setItem(key, JSON.stringify(data));
}

export class LocalRepository implements Repository {
  async getRoute(id: string): Promise<Route | null> {
    return load<Route>(ROUTES_KEY)[id] ?? null;
  }

  async listRoutes(): Promise<Route[]> {
    return Object.values(load<Route>(ROUTES_KEY));
  }

  async saveRoute(route: Route): Promise<void> {
    const data = load<Route>(ROUTES_KEY);
    data[route.id] = route;
    save(ROUTES_KEY, data);
  }

  async deleteRoute(id: string): Promise<void> {
    const data = load<Route>(ROUTES_KEY);
    delete data[id];
    save(ROUTES_KEY, data);
  }

  async getTemplate(id: string): Promise<Template | null> {
    return load<Template>(TEMPLATES_KEY)[id] ?? null;
  }

  async listTemplates(): Promise<Template[]> {
    return Object.values(load<Template>(TEMPLATES_KEY));
  }

  async saveTemplate(template: Template): Promise<void> {
    const data = load<Template>(TEMPLATES_KEY);
    data[template.id] = template;
    save(TEMPLATES_KEY, data);
  }

  async deleteTemplate(id: string): Promise<void> {
    const data = load<Template>(TEMPLATES_KEY);
    delete data[id];
    save(TEMPLATES_KEY, data);
  }
}
