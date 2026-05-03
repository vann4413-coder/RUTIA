# Prompts para Claude Code

Ejecutar **uno a uno**, en sesiones separadas. Tras cada uno: revisar, probar, commit, siguiente.

Antes del primer prompt, asegúrate de que `CLAUDE.md` está en la raíz del proyecto.

---

## Prompt 1 — Setup inicial

```
Lee el archivo CLAUDE.md de la raíz antes de cualquier acción.

Inicializa un proyecto nuevo con:
- Vite + React 18 + TypeScript estricto (tsconfig con strict: true, noUncheckedIndexedAccess, noImplicitOverride)
- Tailwind CSS configurado
- Zustand instalado
- @dnd-kit/core y @dnd-kit/sortable instalados
- vite-plugin-pwa instalado y configurado básicamente
- Vitest configurado
- ESLint + Prettier configurados con reglas razonables

Crea la estructura de carpetas exacta que indica CLAUDE.md, con archivos placeholder vacíos donde corresponda.

Crea .env.example con VITE_MAPBOX_TOKEN.
Crea .gitignore que incluya .env.local y node_modules.

App.tsx debe renderizar simplemente "Rutia" con Tailwind aplicado, para verificar que todo funciona.

NO instales nada que no esté listado arriba o en CLAUDE.md.
```

---

## Prompt 2 — Capa Repository

```
Implementa la capa de persistencia abstracta en src/lib/repository/.

1. En types.ts define la interface Repository con métodos CRUD asíncronos para Route y Template:
   - getRoute(id), listRoutes(), saveRoute(route), deleteRoute(id)
   - getTemplate(id), listTemplates(), saveTemplate(template), deleteTemplate(id)
   Todos los métodos devuelven Promises aunque la implementación local sea síncrona, para preparar el cambio a backend remoto.

2. En local.ts implementa LocalRepository: guarda en localStorage con prefijo 'rutia:'. Serializa con JSON.

3. En index.ts exporta una instancia singleton: export const repo: Repository = new LocalRepository().

4. En src/types/domain.ts define los tipos Stop, Route y Template como en CLAUDE.md.

5. Tests con Vitest en src/lib/repository/local.test.ts cubriendo create, read, update, delete y listado para Route y Template. Usa happy-dom o jsdom para simular localStorage.

Importante: ningún componente debe importar nunca de 'localStorage' directamente. Solo del repo singleton.
```

---

## Prompt 3 — Mapbox y algoritmo TSP

```
Implementa src/lib/mapbox.ts y src/lib/tsp.ts.

mapbox.ts:
- geocode(query: string, proximity?: {lng, lat}): Promise<GeocodeResult> usando Mapbox Geocoding API v6, sesgado a España. Devuelve el primer match con lng, lat, placeName.
- optimizeRouteRemote(stops: Stop[]): Promise<string[]> usando Mapbox Optimization API v1, devuelve los ids en orden óptimo. Solo válido hasta 12 paradas (límite de la API).
- Usa import.meta.env.VITE_MAPBOX_TOKEN.
- Tipos discriminados para errores: NetworkError | RateLimitError | NotFoundError | InvalidTokenError.

tsp.ts:
- Implementa optimizeRouteLocal(stops: Stop[]): string[]:
  - Calcula matriz de distancias haversine entre paradas.
  - Nearest-neighbor desde la primera parada para solución inicial.
  - Mejora con 2-opt hasta convergencia o 1000 iteraciones.
  - Devuelve los ids en orden óptimo.
- Función pública optimizeRoute(stops): si stops.length <= 12 usa optimizeRouteRemote, si no, usa optimizeRouteLocal.

Tests para tsp.ts en src/lib/tsp.test.ts con casos conocidos: ruta de 4 puntos en cuadrado (orden esperado), ruta de 8 puntos aleatorios (verificar que la distancia total mejora vs orden de entrada).

NO añadas dependencias nuevas. La haversine se calcula a mano.
```

---

## Prompt 4 — Store de Zustand y pantalla principal

```
Crea src/store/routeStore.ts con Zustand:
- Estado: currentRoute (Route | null), isOptimizing (boolean), error (string | null).
- Acciones:
  - newRoute(name)
  - addStop(address) — geocodifica y añade
  - removeStop(id)
  - reorderStops(newOrder: string[])
  - updateStop(id, patch)
  - markVisited(id, visited: boolean)
  - optimize()
  - saveCurrentAsTemplate(name)
  - loadTemplate(id)
  - persist() — guarda currentRoute vía repo
- Las acciones que tocan async hacen su propio try/catch y dejan error legible.

Crea la pantalla principal en App.tsx (de momento sin router):
- Header con nombre de la ruta editable inline (input que se ve como texto hasta hover/focus).
- StopForm: input de texto + botón micrófono (deshabilitado de momento, lo conectamos en prompt 6) + botón "Añadir".
- StopList con drag-to-reorder usando @dnd-kit/sortable. Cada parada muestra: número, dirección, nota (si tiene), botón llamar (si tiene phone), checkbox visitada, botón eliminar.
- Botón grande "Optimizar ruta" que llama a optimize() del store.
- Estados de carga (skeleton o spinner) mientras geocodifica u optimiza.
- Mensajes de error con botón cerrar.

Mobile-first: layout en columna a 375px, lista debajo del formulario.

Usa los colores de la paleta de CLAUDE.md.
```

---

## Prompt 5 — Mapa Mapbox

```
Crea src/components/RouteMap.tsx usando mapbox-gl (instálalo si no está).

- Mapa centrado en Mataró por defecto (lat 41.5388, lng 2.4449), zoom 13.
- Marcadores numerados (1, 2, 3...) en cada parada según el orden actual de currentRoute.stops.
- Si hay optimizedOrder, dibuja la línea uniendo las paradas en ese orden, usando un GeoJSON LineString y un layer.
- fitBounds automático cuando cambian las paradas (con padding razonable).
- En móvil: el mapa ocupa el 50% superior de la pantalla, sticky. La lista va debajo y hace scroll.
- En desktop (>=768px): mapa a la izquierda al 60%, lista a la derecha al 40%.

Importante:
- Cargar el CSS de mapbox-gl desde el paquete.
- Manejar el caso de token inválido: mostrar un mensaje claro al usuario.
- Limpiar el mapa al desmontar.
```

---

## Prompt 6 — Voz con Web Speech API

```
Crea src/lib/voice.ts con un hook useVoiceInput().

- Usa la Web Speech API (window.SpeechRecognition || window.webkitSpeechRecognition).
- Configurado para español: lang = 'es-ES'.
- Devuelve { start, stop, transcript, isListening, error, isSupported }.
- isSupported: false si el navegador no tiene la API (Safari iOS antiguo, algunos navegadores in-app).
- onresult: actualiza transcript en tiempo real.
- onend: deja de escuchar.
- onerror: maneja 'no-speech', 'not-allowed' (permiso denegado), 'network'.

Conecta el botón micrófono del StopForm:
- Si !isSupported: botón deshabilitado con tooltip "Tu navegador no soporta dictado por voz".
- Pulsar empieza a escuchar, ícono cambia a "escuchando" con animación pulse.
- Al terminar (silencio o segundo pulso): el transcript se mete en el input de texto, el usuario puede revisar y darle a "Añadir".
- NO añadir automáticamente la parada: el usuario revisa primero. Mejor UX y menos errores de geocoding.

Pide permiso de micrófono la primera vez y maneja la denegación con un mensaje útil.
```

---

## Prompt 7 — Plantillas, notas, teléfonos y visitadas

```
Implementa la gestión de plantillas y los detalles por parada.

1. Componente TemplateManager.tsx:
   - Botón "Guardar como plantilla" que pide nombre y llama a routeStore.saveCurrentAsTemplate(name).
   - Drawer/modal "Cargar plantilla" que lista templates del repo y permite cargarlas (las paradas se cargan con visited: false).
   - Permitir borrar plantillas con confirmación.

2. En StopList, al pulsar una parada se expande un panel de edición:
   - Alias (label) editable.
   - Nota libre (textarea, max 500 chars).
   - Teléfono (input tipo tel). Si tiene valor, mostrar botón "Llamar" que abre `tel:NUMERO`.
   - Botón "Marcar como visitada" / "Marcar como pendiente". Una parada visitada se ve tachada y con opacidad reducida en la lista.

3. Persistencia: cualquier cambio en stops llama a routeStore.persist() (debounced 500ms).

4. En la cabecera, contador "X de Y visitadas" cuando hay ruta activa.
```

---

## Prompt 8 — Deeplinks Google Maps / Waze + PWA

```
1. src/lib/deeplinks.ts:
   - openInGoogleMaps(stops: Stop[]): string — devuelve URL del tipo `https://www.google.com/maps/dir/?api=1&origin=...&destination=...&waypoints=...&travelmode=driving`. Origen = primera parada, destino = última, resto como waypoints. Usa lng,lat.
   - openInWaze(stops: Stop[]): string — Waze solo soporta un destino vía URL. Si hay múltiples paradas, devuelve URL al destino final con un comentario para el usuario, o alternativamente abre la primera parada y deja al usuario añadir el resto. Documenta la limitación en un comentario.
   - Funciones que detectan plataforma para usar app schemes (`comgooglemaps://`, `waze://`) en iOS/Android cuando estén instaladas, con fallback a https://.

2. Añade dos botones grandes al final de la lista (solo cuando hay ruta optimizada):
   - "Abrir en Google Maps" (azul, primario)
   - "Abrir en Waze" (más discreto)

3. PWA — configura vite-plugin-pwa correctamente:
   - manifest: name "Rutia", short_name "Rutia", theme_color "#0EA5A0", background_color "#ffffff", display "standalone", start_url "/".
   - Iconos 192x192, 512x512 y uno maskable. Genera placeholders simples si no tienes diseño (un círculo teal con "R" blanca centrada en SVG, exportado a PNG).
   - workbox: cachear app shell + tiles de mapbox con NetworkFirst para que funcione offline tras la primera carga.
   - registerType: 'autoUpdate'.
```

---

## Prompt 9 — Pulido, README y deploy a Vercel

```
1. Pulido final:
   - Revisa TODA la app en viewport 375x667 (iPhone SE) y 390x844 (iPhone 14). Arregla cualquier overflow, botón pequeño, texto cortado.
   - Confirma que cada operación async tiene loading + error states.
   - Añade un botón "Nueva ruta" que limpia la actual con confirmación si hay paradas.
   - Confirmaciones nativas (window.confirm) están bien para el MVP, no hace falta modal custom.

2. Crea README.md en la raíz con:
   - Qué es Rutia, capturas (placeholders por ahora).
   - Cómo correr en local: clone, npm install, copiar .env.example a .env.local con tu token de Mapbox, npm run dev.
   - Cómo obtener un token de Mapbox gratis (https://account.mapbox.com).
   - Cómo desplegar a Vercel: 1) push a GitHub, 2) importar repo en vercel.com, 3) añadir variable VITE_MAPBOX_TOKEN en Project Settings → Environment Variables, 4) deploy.
   - Tras deploy: cómo "instalar" en el móvil (Chrome Android: menú → Añadir a pantalla de inicio. Safari iOS: compartir → Añadir a pantalla de inicio).
   - Roadmap fase 2 (auth, backend, suscripciones) referenciando el patrón Repository.

3. Añade vercel.json con buildCommand "npm run build" y outputDirectory "dist".

4. Ejecuta npm run build localmente y verifica que el build pasa sin errores ni warnings de TypeScript.
```

---

## Después de los 9 prompts

Tendrás un MVP usable en local. Para subirlo:

1. Crear repo en GitHub (privado o público, da igual).
2. `git push` el código.
3. Ir a vercel.com, login con GitHub, "Add new project", seleccionar el repo.
4. En Environment Variables añadir `VITE_MAPBOX_TOKEN` con tu token.
5. Deploy. Tendrás URL tipo `rutia-xxx.vercel.app`.
6. Compartes esa URL por WhatsApp.
7. Quien la abra en el móvil podrá "añadir a pantalla de inicio" y usarla como app.
