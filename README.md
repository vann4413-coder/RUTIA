# Rutia — Optimizador de rutas multiparada

PWA para optimizar rutas multiparada con control por voz. Pensada para rutas de voluntariado y rutas comerciales. Funciona sin conexión tras la primera carga y se instala en el móvil como una app nativa.

**Stack:** Vite + React 18 + TypeScript · Tailwind CSS · Zustand · Mapbox GL JS · Web Speech API · vite-plugin-pwa

---

## Correr en local

```bash
git clone https://github.com/TU_USUARIO/rutia.git
cd rutia
npm install
cp .env.example .env.local
# Edita .env.local y pega tu token de Mapbox
npm run dev
```

Abre `http://localhost:5173`.

Para probar en el móvil en la misma WiFi:

```bash
npm run dev -- --host
```

### Obtener un token de Mapbox gratis

1. Crea una cuenta en https://account.mapbox.com (sin tarjeta).
2. Ve a **Tokens** → copia el `Default public token` (empieza por `pk.`).
3. Pégalo en `.env.local` como `VITE_MAPBOX_TOKEN=pk.xxxxx`.
4. Cuando tengas el dominio de producción, añádelo al **URL allowlist** del token.

---

## Desplegar en Vercel (gratis)

1. Sube el código a GitHub:
   ```bash
   git push -u origin main
   ```
2. Entra en https://vercel.com → **Add New → Project** → importa el repo.
3. En la pantalla de configuración, añade la variable de entorno:
   - Nombre: `VITE_MAPBOX_TOKEN`
   - Valor: tu token de Mapbox
4. Haz clic en **Deploy**. En ~60 segundos tendrás la URL.

Cada `git push` a `main` redeploya automáticamente.

---

## Instalar en el móvil (PWA)

**Android (Chrome):** Abre la URL → menú de los tres puntos → *Instalar aplicación* o *Añadir a pantalla de inicio*.

**iPhone (Safari):** Abre la URL en Safari → botón Compartir → *Añadir a pantalla de inicio*.

---

## Comandos

```bash
npm run dev      # Desarrollo con HMR
npm run build    # Build de producción
npm run preview  # Previsualizar build
npm run test     # Tests Vitest
npm run lint     # ESLint
npm run format   # Prettier
```

---

## Roadmap fase 2

La capa `src/lib/repository/` implementa una interfaz `Repository` abstracta. Cambiar de localStorage a Supabase o cualquier backend REST solo requiere crear una nueva implementación de esa interfaz sin tocar componentes ni stores.

Funcionalidades previstas para fase 2:
- Autenticación (Supabase Auth)
- Datos sincronizados en la nube
- Suscripciones (Stripe)
- Historial de rutas
- Notificaciones push
