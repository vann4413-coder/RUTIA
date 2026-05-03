# Despliegue y compartición — Rutia

Guía paso a paso de cómo pasar del código en tu máquina a una app que tus voluntarios y comerciales puedan usar en el móvil. **No empieces con Google Play.** Lee la sección "Filosofía" antes que nada.

---

## Filosofía: PWA primero, stores después

**Para el MVP no usamos Google Play ni App Store.** Razones:

- Subir a stores es burocracia (cuentas de desarrollador, revisiones de 1-7 días, políticas, capturas, descripciones, edad, privacidad…).
- No aporta nada cuando todavía no sabes si la app sirve.
- Una PWA bien hecha **se instala en el móvil con un icono igual que una app nativa**, funciona offline, y se actualiza al instante sin pasar por revisión de Google ni Apple.
- Cero coste vs 25 $ (Google) + 99 $/año (Apple).

El plan es: **PWA → validar con usuarios reales → si funciona y hay demanda, entonces stores**.

---

## Requisitos previos (instalar una sola vez)

- **Node.js** versión LTS: https://nodejs.org
- **Git**: https://git-scm.com
- **Visual Studio Code**: https://code.visualstudio.com
- **Claude Code**: https://docs.claude.com/en/docs/claude-code
- Cuenta gratis en:
  - **GitHub**: https://github.com (sin tarjeta)
  - **Vercel**: https://vercel.com (sin tarjeta, login con GitHub)
  - **Mapbox**: https://account.mapbox.com (sin tarjeta para empezar)

---

## Antes de abrir Claude Code

1. **Token de Mapbox**: en https://account.mapbox.com → "Tokens" → copia el `Default public token` (empieza por `pk.`). Guárdalo, lo necesitarás luego en `.env.local` y en Vercel. Cuando tengas el dominio definitivo, vuelve a este token y restringe los "URL allowlist" para que solo funcione desde tu dominio (esto evita que alguien te robe el token y te queme la cuota).
2. Crea una carpeta nueva en tu ordenador, por ejemplo `~/proyectos/rutia/`.
3. Mete dentro `CLAUDE.md` y `PROMPTS.md`.
4. Abre VS Code apuntando a esa carpeta.

---

## Desarrollo en local

Después del Prompt 1 de `PROMPTS.md`, Claude Code habrá creado el proyecto. Para verlo en tu navegador mientras desarrollas:

```bash
npm install         # solo la primera vez (Claude Code suele hacerlo)
cp .env.example .env.local
# edita .env.local y pega tu token de Mapbox
npm run dev
```

Abre `http://localhost:5173`. Cualquier cambio se refleja en caliente.

**Para probar en tu móvil mientras desarrollas** (sin desplegar todavía):

```bash
npm run dev -- --host
```

Vite te dará una IP de tu red local (ej. `http://192.168.1.42:5173`). Si tu móvil está en la misma WiFi, abre esa URL desde el móvil. Útil para probar la voz, el mapa táctil, etc.

---

## Despliegue: GitHub + Vercel (gratis)

### 1. Subir el código a GitHub

Desde la carpeta del proyecto, en la terminal:

```bash
git init
git add .
git commit -m "feat: MVP inicial de Rutia"
```

En github.com → "New repository" → nombre `rutia` → privado o público (igual da) → **NO marques** "Add README" ni `.gitignore` (ya los tiene Claude Code).

GitHub te dará dos comandos para conectar; serán algo como:

```bash
git remote add origin git@github.com:TU_USUARIO/rutia.git
git branch -M main
git push -u origin main
```

### 2. Conectar Vercel

1. Entra en https://vercel.com con tu cuenta de GitHub.
2. "Add New..." → "Project".
3. Importa el repo `rutia`.
4. **Importante**: en la pantalla de configuración, antes de darle a Deploy:
   - Framework Preset: Vite (lo detecta solo).
   - Build Command: `npm run build` (por defecto).
   - Output Directory: `dist` (por defecto).
   - **Environment Variables**: añade una llamada `VITE_MAPBOX_TOKEN` con el valor de tu token. Sin esto la app petará al cargar el mapa.
5. "Deploy". En 30-60 segundos te da la URL.

Tu URL será algo como `rutia-vane.vercel.app`. **Esta es tu app online, gratis, con HTTPS, lista para compartir.**

### 3. Despliegues posteriores

Cada `git push` a la rama `main` redeploya automáticamente. No tienes que hacer nada más en Vercel.

---

## Cómo lo comparten (y cómo lo "instalan" en el móvil)

### Compartir

Mandas la URL `rutia-tuyo.vercel.app` por WhatsApp, SMS, lo que sea.

### Instalación en Android (Chrome)

1. Abrir la URL en Chrome.
2. Si la PWA está bien configurada (Prompt 8 lo hace), aparece un **banner inferior** "Instalar Rutia" o "Añadir a pantalla de inicio".
3. Si no aparece, el usuario va al menú de los tres puntos → "Instalar aplicación" / "Añadir a pantalla de inicio".
4. Aparece el icono en el escritorio del móvil. Al pulsarlo abre en pantalla completa, sin barra de Chrome.

### Instalación en iPhone (Safari)

1. Abrir la URL en **Safari** (no Chrome iOS, no funciona igual).
2. Botón "Compartir" (cuadrado con flecha hacia arriba) → desplazarse en la lista → **"Añadir a pantalla de inicio"**.
3. Aparece el icono. Pantalla completa, sin barra.

**Limitaciones de iOS** que conviene saber: Safari iOS soporta PWA pero con menos features que Android. Por ejemplo, las notificaciones push solo funcionan en iOS 16.4+. La voz (Web Speech API) funciona desde iOS 14.5. Para Rutia esto está bien, pero si en el futuro quieres push notifications nativas en iOS antiguos, tocará app nativa.

---

## Dominio propio (opcional, recomendado en cuanto se lo enseñes a alguien)

`rutia-vane.vercel.app` funciona pero suena a hobby. En cuanto pases a enseñárselo a comerciales que pagarían, compra un dominio.

1. Compra el dominio en **Cloudflare Registrar** (los más baratos, sin sobreprecios) o **Namecheap**. Coste: 8-15 €/año para `.app`, `.com` o `.es`.
2. En Vercel: Project → Settings → Domains → Add → escribes `rutia.app` (o el que sea).
3. Vercel te dice qué registros DNS añadir en tu proveedor del dominio. Pegas y esperas 5-30 min.
4. **Vuelve al dashboard de Mapbox** y añade el dominio nuevo a la URL allowlist del token.

---

## Roadmap a stores (cuando tengas validación, NO antes)

Señales de que ya toca dar este paso:
- Has usado la PWA personalmente al menos un mes en rutas reales.
- Tienes 5+ usuarios distintos usándola con regularidad.
- Alguien te ha dicho "yo pagaría por esto" o "¿está en Google Play?".
- Tu modelo de negocio está claro (free/pro, qué cobras, etc.).

### Google Play (Android)

La forma más rápida de subir una PWA a Google Play es con **PWABuilder** o **Bubblewrap** (ambas de Google/Microsoft, gratuitas).

**Con PWABuilder** (lo más simple):
1. https://www.pwabuilder.com → metes tu URL de Vercel.
2. Te puntúa la PWA y arregla lo que falte.
3. "Package for stores" → Android → descargas un `.aab` listo.
4. Sigues los pasos para firmarlo.

**Cuenta de desarrollador de Google Play**: https://play.google.com/console → 25 $ pago único, de por vida. Verificación de identidad obligatoria (foto del DNI), tarda 1-3 días.

**Subir el AAB**: Google Play Console → "Crear aplicación" → rellenas ficha (nombre, descripción, capturas, política de privacidad obligatoria, clasificación de contenido) → subes el AAB a producción o a "test interno" primero. Revisión: 1-7 días la primera vez, después suele ser horas.

**Truco**: empieza con "test interno" o "test cerrado" con una lista de testers (sus emails de Google). Apruebas cambios sin pasar por revisión completa. Cuando esté pulido, promocionas a producción.

### App Store (iOS)

Más burocracia. Para enviar una PWA a App Store no basta con PWABuilder, necesitas envolverla con **Capacitor** (https://capacitorjs.com) o convertirla a una app híbrida real.

**Pasos generales**:
1. `npm install @capacitor/core @capacitor/ios @capacitor/cli`
2. `npx cap init` y seguir asistente.
3. `npx cap add ios`.
4. Necesitas un Mac con Xcode para compilar. Si no tienes Mac, alquila uno por horas en MacInCloud o similar.
5. **Cuenta de Apple Developer**: 99 $/año. Verificación: 1-2 días.
6. Subir build con Xcode a App Store Connect → rellenar ficha → enviar a revisión. Primera revisión suele tener pegas (Apple es estricto), prepárate para 1-2 iteraciones. Tiempo total: 1-3 semanas la primera vez.

**Política de Apple a tener en cuenta**: si Rutia tiene suscripciones, Apple se queda el 15-30 %. Para evitar esto, mucha gente vende la suscripción solo en la web (Stripe) y en la app iOS bloquea la compra dentro de app. Es legal, pero la app debe ofrecer login con la cuenta web. Esto se decide en fase 2.

---

## Política de privacidad (la necesitas en cuanto subas a stores o cobres)

Aunque el MVP no tenga backend ni recoja datos, **en cuanto cobres o subas a stores necesitas política de privacidad y aviso legal**. Para empezar te vale una plantilla:

- https://www.iubenda.com (de pago, completo)
- https://app-privacy-policy-generator.firebaseapp.com (gratis, suficiente para empezar)
- Si Rutia recoge direcciones de clientes de tus usuarios (comerciales), tu usuario es responsable de esos datos pero tú como prestador del servicio también tienes obligaciones bajo GDPR. Investiga "encargado de tratamiento" cuando llegue el momento.

---

## Resumen visual

| Etapa | Qué tienes | Quién lo usa | Coste | Tiempo |
|---|---|---|---|---|
| Desarrollo | `localhost:5173` | Tú probando | 0 € | Inmediato |
| MVP online | `rutia-xxx.vercel.app` | Tú en rutas reales | 0 € | 30 min |
| Compartido | URL por WhatsApp, instalada como PWA | Voluntarios + comerciales testeando | 0 € | 1 minuto cada usuario |
| Dominio propio | `rutia.app` | Igual, pero más serio | ~10 €/año | 30 min |
| Backend + suscripciones | Login, datos en la nube, pago | Usuarios de pago | ~10-30 €/mes | 2-4 semanas extra |
| Google Play | App descargable Android | Cualquiera buscando en Play Store | 25 € (único) | 1-2 semanas primera vez |
| App Store | App descargable iOS | Cualquiera buscando en App Store | 99 €/año + Mac | 2-4 semanas primera vez |

---

## Checklist antes de cada release a producción

- [ ] `npm run build` pasa sin errores ni warnings.
- [ ] `npm run test` pasa.
- [ ] Probado en viewport 375x667 (iPhone SE) y 390x844 (iPhone 14).
- [ ] Probado el flujo completo: añadir paradas → optimizar → exportar a Google Maps.
- [ ] Probada la voz al menos en Chrome Android.
- [ ] El token de Mapbox tiene URL allowlist con el dominio de producción.
- [ ] PWA: el manifest se carga sin errores (DevTools → Application → Manifest).
- [ ] PWA: el service worker se registra (DevTools → Application → Service Workers).
- [ ] Lighthouse PWA score > 90 (DevTools → Lighthouse).
