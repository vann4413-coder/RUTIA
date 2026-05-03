# Rutia — Optimizador de rutas multiparada

## Qué es esto

Web-app PWA para optimizar rutas multiparada con control por voz.

- **Caso de uso inicial**: rutas de voluntariado en Mataró (Cataluña, ES) y rutas comerciales.
- **Tagline**: "Tus rutas, en orden".
- **Diseño**: pensado para escalar a SaaS con backend, autenticación y suscripciones más adelante. Pero el MVP es 100% frontend, sin servidor, sin login, sin pagos.
- **Diferenciadores**: voice-first en español, sin paywall en el MVP, mercado hispanohablante.

## Stack

- Vite + React 18 + TypeScript estricto
- Tailwind CSS
- Zustand para estado global
- @dnd-kit para drag-and-drop de paradas
- Mapbox GL JS + Geocoding API + Optimization API
- Web Speech API nativa del navegador (sin librerías de voz externas)
- localStorage vía capa Repository abstracta
- vite-plugin-pwa para instalación en móvil
- Vitest para tests

## Reglas no negociables

### Persistencia
- TODA persistencia pasa por `src/lib/repository/`. Los componentes y stores NUNCA tocan localStorage directamente.
- La interface `Repository` debe permitir cambiar la implementación a backend remoto (Supabase, REST, etc.) sin modificar componentes ni stores. Esta separación es la clave de la escalabilidad del proyecto.

### Seguridad
- El token de Mapbox va en `.env.local` como `VITE_MAPBOX_TOKEN`. Nunca hardcoded.
- El token debe tener scopes restrictivos en el dashboard de Mapbox (URL allowlist con el dominio de Vercel).
- No usar tokens con permisos de escritura.

### Calidad de código
- TypeScript estricto: nada de `any`, nada de `@ts-ignore` salvo justificación en comentario.
- Componentes funcionales con hooks. Sin clases.
- Cada función pública con tipos explícitos en parámetros y retorno.
- Errores: nunca silenciar. Siempre log + feedback visible al usuario.

### UX
- Mobile-first: probar siempre primero a 375px de ancho.
- Todo el texto de UI en español.
- Estados de carga y error visibles para cualquier operación async.
- Accesible: labels en todos los inputs, roles ARIA donde toque.
- Paleta: primario `#0EA5A0` (teal/aguamarina), neutros con grises Tailwind.

## Lo que NO debes hacer

- No instales Redux ni MobX. Zustand basta para esta app.
- No instales librerías de UI grandes (Material UI, Chakra, Ant Design). Tailwind es suficiente.
- No uses Google Maps SDK ni @react-google-maps/api. El proveedor de mapas es Mapbox.
- No instales librerías externas de reconocimiento de voz. La Web Speech API nativa es la opción.
- No metas backend en este MVP. Si una funcionalidad requiere servidor, anótala como "fase 2" en un TODO y descártala del MVP.
- No uses ningún paquete que no esté justificado en este documento.

## Estructura de carpetas

```
src/
├── components/         # UI reutilizable
│   ├── StopList.tsx
│   ├── StopForm.tsx
│   ├── RouteMap.tsx
│   ├── TemplateManager.tsx
│   └── ui/             # Botones, inputs, etc.
├── lib/
│   ├── repository/     # Capa abstracta de persistencia
│   │   ├── types.ts    # Interface Repository
│   │   ├── local.ts    # Implementación localStorage
│   │   └── index.ts    # export const repo = new LocalRepository()
│   ├── mapbox.ts       # Geocoding + Optimization API
│   ├── tsp.ts          # Algoritmo TSP local (nearest-neighbor + 2-opt)
│   ├── voice.ts        # Hook useVoiceInput() con Web Speech API
│   └── deeplinks.ts    # URLs a Google Maps / Waze
├── store/              # Zustand stores
│   └── routeStore.ts
├── types/              # Tipos compartidos
│   └── domain.ts       # Stop, Route, Template
├── App.tsx
└── main.tsx
public/
├── manifest.webmanifest
└── icons/              # 192x192, 512x512, maskable
```

## Modelo de dominio

```ts
type Stop = {
  id: string;
  address: string;          // texto que escribió el usuario
  label?: string;           // alias opcional ("Casa de María")
  lng: number;
  lat: number;
  note?: string;
  phone?: string;
  visited: boolean;
};

type Route = {
  id: string;
  name: string;
  stops: Stop[];
  optimizedOrder?: string[];   // ids en orden óptimo
  createdAt: number;
  updatedAt: number;
};

type Template = {
  id: string;
  name: string;
  stops: Omit<Stop, 'visited'>[];
  createdAt: number;
};
```

## Variables de entorno

Crear `.env.local` (gitignored) basado en `.env.example`:

```
VITE_MAPBOX_TOKEN=pk.xxxxx
```

## Comandos

- `npm run dev` — desarrollo
- `npm run build` — build de producción
- `npm run preview` — previsualizar build
- `npm run test` — tests Vitest
- `npm run lint` — ESLint
- `npm run format` — Prettier
