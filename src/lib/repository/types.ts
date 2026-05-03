import type { Route, Template } from '../../types/domain';

export interface Repository {
  getRoute(id: string): Promise<Route | null>;
  listRoutes(): Promise<Route[]>;
  saveRoute(route: Route): Promise<void>;
  deleteRoute(id: string): Promise<void>;

  getTemplate(id: string): Promise<Template | null>;
  listTemplates(): Promise<Template[]>;
  saveTemplate(template: Template): Promise<void>;
  deleteTemplate(id: string): Promise<void>;
}
