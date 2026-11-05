# Portal — CMS visual

Editor visual de sitios web (estilo Figma/Canva) con colaboración en vivo, versiones y ramas como GitHub, publicación y
despliegue. Next.js + React, **Postgres** para todos los datos, **ImageKit** para imágenes y videos y un servidor de
**WebSockets** para el tiempo real.

## Antes de empezar

| Necesitas | Versión | Para qué |
|---|---|---|
| [Node.js](https://nodejs.org) | **22.18 o superior** (probado con 26) | la app y los scripts (`.mts` se ejecutan directo) |
| [pnpm](https://pnpm.io) | 11 (`corepack enable` lo trae) | **el único gestor de paquetes**: no uses npm ni yarn |
| [Docker](https://www.docker.com/products/docker-desktop/) | cualquiera reciente | el Postgres de desarrollo (puedes usar uno propio, ver más abajo) |

## Puesta en marcha (5 pasos)

```bash
# 1. Dependencias
corepack enable
pnpm install

# 2. Variables de entorno
cp .env.example .env.local          # en Windows: copy .env.example .env.local

# 3. Base de datos (Postgres en Docker)
pnpm db:up

# 4. Crear tablas, usuario de la app y datos de prueba
pnpm db:setup

# 5. Arrancar la app + el servidor de tiempo real
pnpm dev
```

Abre <http://localhost:3000> e inicia sesión con una cuenta de prueba (se crean en el paso 4, solo en desarrollo):

| Rol | Correo | Contraseña |
|---|---|---|
| Superadministrador | `superadmin@portal.dev` | `SuperAdmin2026!` |
| Desarrollador | `dev@portal.dev` | `Dev2026!` |
| Diseñador | `designer@portal.dev` | `Designer2026!` |

Con eso ya puedes editar, guardar versiones, crear ramas, publicar y ver a otras personas en vivo (abre una segunda
ventana en modo incógnito con otra cuenta). **Imágenes, correo y Redis son opcionales** (ver «Servicios opcionales»).

### El archivo `.env.local`

Lo creas copiando `.env.example`. Para desarrollo local casi todo ya viene bien; lo que importa:

| Variable | Obligatoria | Qué es |
|---|---|---|
| `DATABASE_URL` | sí | conexión de la **app** (usuario `portal_api`, sujeto a las reglas de seguridad por fila). Nunca el dueño de las tablas |
| `DATABASE_ADMIN_URL` | sí, para `db:setup`, `db:seed` y `maintenance` | conexión del **dueño** de las tablas (migraciones y mantenimiento). No la uses en la app |
| `POSTGRES_PORT` | si el 5432 está ocupado | puerto del Postgres de Docker. **Debe coincidir** con el de las dos URLs (en Windows el 5432 a veces está reservado: usa p. ej. `55433`) |
| `PORTAL_ORG_SLUG` / `PORTAL_ORG_NAME` | sí | organización que crea `db:setup`; el slug lleva de 3 a 40 letras minúsculas, números o guiones |
| `AUTH_SECRET` | **sí en producción** | firma las sesiones y los boletos del tiempo real: `openssl rand -base64 48`. En desarrollo hay un valor por defecto |
| `DATA_KEY` | **sí en producción** | cifra las claves guardadas en la base (servidores de despliegue, cabeceras de APIs): `openssl rand -base64 32`. Si la cambias hay que volver a guardar esas claves |
| `APP_URL` | no | dirección pública de la app (enlaces de los correos) |
| `REALTIME_PORT` | no | puerto de los WebSockets (3001 por defecto). Detrás de un proxy: `REALTIME_URL=wss://…` |
| `RESEND_API_KEY`, `RESEND_FROM` | no | correo de «olvidé mi contraseña» ([Resend](https://resend.com)) |
| `IMAGEKIT_PUBLIC_KEY`, `IMAGEKIT_PRIVATE_KEY`, `IMAGEKIT_URL_ENDPOINT` | no | subir imágenes y videos ([ImageKit](https://imagekit.io) › Developer options) |
| `REDIS_URL` | no | solo para correr **varias** instancias del tiempo real |
| `RUN_MAINTENANCE=1` | no | con `pnpm start`, ejecuta la limpieza diaria |

> `.env.local` **nunca se sube a git** (está en `.gitignore`); `.env.example` sí, sin valores secretos.

### Usar tu propio Postgres (sin Docker)

1. Crea la base vacía: `createdb portal` (Postgres 15 o superior; en 18 usa `uuidv7` nativo).
2. Pon en `.env.local` tus datos: `DATABASE_ADMIN_URL` con un usuario que pueda crear roles y tablas, y `DATABASE_URL` con el
   usuario de la app (`portal_api` y la contraseña que quieras; se crea solo).
3. `pnpm db:setup`. Es repetible: aplica solo las migraciones que falten.

## Comandos

| Comando | Qué hace |
|---|---|
| `pnpm dev` | la app (puerto 3000) **y** el servidor de tiempo real (3001), juntos |
| `pnpm dev:web` / `pnpm realtime` | cada uno por separado |
| `pnpm build` · `pnpm start` | producción (`start` también levanta el tiempo real) |
| `pnpm db:up` | Postgres de desarrollo en Docker (`docker compose --profile cluster up -d redis` agrega Redis) |
| `pnpm db:setup` | migraciones + usuario de la app + organización y cuentas de prueba (repetible) |
| `pnpm db:seed` | solo la organización y las cuentas de prueba |
| `pnpm maintenance` | borra de ImageKit lo que nadie usa y limpia datos vencidos (`--dry` solo muestra qué haría) |
| `pnpm test` | pruebas unitarias (vitest) |
| `pnpm lint` · `npx tsc --noEmit` | ESLint y revisión de tipos |

### Pruebas de punta a punta

Necesitan `pnpm dev` y la base arriba (usan las cuentas de prueba y limpian lo que crean):

```bash
node --env-file=.env.local scripts/e2e-site.mts        # guardar y leer el sitio, permisos
node --env-file=.env.local scripts/e2e-versions.mts    # ramas, versiones, pull requests, publicar, issues
node --env-file=.env.local scripts/e2e-realtime.mts    # presencia, cursores y ediciones en vivo
node --env-file=.env.local scripts/e2e-media.mts       # ImageKit y cuota (sube y borra un archivo mínimo de verdad)
sh scripts/e2e-auth.sh                                  # login, usuarios, accesos (limita el restablecer contraseña: 3 por 15 min)
REDIS_URL=redis://127.0.0.1:6379 node --env-file=.env.local scripts/e2e-realtime-cluster.mts   # varias instancias
```

## Servicios opcionales

- **Imágenes y videos (ImageKit):** sin las tres variables `IMAGEKIT_*` el editor funciona, pero no se pueden subir archivos
  (el panel de medios lo avisa). Se aceptan PNG, JPG, WebP, AVIF, GIF, MP4 y WebM.
- **Correo (Resend):** sin él, «olvidé mi contraseña» no envía el enlace.
- **Varias instancias del tiempo real:** `REDIS_URL` en todas. Con una sola instancia no hace falta nada.
- **Instalar librerías desde el editor (pnpm):** solo funciona con `pnpm dev`, nunca en producción.

## Cómo está organizado

```
app/                  la aplicación (Next.js, App Router)
  components/         la interfaz: editor, lienzo, versiones, tiempo real, medios…
  server/             lo que corre en el servidor: sesión, base de datos, sitio, versiones, medios, despliegues
  api/                rutas HTTP (/api/auth, /api/cms/…, /api/site para el sitio publicado)
db/                   migraciones SQL (0001…0018), pruebas SQL y docker-compose  → db/README.md
realtime/             servidor de WebSockets (presencia, cursores, ediciones en vivo)
scripts/              db-setup, db-seed, mantenimiento, pruebas de punta a punta, arranque
```

Dónde leer más:

- **[`db/README.md`](db/README.md)** — modelo de datos, permisos, ramas y pull requests, publicación, despliegue, ImageKit, tiempo
  real, mantenimiento. Es la referencia de cómo funciona el backend.
- **[`DOCUMENTACION_ARQUITECTURA.md`](DOCUMENTACION_ARQUITECTURA.md)** — el editor por dentro (subsistemas y patrones). Es de
  octubre y **no cubre la migración a Postgres**: para datos, versiones y servidor manda `db/README.md`.
- **[`AGENTS.md`](AGENTS.md)** — aviso para asistentes de código: esta versión de Next.js tiene cambios respecto a lo habitual;
  su documentación está en `node_modules/next/dist/docs/`.

## Cosas que conviene saber

- **Todo vive en la base de datos.** No hay archivos JSON de datos. Lo único que el navegador guarda es si el explorador
  izquierdo está recogido.
- **Quien no puede publicar en `main` trabaja en su propia rama** y envía pull requests a quien lo invitó (como GitHub).
- **Despliegue:** Vercel construye la app; FTP, SFTP y cPanel suben el paquete del proyecto y sirven para servidores donde corre
  Node (un VPS, o la «aplicación Node.js» de cPanel). Un hosting de solo archivos estáticos no sirve todavía.
- **Producción:** `AUTH_SECRET` y `DATA_KEY` son obligatorias; las migraciones las aplica quien despliega
  (`pnpm db:setup` con `DATABASE_ADMIN_URL`) y la app usa solo `DATABASE_URL`.

## Problemas frecuentes

| Síntoma | Causa y arreglo |
|---|---|
| `Falta DATABASE_URL` | no existe `.env.local` (paso 2) |
| `No se pudo conectar a DATABASE_ADMIN_URL` | Postgres apagado o puerto distinto: `pnpm db:up`, y `POSTGRES_PORT` igual en las dos URLs |
| `EADDRINUSE` en 3000 o 3001 | quedó otro `pnpm dev` abierto; ciérralo (o cambia `REALTIME_PORT`) |
| «En vivo» no aparece | el servidor de tiempo real no está corriendo: usa `pnpm dev`, no solo `pnpm dev:web` |
| Subir una imagen dice «ImageKit no está configurado» | faltan las variables `IMAGEKIT_*` en `.env.local` (reinicia `pnpm dev`) |
| `db:setup` falla con «slug» | `PORTAL_ORG_SLUG` debe tener entre 3 y 40 caracteres (minúsculas, números, guiones) |
| Quiero empezar de cero | `docker compose --env-file .env.local -f db/docker-compose.yml down -v` y repite los pasos 3 y 4 |
