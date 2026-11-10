# Portal — CMS Visual Municipal y Multi-Unidad

Editor visual de sitios web con colaboración en tiempo real, gestión por **unidades municipales/departamentos**, control de versiones y ramas estilo Git, flujos de revisión y aprobación, publicación y despliegue automatizado.

Construido sobre **Next.js 16 + React 19**, **PostgreSQL** para la persistencia total de datos con seguridad por fila (RLS), **ImageKit** con optimización multimedia para imágenes y videos, y un servidor dedicado de **WebSockets** (con soporte de cluster Redis) para la edición en vivo.

---

## Antes de empezar

| Requisito | Versión recomendada | Utilidad |
|---|---|---|
| [Node.js](https://nodejs.org) | **22.18 o superior** (probado en Node 22 y 26) | Ejecución de la app y scripts TypeScript (`.mts` nativos). |
| [pnpm](https://pnpm.io) | **11** (`corepack enable` o vía `npx`) | **Único gestor de paquetes soportado**. No usar npm ni yarn directamente. |
| [Docker Desktop](https://www.docker.com/products/docker-desktop/) | Cualquiera reciente | Para levantar el contenedor de PostgreSQL de desarrollo (o usar Postgres local / Supabase). |

> [!TIP]
> **En Windows (PowerShell):** Si al ejecutar `pnpm` el sistema indica que el comando no se reconoce, activa Corepack con `corepack enable` en una terminal con permisos, o puedes anteponer `npx --yes pnpm <comando>` (por ejemplo, `npx --yes pnpm dev`).

---

## Puesta en marcha (5 pasos)

```bash
# 1. Instalar dependencias
corepack enable
pnpm install

# 2. Configurar variables de entorno
cp .env.example .env.local          # En Windows PowerShell: copy .env.example .env.local

# 3. Levantar la base de datos (PostgreSQL en Docker)
pnpm db:up

# 4. Aplicar las 19 migraciones, crear el rol portal_api, la organización y cuentas de prueba
pnpm db:setup

# 5. Iniciar la aplicación y el servidor de tiempo real (WebSockets)
pnpm dev
```

Abre en tu navegador <http://localhost:3000> e inicia sesión con cualquiera de las cuentas de prueba creadas durante el paso 4:

| Rol | Correo | Contraseña | Capacidades clave |
|---|---|---|---|
| **Superadministrador** | `superadmin@portal.dev` | `SuperAdmin2026!` | Acceso irrestricto, administra unidades, usuarios, integraciones de despliegue y ajustes. |
| **Desarrollador** | `dev@portal.dev` | `Dev2026!` | Edita contenido, estilos avanzados, AST de código, fuentes de datos y librerías. |
| **Diseñador** | `designer@portal.dev` | `Designer2026!` | Edición visual de páginas, lienzos, medios y tipografías (sujeto a las unidades asignadas). |

> [!NOTE]
> Para probar la **colaboración en vivo y presencia de cursores**, abre una segunda ventana en modo incógnito con una cuenta diferente. Los servicios de **ImageKit**, **Resend** (correo) y **Redis** son opcionales para desarrollo local básico.

---

## Sistema de Unidades Municipales (Departamentos)

El portal incorpora un sistema de **Unidades Organizacionales** (`app.units`, migración `0019_units.sql`) diseñado para municipios e instituciones que gestionan múltiples dependencias (ej. *Salud*, *Zoonosis*, *Comunicación*, *Catastro*, *Obras Públicas*):

```mermaid
flowchart TD
    Org[Organización / Municipio] --> U1[Unidad Salud]
    Org --> U2[Unidad Zoonosis]
    Org --> U3[Unidad Comunicación]
    Org --> Global[Contenido Global]

    U1 --> P1[Páginas de Salud]
    U2 --> P2[Páginas de Zoonosis]
    Global --> P3[Portada / Header / Footer Global]

    Admin([Superadmin]):::admin -->|Control Total| Org
    Jefe([Jefe de Unidad / Owner]):::owner -->|Aprueba y Publica| U1
    Miembro([Miembro de Unidad]):::member -->|Edita con Revisión| U1

    classDef admin fill:#2563eb,stroke:#1d4ed8,color:#fff;
    classDef owner fill:#059669,stroke:#047857,color:#fff;
    classDef member fill:#d97706,stroke:#b45309,color:#fff;
```

### Características del Modelo de Unidades:
1. **Alcance de Páginas y Medios (Scoping)**:
   - Cada página y recurso de la biblioteca puede pertenecer a una unidad (`unit_id`) o ser **Global** (`unit_id: null`).
   - Los miembros de una unidad solo pueden ver y editar las páginas correspondientes a su unidad.
   - El contenido global solo puede ser editado por el `superadmin` o usuarios con el permiso explícito `can_edit_global`.
2. **Tipos de Unidad (`kind`)**:
   - `designer`: Limita a los integrantes a tareas visuales y de maquetación (diseño, imágenes, textos).
   - `dev`: Permite capacidades avanzadas de código, inyección de componentes y fuentes de datos.
3. **Flujo de Revisión y Aprobación (`review_required`)**:
   - Si una unidad activa la revisión obligatoria, sus miembros no publican directamente a la rama `main`; sus cambios se envían a revisión.
   - El encargado de la unidad (`owner_id`) o el superadministrador revisan y autorizan la publicación.
4. **Panel de Gestión de Equipo**:
   - El superadministrador puede gestionar las unidades, asignar personas y definir excepciones de permisos desde el panel contextual de **Equipo** (`app/components/team/`).

---

## Configuración de `.env.local`

Copia el archivo base `.env.example` a `.env.local`. Las variables principales son:

| Variable | Requerida | Propósito y recomendaciones |
|---|---|---|
| `DATABASE_URL` | Sí | Conexión de la **aplicación** (usuario con privilegios limitados `portal_api`, sujeto a RLS). |
| `DATABASE_ADMIN_URL` | Sí (para setup/seed) | Conexión con privilegios administrativos (dueño de tablas) usada exclusivamente para migraciones y mantenimiento. |
| `POSTGRES_PORT` | Sí (con Docker) | Puerto expuesto por Docker (por defecto `5432`, o `55433` si el 5432 está ocupado en Windows). |
| `PORTAL_ORG_SLUG` | Sí | Slug identificador de la organización inicial (3 a 40 letras minúsculas, números o guiones). |
| `PORTAL_ORG_NAME` | Sí | Nombre visible del municipio u organización. |
| `AUTH_SECRET` | Sí en producción | Firma de tokens de sesión y boletos WebSocket efímeros: generar con `openssl rand -base64 48`. |
| `DATA_KEY` | Sí en producción | Llave simétrica (AES-256) para cifrar credenciales de servidores de despliegue: `openssl rand -base64 32`. |
| `REALTIME_PORT` | Opcional | Puerto del servidor WebSocket (por defecto `3001`). En producción tras proxy: `REALTIME_URL=wss://...`. |
| `IMAGEKIT_*` | Opcional | Credenciales de [ImageKit](https://imagekit.io) (`PUBLIC_KEY`, `PRIVATE_KEY`, `URL_ENDPOINT`) para subida y transformación de medios. |
| `RESEND_API_KEY` | Opcional | API Key de [Resend](https://resend.com) para correos de recuperación de contraseña. |
| `REDIS_URL` | Opcional | URL de Redis (`redis://...`) requerida únicamente al ejecutar múltiples instancias del servidor de tiempo real. |
| `RUN_MAINTENANCE=1` | Opcional | Activa la rutina automática de mantenimiento y purga cada 24 horas con `pnpm start`. |

---

## Selección de Base de Datos

El archivo `.env.example` incluye plantillas listas para usar según el entorno:

| Característica | Opción 1: Docker (Recomendada local) | Opción 2: PostgreSQL Local (pgAdmin) | Opción 3: Supabase (Equipo distribuido) |
|---|---|---|---|
| **Escenario** | Iniciar en 1 minuto sin instalar nada local | Ya tienes Postgres instalado en tu equipo | Todo el equipo comparte la misma base remota |
| `DATABASE_ADMIN_URL` | `postgres://postgres:portal_dev@127.0.0.1:<PORT>/portal` | `postgres://postgres:PASSWORD@127.0.0.1:5432/portal` | `postgres://postgres.<ref>:PASS@aws-0-region.pooler.supabase.com:5432/postgres` *(sesión)* |
| `DATABASE_URL` | `postgres://portal_api:portal_api_dev@127.0.0.1:<PORT>/portal` | `postgres://portal_api:PASSWORD@127.0.0.1:5432/portal` | `postgres://portal_api.<ref>:PASS@aws-0-region.pooler.supabase.com:6543/postgres` *(transacciones)* |
| **Inicialización** | Automática con `pnpm db:up` | Crear BD vacía `createdb portal` en pgAdmin | Creada automáticamente en Supabase |
| **Migraciones** | `pnpm db:setup` | `pnpm db:setup` | `pnpm db:setup` (lo ejecuta una sola persona) |

> [!IMPORTANT]
> **Uso con Supabase:** El rol administrativo usa el puerto de **sesión** `5432`, mientras que la app usa el **pooler de transacciones** en el puerto `6543` bajo el usuario `portal_api.<ref>`. `pnpm db:setup` crea este usuario automáticamente.

---

## Comandos del Proyecto

| Comando | Acción |
|---|---|
| `pnpm dev` | Inicia simultáneamente la aplicación Next.js (puerto 3000) y el servidor WebSocket (puerto 3001). |
| `pnpm dev:web` | Inicia únicamente la aplicación web Next.js. |
| `pnpm realtime` | Inicia únicamente el servidor de WebSockets. |
| `pnpm build` | Compila la aplicación para producción. |
| `pnpm start` | Inicia el servidor de producción junto al servidor de tiempo real. |
| `pnpm test` | Ejecuta la suite de pruebas unitarias (**113 archivos, 669 tests**) con [Vitest](https://vitest.dev). |
| `pnpm db:up` | Levanta el contenedor Docker de PostgreSQL (y Redis con el perfil cluster). |
| `pnpm db:setup` | Aplica las **19 migraciones SQL**, configura roles de base de datos y crea la organización con usuarios de prueba. |
| `pnpm db:seed` | Re-inserta la organización municipal y las cuentas de prueba iniciales. |
| `pnpm org:create` | Permite al administrador crear una nueva organización municipal: `pnpm org:create <slug> "<Nombre>" <correo> "<Admin>" <usuario> <password>`. |
| `pnpm maintenance` | Limpieza de archivos multimedia huérfanos en ImageKit y purga de sesiones/tokens vencidos (`--dry` para simulación). |
| `pnpm lint` | Analiza el código con ESLint y comprueba los tipos de TypeScript. |

---

## Pruebas de Punta a Punta (E2E)

Con `pnpm dev` y la base de datos levantada, puedes ejecutar las suites de integración automatizadas:

```bash
# Permisos y aislamiento del sistema de Unidades Municipales
node --env-file=.env.local scripts/e2e-units.mts

# Guardado, lectura y alcance de páginas del sitio
node --env-file=.env.local scripts/e2e-site.mts

# Ramas, commits inmutables, pull requests y publicación
node --env-file=.env.local scripts/e2e-versions.mts

# Presencia de usuarios, cursores y edición colaborativa
node --env-file=.env.local scripts/e2e-realtime.mts

# Subida, cuota y eliminación de medios en ImageKit
node --env-file=.env.local scripts/e2e-media.mts

# Autenticación, bloqueo por fuerza bruta y sesiones
sh scripts/e2e-auth.sh

# Cluster multi-instancia de tiempo real con Redis
REDIS_URL=redis://127.0.0.1:6379 node --env-file=.env.local scripts/e2e-realtime-cluster.mts
```

---

## Optimización Multimedia y Almacenamiento

El portal integra compresión y procesamiento avanzado de archivos:
- **Librerías de procesamiento:** `sharp` para optimización de imágenes (WebP, AVIF, compresión inteligente) y `ffmpeg-static` para codificación de video (MP4, WebM).
- **Herramienta de benchmark:** Ejecuta `pnpm exec tsx scripts/media-benchmark.mts <carpeta>` para auditar en local el ratio de compresión y PSNR sin alterar archivos ni consumir cuotas de ImageKit.
- **Control de Cuota:** Visualizador en tiempo real del almacenamiento consumido por la organización (`GET /api/cms/assets`).

---

## Arquitectura y Despliegue

### Flujo de Publicación Estilo Git
- **Rama `main`:** Representa el contenido publicado y validado.
- **Ramas de trabajo:** Los editores que no tienen permisos para publicar directo en `main` trabajan en ramas personales (`trabajo-<usuario>`) y envían **Pull Requests**.
- **Historial inmutable:** Cada versión guarda un snapshot direccionado por contenido; no se destruye el historial.

### Destinos de Despliegue Soportados (`app/server/deployers/`):
- **Vercel:** Despliegue nativo con compilación en la nube.
- **SFTP / SSH:** Despliegue empaquetado hacia servidores Linux o VPS privados.
- **FTPS / FTP:** Despliegue seguro mediante `basic-ftp`.
- **cPanel:** Integración directa mediante la API de aplicaciones Node.js (puerto 2083).

---

## Estructura del Código

```
app/
  api/                # Route handlers (/api/auth, /api/cms, /api/site...)
    cms/units/        # Endpoints para gestión de unidades y membresías
  components/         # Interfaz visual del CMS
    site/             # Modelo de datos, render del lienzo y reducers
    team/             # Panel de administración de equipo y unidades municipales
    canvas-editing/   # Geometría, snapping, transformación y gestos
    versioning/       # Interfaz de ramas, commits y pull requests
    realtime/         # Visualización de cursores y presencia en vivo
  server/             # Lógica de servidor y conexión con base de datos
    db.ts             # Cliente de conexión postgres.js y transacciones RLS
    units/            # Validación de permisos, scoping y filtros por unidad
    deployers/        # Adaptadores de despliegue (Vercel, SFTP, FTP, cPanel)
    media/            # Compresión con Sharp/FFMPEG e integración con ImageKit
db/
  migrations/         # 19 migraciones SQL nativas (0001_foundation ... 0019_units)
  docker-compose.yml  # Contenedores para PostgreSQL y Redis
realtime/             # Servidor WebSockets independiente (server.mts, bus.mts)
scripts/              # Utilidades de setup, seed, mantenimiento y suites E2E
docs/                 # Documentación técnica, manuales y guías de arquitectura
```

---

## Preguntas Frecuentes y Solución de Problemas

| Problema detectado | Causa probable y solución |
|---|---|
| `'pnpm' no se reconoce como un comando` | En Windows, ejecuta `corepack enable` en la consola como administrador, o utiliza `npx --yes pnpm <comando>`. |
| `Falta DATABASE_URL` o error en variables | Asegúrate de haber copiado `.env.example` a `.env.local` en la raíz del proyecto. |
| `No se pudo conectar a DATABASE_ADMIN_URL` | Comprueba que el contenedor Docker esté activo (`pnpm db:up`) y que el puerto en `POSTGRES_PORT` coincida con las URLs. |
| Puerto ocupado (`EADDRINUSE: 3000` o `3001`) | Cierra otros procesos de desarrollo previos o ajusta `REALTIME_PORT=3002` en `.env.local`. |
| «En vivo» no muestra presencia | Asegúrate de iniciar con `pnpm dev` (que levanta Next.js y WebSockets juntos), no solo `pnpm dev:web`. |
| Subida de medios rechazada | Si no configuras las variables `IMAGEKIT_*`, el sistema avisará que la subida externa está deshabilitada. |
| Deseo reiniciar la base de desarrollo desde cero | Ejecuta `docker compose --env-file .env.local -f db/docker-compose.yml down -v` y vuelve a correr `pnpm db:up` y `pnpm db:setup`. |
