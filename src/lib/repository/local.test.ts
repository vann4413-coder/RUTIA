import { beforeEach, describe, expect, it } from 'vitest';
import { LocalRepository } from './local';
import type { Route, Template } from '../../types/domain';

function makeRoute(overrides: Partial<Route> = {}): Route {
  return {
    id: 'r1',
    name: 'Ruta test',
    stops: [],
    createdAt: 1000,
    updatedAt: 1000,
    ...overrides,
  };
}

function makeTemplate(overrides: Partial<Template> = {}): Template {
  return {
    id: 't1',
    name: 'Plantilla test',
    stops: [],
    createdAt: 1000,
    ...overrides,
  };
}

describe('LocalRepository — Route', () => {
  let repo: LocalRepository;

  beforeEach(() => {
    localStorage.clear();
    repo = new LocalRepository();
  });

  it('devuelve null para una ruta inexistente', async () => {
    expect(await repo.getRoute('no-existe')).toBeNull();
  });

  it('guarda y recupera una ruta', async () => {
    const route = makeRoute();
    await repo.saveRoute(route);
    expect(await repo.getRoute(route.id)).toEqual(route);
  });

  it('lista las rutas guardadas', async () => {
    await repo.saveRoute(makeRoute({ id: 'r1' }));
    await repo.saveRoute(makeRoute({ id: 'r2', name: 'Segunda' }));
    const list = await repo.listRoutes();
    expect(list).toHaveLength(2);
  });

  it('lista vacía cuando no hay rutas', async () => {
    expect(await repo.listRoutes()).toEqual([]);
  });

  it('sobreescribe una ruta existente (update)', async () => {
    await repo.saveRoute(makeRoute({ name: 'Original' }));
    await repo.saveRoute(makeRoute({ name: 'Actualizada' }));
    const saved = await repo.getRoute('r1');
    expect(saved?.name).toBe('Actualizada');
  });

  it('elimina una ruta', async () => {
    await repo.saveRoute(makeRoute());
    await repo.deleteRoute('r1');
    expect(await repo.getRoute('r1')).toBeNull();
    expect(await repo.listRoutes()).toHaveLength(0);
  });

  it('no falla al eliminar una ruta inexistente', async () => {
    await expect(repo.deleteRoute('no-existe')).resolves.toBeUndefined();
  });
});

describe('LocalRepository — Template', () => {
  let repo: LocalRepository;

  beforeEach(() => {
    localStorage.clear();
    repo = new LocalRepository();
  });

  it('devuelve null para una plantilla inexistente', async () => {
    expect(await repo.getTemplate('no-existe')).toBeNull();
  });

  it('guarda y recupera una plantilla', async () => {
    const tmpl = makeTemplate();
    await repo.saveTemplate(tmpl);
    expect(await repo.getTemplate(tmpl.id)).toEqual(tmpl);
  });

  it('lista las plantillas guardadas', async () => {
    await repo.saveTemplate(makeTemplate({ id: 't1' }));
    await repo.saveTemplate(makeTemplate({ id: 't2', name: 'Segunda' }));
    const list = await repo.listTemplates();
    expect(list).toHaveLength(2);
  });

  it('lista vacía cuando no hay plantillas', async () => {
    expect(await repo.listTemplates()).toEqual([]);
  });

  it('sobreescribe una plantilla existente (update)', async () => {
    await repo.saveTemplate(makeTemplate({ name: 'Original' }));
    await repo.saveTemplate(makeTemplate({ name: 'Actualizada' }));
    const saved = await repo.getTemplate('t1');
    expect(saved?.name).toBe('Actualizada');
  });

  it('elimina una plantilla', async () => {
    await repo.saveTemplate(makeTemplate());
    await repo.deleteTemplate('t1');
    expect(await repo.getTemplate('t1')).toBeNull();
    expect(await repo.listTemplates()).toHaveLength(0);
  });

  it('no falla al eliminar una plantilla inexistente', async () => {
    await expect(repo.deleteTemplate('no-existe')).resolves.toBeUndefined();
  });

  it('rutas y plantillas usan claves separadas en localStorage', async () => {
    await repo.saveRoute(makeRoute({ id: 't1' }));
    await repo.saveTemplate(makeTemplate({ id: 't1' }));
    const route = await repo.getRoute('t1');
    const tmpl = await repo.getTemplate('t1');
    expect(route?.name).toBe('Ruta test');
    expect(tmpl?.name).toBe('Plantilla test');
  });
});
