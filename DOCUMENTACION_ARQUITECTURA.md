# Documentación de arquitectura — Portal (CMS visual)

> Documento de referencia del proyecto `portal`: qué hay, cómo está organizado, qué hace cada pieza,
> cómo se importan las cosas y cómo funciona el código por dentro.
>
> Fecha: 21 de octubre de 2026 · Commit base: `be9c8cc`

---

## Índice

1. [Qué es el proyecto](#1-qué-es-el-proyecto)
2. [Stack tecnológico](#2-stack-tecnológico)
3. [Estructura de carpetas](#3-estructura-de-carpetas)
4. [Punto de entrada y árbol de providers](#4-punto-de-entrada-y-árbol-de-providers)
5. [Patrones arquitectónicos](#5-patrones-arquitectónicos)
6. [El modelo de datos](#6-el-modelo-de-datos)
7. [Mapa de subsistemas](#7-mapa-de-subsistemas)
8. [Detalle de cada subsistema](#8-detalle-de-cada-subsistema)
   - 8.1 [site — el núcleo](#81-site--el-núcleo)
   - 8.2 [styles — el motor de cascada](#82-styles--el-motor-de-cascada)
   - 8.3 [canvas-editing — geometría y gestos](#83-canvas-editing--geometría-y-gestos)
   - 8.4 [builder — el constructor de componentes](#84-builder--el-constructor-de-componentes)
   - 8.5 [placement — colocación libre en la página](#85-placement--colocación-libre-en-la-página)
   - 8.6 [navigation — enlaces, transiciones y vista previa](#86-navigation--enlaces-transiciones-y-vista-previa)
   - 8.7 [media — imágenes y videos](#87-media--imágenes-y-videos)
   - 8.8 [format — el menú contextual de formato](#88-format--el-menú-contextual-de-formato)
   - 8.9 [appearance — reglas de estilo por ámbito](#89-appearance--reglas-de-estilo-por-ámbito)
   - 8.10 [behaviors — interacciones](#810-behaviors--interacciones)
   - 8.11 [functions — funciones reutilizables](#811-functions--funciones-reutilizables)
   - 8.12 [code — ejecución de código del usuario](#812-code--ejecución-de-código-del-usuario)
   - 8.13 [workbench — el editor de código](#813-workbench--el-editor-de-código)
   - 8.14 [commands — paleta y atajos](#814-commands--paleta-y-atajos)
   - 8.15 [viewport — el lienzo, el zoom y los dispositivos](#815-viewport--el-lienzo-el-zoom-y-los-dispositivos)
   - 8.16 [side-panel — el panel lateral](#816-side-panel--el-panel-lateral)
   - 8.17 [title-editor — el titular](#817-title-editor--el-titular)
   - 8.18 [customize — el inspector derecho](#818-customize--el-inspector-derecho)
   - 8.19 [libraries — el gestor de librerías](#819-libraries--el-gestor-de-librerías)
   - 8.20 [versioning — el control de versiones](#820-versioning--el-control-de-versiones)
   - 8.21 [ui — los componentes base](#821-ui--los-componentes-base)
9. [API Routes y servidor](#9-api-routes-y-servidor)
10. [Configuración de build](#10-configuración-de-build)
11. [Flujos de trabajo completos](#11-flujos-de-trabajo-completos)
12. [Mapa de importaciones](#12-mapa-de-importaciones)
13. [Convenciones y cómo extender](#13-convenciones-y-cómo-extender)
14. [Deuda técnica y riesgos conocidos](#14-deuda-técnica-y-riesgos-conocidos)

---

## 1. Qué es el proyecto

**Portal** es un **editor visual de sitios web (CMS)** que corre íntegramente en el navegador.

El usuario no escribe HTML: **arrastra elementos sobre un lienzo** (rectángulos, elipses, textos, imágenes,
videos) que después se guardan como *componentes reutilizables* y se colocan en *páginas*. El sistema
produce un sitio navegable con estilos en cascada, interacciones, transiciones entre páginas y bloques
de código propio.

La idea central es esta:

```
Plantilla (ComponentDef)  +  Formato propio del bloque (BlockInstance.elements)  +  Reglas de estilo
        +  Variables CSS  +  CSS propio  ──►  el sitio que ve el visitante
```

Es decir: **hay tres capas de estilo que se combinan** y el usuario decide en qué capa escribir:

| Capa | Ámbito | Dónde vive |
|---|---|---|
| **Formato del bloque** | Sólo esa instancia en esa página | `BlockInstance.elements` (overrides) |
| **Regla de estilo** | Global / página / componente, por tipo de elemento | `SiteState.rules` |
| **Variable CSS** | Global / página / componente, por nombre | `SiteState.variables` |

### 1.1 Estado del proyecto

- Editor **completo y funcional** para: páginas, componentes, elementos, estilos, variables, medios,
  enlaces, interacciones, código, librerías y un prototipo visual de control de versiones.
- El **control de versiones es un prototipo**: los commits y el diff son reales (se calculan del
  `SiteState` vivo), pero ramas, PRs, conflictos, issues y publicaciones **viven sólo en memoria**
  y se pierden al recargar. Ver §8.20.
- **Sin persistencia en servidor**: todo el estado del sitio vive en un `useReducer` en el navegador.
  No hay base de datos, ni API de persistencia, ni autenticación.

---

## 2. Stack tecnológico

| Pieza | Versión | Para qué |
|---|---|---|
| **Next.js** | 16.4.2 (App Router) | Framework, routing, API routes, Turbopack |
| **React** | 19.3.0 | UI. Se usa el patrón `<Context value={...}>` (nuevo en 19) |
| **TypeScript** | 5 (`strict: true`) | Tipado estricto, sin `any` implícito |
| **Tailwind CSS** | 4.3.3 | Estilos del editor. Se usa `@theme` y `@tailwindcss/browser` |
| **Turbopack** | (bundler por defecto) | Dev y build. Regla custom para `*.css` |
| **Monaco Editor** | 0.57 + `@monaco-editor/react` 4.7 | El editor de código del workbench |
| **Sucrase** | 3.35.1 | Quita los tipos de TypeScript **en el navegador**, sin bundler |
| **esbuild** | 0.28.2 | Empaqueta librerías npm para el navegador (servidor) |
| **swipe** | 1.7.7 | Única librería de terceros instalada por el usuario |
| **pnpm** | 11.1.2 | Gestor de paquetes (workspace) |
| **ESLint** | 9 + `eslint-config-next` 16.4.2 | Lint |

### 2.1 Decisiones de dependencias

- **Sin librería de estado** (Redux, Zustand, Jotai). Todo el estado vive en `useReducer` + Context.
- **Sin librería de drag & drop**. Los gestos están escritos a mano con Pointer Events.
- **Sin librería de modal/popover**. Se usa `<dialog>` nativo y `role="menu"` propio.
- **Sin librería de graphs/flow**. El mapa de flujo es SVG inline.
- **Sin librería de estilos en runtime** (styled-components, emotion). Tailwind + CSS plano.
- **Sin librería de test.** No hay tests en el repositorio.

---

## 3. Estructura de carpetas

```
portal/
├── app/
│   ├── layout.tsx                  # Root layout: fuentes Geist, body
│   ├── page.tsx                    # Home: árbol de providers + layout del editor
│   ├── globals.css                 # @import tailwind, @theme (paleta), animaciones de navegación
│   ├── favicon.ico
│   │
│   ├── api/                        # API Routes (Route Handlers)
│   │   ├── libs/
│   │   │   ├── route.ts            # GET/POST/DELETE · instalar librerías con pnpm
│   │   │   └── bundle/route.ts     # GET · empaqueta una librería con esbuild
│   │   └── vendor/
│   │       ├── monaco/[...path]/route.ts   # Sirve Monaco desde node_modules
│   │       └── tailwind/route.ts            # Sirve @tailwindcss/browser
│   │
│   ├── server/                     # Utilidades de servidor (Node)
│   │   ├── npm-libraries.ts        # pnpm add/remove, esbuild, manifiesto
│   │   ├── request-header.ts       # Cabecera anti-CSRF: "x-portal-request"
│   │   └── vendor-files.ts         # Serve de node_modules con path traversal guard
│   │
│   └── components/                 # 21 subsistemas (ver §7)
│       ├── site/            (23 archivos)  # NÚCLEO: modelo + reducer + render
│       ├── styles/          (7)            # Motor de cascada, variables
│       ├── canvas-editing/  (20)           # Geometría, snapping, gestos
│       ├── builder/         (22)           # Constructor de componentes
│       ├── placement/       (11)           # Posición libre de bloques
│       ├── navigation/      (12)           # Enlaces, transiciones, preview
│       ├── media/           (10)           # Imágenes y videos
│       ├── format/          (7)            # Menú contextual de formato
│       ├── appearance/      (6)            # Reglas por ámbito
│       ├── behaviors/       (9)            # Interacciones
│       ├── functions/       (2)            # Funciones reutilizables
│       ├── code/            (7)            # Runtime de código del usuario
│       ├── workbench/       (15)           # Editor de código (Monaco)
│       ├── commands/        (22)           # Paleta, atajos, comandos "/"
│       ├── viewport/        (13)           # Lienzo, zoom, dispositivos
│       ├── side-panel/      (6)            # Panel lateral
│       ├── title-editor/    (6)            # El titular
│       ├── customize/       (4)            # Inspector derecho
│       ├── libraries/       (6)            # Gestor de librerías
│       ├── versioning/      (31)           # Control de versiones (prototipo)
│       └── ui/              (8)            # Componentes base
│
├── public/                         # SVGs de la plantilla de create-next-app
├── next.config.ts                  # cpus:1, cacheComponents, serverExternalPackages
├── tsconfig.json                   # strict, paths "@/*"
├── eslint.config.mjs
├── portal-libraries.json           # Manifiesto de librerías instaladas por el usuario
├── pnpm-workspace.yaml             # allowBuilds (desactiva scripts de instalación)
├── package.json
└── AGENTS.md                       # Reglas del proyecto (regenerado por `next dev`)
```

**Métricas:** 257 archivos `.ts/.tsx/.css` bajo `app/`, 19.435 líneas (contadas con líneas en blanco;
sin ellas serían 17.226).

---

## 4. Punto de entrada y árbol de providers

### 4.1 `app/layout.tsx`

Root layout de Next.js. Muy simple:

- Carga las fuentes **Geist** y **Geist Mono** con `next/font/google`, expuestas como variables CSS
  `--font-geist-sans` / `--font-geist-mono`.
- Importa `./globals.css`.
- `<body className="min-h-full flex flex-col" suppressHydrationWarning>` — el
  `suppressHydrationWarning` es para que las extensiones del navegador que añaden atributos al `<body>`
  no provocan errores de hidratación.
- `metadata` es el de la plantilla por defecto (`"Create Next App"`). **Pendiente de personalizar.**

### 4.2 `app/page.tsx` — la única ruta

Todo el editor vive en `/`. La página monta **9 providers anidados** y divide la pantalla en tres
columnas:

```
<SiteProvider>                      ← estado global del sitio (useReducer)
  <MediaProvider>                   ← operaciones sobre medios
    <VersioningProvider>            ← ramas, commits, PRs (prototipo)
      <ViewportProvider>            ← dispositivo, herramienta, zoom
        <CanvasSettingsProvider>    ← snap, cuadrícula, alcance de edición
          <NavigationProvider>      ← modo edit/preview, flechas de enlace
            <WorkbenchProvider>     ← editor de código abierto/pestañas
              <CommandsProvider>    ← paleta, atajos, diálogos
                <FormatMenuProvider>← menú contextual de formato
```

**El orden importa:** cada provider depende de los que están por encima. `CommandsProvider`, por
ejemplo, consume `useViewport()`, `useMedia()`, `useSite()`, `useNavigation()` y `useWorkbench()` — por eso
es el más interno de los que dependen de estado.

### 4.3 Anatomía de la pantalla

```
┌──────────────────────────────────────────────────────────────┐
│ <header>  TitleToolbar │ BranchSwitcher │ PublishButton │   │  z-20
│           PreviewToggle │ ViewportSwitcher                   │
├────────────┬─────────────────────────────────┬───────────────┤
│            │                                 │               │
│  SidePanel │   CanvasSurface > CanvasPages   │   Inspector   │
│  (rail +   │   (todas las páginas en fila)    │  (derecho,    │
│   panel)   │        + BottomToolbar           │   contextual) │
│            │                                 │               │
├────────────┴─────────────────────────────────┴───────────────┤
│ CommandPalette │ BuilderHost │ ShortcutsSettings │ VersionsDialog │
│ MediaUrlDialog │ MediaNotice │ MediaDropZone │ ModeBar │        │
│ ConnectionOverlay │ LinkPopover │ FormatMenu │ WorkbenchHost   │
│ TailwindRuntime │ SiteStyles                                  │
└──────────────────────────────────────────────────────────────┘
```

Los "hosts" (diálogos, overlays, menús) se montan **fuera** del `div` del layout pero **dentro** de los
providers, para que puedan flotar sobre todo (`z-40` … `z-[70]`).

### 4.4 `app/globals.css`

Cuatro bloques:

1. `@import "tailwindcss";`
2. `@theme inline` — enlaza las fuentes de Tailwind con las de `next/font`.
3. `@theme` — **la paleta del editor** (modo oscuro, estilo Figma):
   `--color-canvas: #1e1e1e`, `--color-panel: #2c2c2c`, `--color-hover: #3c3c3c`,
   `--color-line: #444444`, `--color-ink: #ffffff`, `--color-ink-dim: #a3a3a3`,
   `--color-accent: #0d99ff`.
4. **Animaciones de navegación** — `@keyframes nav-fade / nav-slide / nav-zoom` y las clases
   `.nav-anim-*`, con `prefers-reduced-motion` respetado.
5. El "drop hot" de páginas: `[data-site-page][data-drop-hot] { outline: 4px solid #34d399; }`.

---

## 5. Patrones arquitectónicos

Estos cinco patrones explican casi todo el código del proyecto.

### 5.1 Reducer con tabla de manejadores (exhaustiva por tipos)

En lugar de un `switch` gigantic, cada reducer es **una tabla indexada por el discriminante de la
unión de acciones**:

```ts
// app/components/site/site-reducer.ts:48-50
type Handlers = {
  [K in SiteAction["type"]]: (state: SiteState, action: Extract<SiteAction, { type: K }>) => SiteState;
};

const HANDLERS: Handlers = { /* 45 entradas */ };

export function siteReducer(state: SiteState, action: SiteAction): SiteState {
  const handle = HANDLERS[action.type] as (state: SiteState, action: SiteAction) => SiteState;
  return handle(state, action);
}
```

**Consecuencia:** añadir una acción a `SiteAction` **sin** añadir su manejador es un **error de
compilación**, no un bug en runtime. El mismo patrón se usa en:

- `site/site-reducer.ts` — 45 acciones
- `builder/builder-reducer.ts` — 13 acciones
- `versioning/versioning-reducer.ts` — 15 acciones

### 5.2 Estado y dispatch en contextos separados

```tsx
// app/components/site/site-context.tsx:16-17
const StateContext = createContext<SiteState | null>(null);
const DispatchContext = createContext<Dispatch<SiteAction> | null>(null);
```

Un componente que sólo dispara acciones (`useSiteDispatch()`) **no se re-renderiza** cuando el sitio
cambia. Es la optimización de renders más importante del proyecto y se nota en componentes como
`use-deselect.ts` o `media/poster-menu.tsx`.

Hooks expuestos:

| Hook | Devuelve |
|---|---|
| `useSite()` | `SiteState` (lanza error si falta el provider) |
| `useSiteDispatch()` | `Dispatch<SiteAction>` |
| `useCurrentPage()` | La página actual, con *fallback* a `pages[0]` |

### 5.3 Reglas puras en archivos `.ts` sin React

La lógica de negocio vive en archivos `.ts` puros, sin imports de React:

- `site/rules.ts` — slugs, nombres duplicados, rutas, `splitBlocks`
- `site/overrides.ts` — fusión plantilla + formato propio
- `site/hiding.ts` — ocultar/mostrar
- `site/component-scope-rules.ts` — cambios a nivel de componente
- `styles/resolve.ts` — la cascada
- `versioning/versioning-rules.ts` — reglas de versionado
- `functions/scope.ts` — alcance de funciones

Ventaja: son testeables y auditables sin montar React. El reducer los **invoca**, así que la UI nunca
muta el estado directamente.

### 5.4 Tablas dirigidas por datos ("añadir es añadir una entrada")

Muchos subsistemas son tablas literales. Añadir un elemento es **editar la tabla**, no tocar la lógica:

| Tabla | Archivo | Qué añade una entrada |
|---|---|---|
| `HANDLERS` | `site/site-reducer.ts` | Una acción del sitio |
| `HANDLERS` | `builder/builder-reducer.ts` | Una acción del builder |
| `HANDLERS` | `versioning/versioning-reducer.ts` | Una acción de versionado |
| `FILE_KINDS` | `workbench/file-ref.ts` | Un tipo de archivo del editor |
| `PROP_DEFS` / `TARGET_DEFS` | `styles/registry.ts` | Una propiedad o un target de estilo |
| `RENDERERS` | `site/component-view.tsx` | Un tipo de elemento (rect, ellipse, text…) |
| `TEMPLATES` | `site/component-templates.ts` | Una plantilla de componente |
| `TRIGGERS` | `behaviors/triggers.ts` | Un disparador de interacción |
| `ACTIONS` | `behaviors/actions.ts` | Una acción de interacción |
| `EXECUTORS` | `behaviors/execute-code.ts` | Un modo de ejecución de código |
| `createCommands()` | `commands/command-definitions.ts` | Un comando de la paleta |
| `DEVICES` / `ZOOM_STEPS` | `viewport/viewport-context.tsx` | Un dispositivo / nivel de zoom |

### 5.5 CSS en capas, con `@scope` para proteger la interfaz

Es la pieza que hace posible que el CSS del usuario no rompa el editor:

- `site/element-style.ts` genera los estilos base de cada elemento en la **capa `base`** de Tailwind
  → es lo más débil.
- Las **clases de Tailwind** del usuario van en `utilities` → por encima.
- El **CSS sin capa** (propio del bloque, CSS global, CSS de página) → lo más fuerte.

```css
/* Jerarquía efectiva */
1. @layer base          ← estilos base del elemento
2. Tailwind utilities  ← bg-primario, rounded-full…
3. CSS sin capa         ← lo que escribe el usuario
```

Y para que el CSS global no toque el editor, `site/site-styles.tsx` lo acota:

```ts
const scoped = (root: string, css: string): string =>
  css.trim() && cssProblem(css) === null ? `@scope (${root}) {\n${css}\n}` : "";
```

Además, el CSS del componente usa **doble `:where()`** para que tenga especificidad 0:

```css
:where([data-component="mi-hero"]) :where([data-el="titulo"]) { … }
```

---

## 6. El modelo de datos

Todo cuelga de `SiteState` (`app/components/site/types.ts:214-228`).

```ts
export interface SiteState extends StyleState {   // StyleState = { variables, rules }
  navigation: { defaultTransition: Transition };
  pages: Page[];
  currentPageId: string;
  components: ComponentDef[];
  selectedId: string;            // "title" o el id de un bloque
  selectedElementId: string | null;
  libraries: Library[];
  globalCss: string;
  functions: SharedFunction[];
}
```

### 6.1 Los tipos principales

```
SiteState
├── navigation.defaultTransition
├── pages: Page[]
│   ├── id, name, slug, isHome
│   ├── title: TitleState
│   ├── media: MediaItem[]
│   ├── blocks: BlockInstance[]
│   ├── titlePlacement?: Placement
│   ├── hidden?, titleHidden?
│   └── css?, js?
├── components: ComponentDef[]
│   ├── id, name, description
│   ├── category: ComponentCategory
│   ├── width, height
│   ├── elements: CanvasElement[]
│   ├── links: Record<string, LinkTarget>
│   ├── custom: boolean
│   └── styles?: Record<string, CustomStyle>
├── libraries: Library[]
├── functions: SharedFunction[]
├── variables: Variable[]      (heredado de StyleState)
└── rules: StyleRule[]          (heredado de StyleState)
```

### 6.2 `CanvasElement` — la pieza atómica

Un elemento posicionado sobre un lienzo de tamaño fijo (`site/types.ts:21-62`):

```ts
export interface CanvasElement {
  id: string;
  kind: ElementKind;             // "rect" | "ellipse" | "text" | "image" | "video"
  parentId?: string;              // contenedor donde está acoplado
  slot?: DockSlot;                // casilla 3×3 del contenedor
  offset?: { x, y };              // acoplado libre
  fitToParent?: boolean;
  role: ElementRole | "none";     // heading | text | button | link | image | container
  x, y, width, height: number;
  fill: string;
  radius: number;
  text: string;
  fontSize: number;
  color: string;
  bold: boolean;
  align: TextAlign;
  fontFamily: string;
  src: string;
  embed?: boolean;               // true = src es un <iframe>
  italic?, underline?, overline?, strike?: boolean;
  list?: "none" | "ul" | "ol";
  hidden?: boolean;
}
```

### 6.3 `ComponentDef` vs `BlockInstance` — la relación clave

| | `ComponentDef` | `BlockInstance` |
|---|---|---|
| Qué es | La **plantilla** | La **instancia colocada** |
| Dónde vive | `SiteState.components` | `Page.blocks[]` |
| Contiene | `elements`, `links`, `styles` | `elements` (overrides), `custom`, `box`, `placement`, `size`, `behaviors`, `code` |
| Se puede editar | sí (si `custom: true`) | sí (sólo su formato propio) |
| Se reutiliza | sí, en N páginas | — |

La fusión ocurre en `applyOverrides()` (`site/overrides.ts:55-68`):

```ts
export function applyOverrides(def, block, resolve) {
  const overrides = block.elements;
  if (!overrides && !block.size) return def;      // sin divergencias → original
  const elements = def.elements.map(el =>
    overrides?.[el.id] ? resolveOverride(el, overrides[el.id], resolve) : el);
  return { ...def, ...block.size, elements: overrides ? layoutDocked(elements) : elements };
}
```

`ElementOverride` es un `Partial` de `CanvasElement` con tres diferencias:

- `radius` y `fontSize` pasan a `SizeValue` (= `number | "var(--nombre)"`).
- `parentId: string | null` — `null` significa "soltar del contenedor".
- `hidden` **sí** está aquí: ocultar un elemento es formato del bloque, no del componente.

### 6.4 Constantes mágicas

| Constante | Valor | Significado |
|---|---|---|
| `SECTION_KEY` | `"$section"` | Clave de "toda la sección" en `custom`/`styles` |
| `TITLE_SELECTION` | `"title"` | `selectedId` cuando está seleccionado el titular |

---

## 7. Mapa de subsistemas

| Subsistema | Archivos | Líneas | Responsabilidad | ¿Con estado propio? |
|---|---|---|---|---|
| `versioning` | 31 | 2.615 | Ramas, commits, PRs, issues, publicación (prototipo) | Sí (`useReducer`) |
| `site` | 23 | 2.371 | **Núcleo**: modelo, reducer, render de páginas | Sí (el principal) |
| `workbench` | 15 | 1.769 | Editor de código (Monaco) sobre "archivos virtuales" | Sí (pestañas) |
| `commands` | 22 | 1.555 | Paleta de comandos, atajos, comandos `/` | Sí (diálogos, builder) |
| `builder` | 22 | 1.074 | Constructor de componentes reutilizables | Sí (`useReducer`) |
| `navigation` | 12 | 1.072 | Enlaces, transiciones, modo preview | Sí (modo, flecha) |
| `canvas-editing` | 20 | 1.019 | Geometría, snapping, gestos, docks | No (settings) |
| `viewport` | 13 | 969 | Lienzo, zoom, dispositivo, herramientas | Sí |
| `format` | 7 | 877 | Menú contextual de formato | Sí (contexto local) |
| `media` | 10 | 790 | Imágenes, videos, portadas, drag & drop | Sí |
| `appearance` | 6 | 651 | Reglas de estilo por ámbito y target | Sí (ámbito) |
| `side-panel` | 6 | 651 | Panel lateral de 5 secciones | Sí (tab, ancho) |
| `styles` | 7 | 590 | Motor de cascada, variables, CSS | No (dentro de `site`) |
| `behaviors` | 9 | 544 | Interacciones, sandbox, ejecución de código | No |
| `placement` | 11 | 536 | Posición libre de bloques, titular y medios | No |
| `customize` | 4 | 471 | Inspector derecho, editor de interacciones | No |
| `title-editor` | 6 | 465 | Editor WYSIWYG del titular | No (vive en `page.title`) |
| `libraries` | 6 | 335 | Catálogo e instalación de librerías | Sí (estado libs) |
| `ui` | 8 | 296 | Componentes base (modal, badge, collapsible…) | — |
| `code` | 7 | 209 | Transpilación, `srcdoc`, assets compartidos | — |
| `functions` | 2 | 94 | Alcance y preámbulo de funciones | No (vive en `site`) |

---

## 8. Detalle de cada subsistema

### 8.1 site — el núcleo

**23 archivos, 2.371 líneas.** Es el subsistema más importante: define el modelo, el reducer y el render.

```
site/
├── types.ts                  (275 L)  Modelo: 22 tipos + 45 SiteAction
├── site-reducer.ts           (358 L)  45 manejadores
├── site-context.tsx          ( 44 L)  StateContext + DispatchContext
├── initial-site.ts           ( 74 L)  Estado inicial (4 páginas de ejemplo)
├── page-blocks.tsx           (235 L)  Render de los bloques de una página
├── component-view.tsx        (331 L)  Render de un componente y sus elementos
├── component-templates.ts    (192 L)  7 plantillas + 7 componentes de fábrica
├── overrides.ts              (174 L)  Fusión plantilla + formato propio
├── rules.ts                  ( 64 L)  Slugs, nombres, splitBlocks
├── component-scope-rules.ts  ( 66 L)  Cambios a nivel de componente
├── scope-actions.ts          ( 44 L)  Puente alcance → SiteAction
├── site-styles.tsx           ( 35 L)  Inyección del CSS global
├── element-style.ts          ( 71 L)  CSS base de cada elemento (@layer base)
├── custom-code.ts            ( 66 L)  CSS propio, validación, flow layout
├── dock-patch.ts             ( 19 L)  Parches de acoplado
├── hiding.ts                 ( 61 L)  Ocultar/mostrar
├── hidden-placeholder.tsx    ( 24 L)  Marca de "oculto" en el editor
├── visibility-eye.tsx        ( 42 L)  Botón de ojo
├── use-deselect.ts           ( 35 L)  Escape / clic fuera deselecciona
├── use-block-gestures.ts     ( 68 L)  Gestos del bloque en la página
├── video-content.tsx         ( 37 L)  <video> o <iframe>
├── code-button.tsx           ( 33 L)  Botón ‹› para abrir el código
└── code-defaults.ts          ( 23 L)  CODE_COMPONENT_ID + DEFAULT_CODE
```

#### Las 45 acciones del reducer, agrupadas

| Grupo | Acciones |
|---|---|
| **Páginas** (5) | `page/create` `page/rename` `page/delete` `page/select` `page/code` |
| **Titular** (3) | `title/patch` `title/reset` `title/place` |
| **Medios** (5) | `media/add` `media/remove` `media/poster` `media/place` `media/transfer` |
| **Bloques** (12) | `block/add` `block/remove` `block/select` `block/style` `block/box` `block/size` `block/move` `block/reset` `block/place` `block/transfer` `block/code` `block/custom` |
| **Componentes** (5) | `component/save` `component/delete` `component/styles` `component/element` `component/size` |
| **Elemento** (1) | `element/select` |
| **Ocultación** (1) | `hidden/set` |
| **Interacciones** (2) | `behavior/save` `behavior/remove` |
| **Funciones** (2) | `function/save` `function/remove` |
| **Librerías** (2) | `library/add` `library/remove` |
| **Enlaces / navegación** (2) | `link/set` `nav/transition` |
| **Estilos** (5) | `global-css/set` `variable/save` `variable/delete` `rule/set` `rule/clear` |

**Casos que merecen atención:**

- `page/delete` **limpia el ámbito de estilos** de esa página (`withoutScope`) y **borra los enlaces**
  que apuntaban a ella en todos los componentes (`dropLinksToPage`).
- `component/delete` sólo permite borrar componentes `custom` (los de fábrica son inmutables); limpia su
  ámbito de estilos y elimina de todas las páginas los bloques que lo usaban.
- `block/reset` quita todo el formato propio del bloque **pero conserva lo oculto** (`overrides.ts:141-147`).
- `link/set` **no cambia nada** si el enlace es inválido (`LINK_CHECKS` en `site-reducer.ts:29-42`).
- `component/save` **preserva los `styles` previos** si el que llega no los trae
  (`styles: action.component.styles ?? previous?.styles`).

#### Reglas del sitio (`site/rules.ts`)

| Función | Qué hace |
|---|---|
| `slugify(text)` | "Trámites en línea" → `tramites-en-linea` (NFD, sin diacríticos, minúsculas) |
| `uniqueSlug(base, taken)` | Añade `-2`, `-3`… si ya existe |
| `isPageNameTaken` / `isComponentNameTaken` | Comparación `trim().toLowerCase()` |
| `routeOf(page)` | `"/"` para la home, `"/slug"` para las demás |
| `duplicateComponent(def, id, name)` | Copia con ids nuevos y **remapea los enlaces** |
| `splitBlocks(page, components)` | **Divide en `{top, body}`**: las barras de navegación siempre arriba |

#### Render de la página (`site/page-blocks.tsx`)

`PageBlocks` divide los bloques con `splitBlocks` y los pinta en dos grupos (`top` = navegación,
`body` = el resto), con el `gap` tomado de las **reglas de estilo de la página** (no un valor fijo).

`PageBlock` (interno) combina **cuatro capas**:

1. `def` — el `ComponentDef` de fábrica.
2. `styles.component(def)` — el componente con las reglas CSS por rol ya aplicadas.
3. `applyOverrides(styles.component(def), block, resolve)` — el formato propio del bloque + variables
   resueltas + tamaño propio.
4. `flow` — detección de layout flex/grid en el CSS propio (en ese modo no hay gestos de arrastre).

El DOM resultante:

```html
<div data-block-id data-component class="group relative w-full" style="margin:…">
  <style>/* CSS propio del bloque */</style>
  <div style="padding:…; background:…; border-radius:…">
    <ComponentView />          <!-- o <CodeBlockView /> si es un bloque de código -->
  </div>
  <!-- en modo edición: VisibilityEye, PlacementGrip, CodeButton, botón × -->
</div>
```

#### Render de un componente (`site/component-view.tsx`)

`ComponentView` renderiza la sección y sus elementos. Detalle clave:

```tsx
style={interaction ? undefined : { width: def.width, height: def.height }}
```

En la página el tamaño **no va en línea**: va en el CSS de la capa `base` (para que el usuario pueda
sobrescribirlo). En miniaturas (`ComponentThumb`) sí va en línea.

`PositionedElement` tiene cuatro ramas: **oculto**, **preview** (con `role="link"`, `tabIndex`,
`aria-label`), **edición** (con `data-target`, `data-el`, handles, ojo, botón de código) y **estática**.

La tabla `RENDERERS` (`component-view.tsx:71-109`) decide cómo se dibuja cada `kind`:

| `kind` | Render |
|---|---|
| `rect` | div flex con texto centrado |
| `ellipse` | `border-radius: 50%` |
| `text` | div con `leading-tight whitespace-pre-wrap` |
| `image` | `<img>` (no `next/image`: las URLs son de dominios arbitrarios) |
| `video` | `<VideoContent>` (etiqueta o `<iframe>`) |

#### Plantillas de fábrica (`site/component-templates.ts`)

7 plantillas (`blank`, `navbar`, `card`, `section`, `buttons`, `banner`, `review`) y 7
`BUILT_IN_COMPONENTS`: `navbar`, `card-service`, `cta-buttons`, `reviews`, `hero-banner`,
`content-section` y `code-block` (`CODE_COMPONENT_ID`).

Las bases: `BASE` (valores comunes) + `KIND_DEFAULTS` (ajustes por tipo) + `newElement(kind, id, overrides)`.

#### Ámbito: bloque vs componente (`site/scope-actions.ts`)

El concepto de **alcance** (`EditScope = "block" | "component"`) decide si un cambio afecta sólo a la
instancia o a todas las instancias del componente:

```ts
const ELEMENT_ACTIONS: Record<EditScope, (target, elementId, patch) => SiteAction> = {
  block:     (t, elementId, patch) => ({ type: "block/style", … }),
  component: (t, elementId, patch) => ({ type: "component/element", … }),
};
```

Es el único punto donde se decide. Lo consume `site/use-block-gestures.ts:46-48`.

---

### 8.2 styles — el motor de cascada

**7 archivos, 590 líneas.** Es la **capa base**: no importa nada de `site`, `format`, `appearance`,
`behaviors` ni `functions`.

```
styles/
├── types.ts          ( 68 L)  StyleState, StyleRule, StyleScope, StyleTarget, StyleProp, Variable
├── registry.ts       (120 L)  PROP_DEFS, TARGET_DEFS, GROUP_LABELS, ROLE_LABELS
├── resolve.ts        (178 L)  computeStyle, resolveValue, validateVariable, normalizeValue
├── apply.ts          ( 86 L)  styleComponent, styleElement, boxStyle, pixelsOf
├── mutations.ts      ( 57 L)  saveVariable, setRuleProp, clearRule, withoutScope
├── css-variables.ts  ( 43 L)  hostVariablesCss, rootVariablesCss, themeCss
└── use-styles.ts     ( 38 L)  useStyles(): la API que consume la UI
```

#### Los tipos

```ts
export type StyleScope =
  | { kind: "global" }
  | { kind: "page"; pageId: string }
  | { kind: "component"; componentId: string };

export type StyleTarget = "page" | BlockTarget | ElementRole;

export interface StyleRule {
  scope: StyleScope;
  target: StyleTarget;
  props: Partial<Record<StyleProp, string>>;
}

export interface Variable {
  id: string;
  scope: StyleScope;
  name: string;          // sin "--"
  kind: "color" | "size" | "font";
  value: string;
}
```

#### La cascada

**Prioridad:** `global (0) < page (1) < component (2)` (`styles/resolve.ts:28`).

```ts
computeStyle(styles, ctx, target, maxLevel = 2)
```

- Filtra las reglas aplicables al target y al contexto.
- Las ordena por nivel de ámbito.
- Las fusiona (la de mayor nivel gana propiedad a propiedad).
- **Resuelve las variables** al final.

`resolveValue(value, variables, ctx)` sustituye `var(--x)` recursivamente (máx. profundidad 5). Una
variable **no definida ⇒ `undefined` ⇒ la propiedad se descarta** (no se hereda el valor anterior).

`scopeKey(scope)` produce `"global" | "page:<id>" | "component:<id>"` — se usa como clave estable en el
versionado y como clave de archivo.

#### Validación de variables (`styles/resolve.ts:106-139`)

- Nombre: `^[a-z][a-z0-9-]*$`.
- `RESERVED_VARIABLES`: nombres que el editor usa internamente y no se pueden reusar.
- No puede duplicar nombre **en el mismo scope**.
- El valor debe ser válido para su tipo.

#### Aplicación (`styles/apply.ts`)

- `styleComponent(def, styles, ctx)` → devuelve el componente con los **roles** ya resueltos.
- `styleElement(element, styles, ctx)` → aplica la regla del `role` del elemento.
- `boxStyle(...)`, `pixelsOf(value, fallback)` → helpers de CSS.
- `titleWithRules(title, styles, ctx)` → si `title.applyToSite`, las reglas del sitio mandan sobre
  `font, size, bold, color, align`.

#### `useStyles()` — la API de la UI

```ts
const { styles, resolver, component, element, block, page } = useStyles();
```

- `styles` — el `StyleState` (variables + reglas).
- `resolver(componentId)` — devuelve un `Resolver` `(value) => string | undefined` que resuelve `var(--x)`.
- `component(def)` / `element(el)` / `block(def)` / `page(...)` — estilos ya resueltos.

---

### 8.3 canvas-editing — geometría y gestos

**20 archivos, 1.019 líneas.** Es la **librería de edición** sobre un lienzo. Casi todo es React-free.

```
canvas-editing/
├── gesture-types.ts         ( 56 L)  ResizeFrame, CanvasCommands, DragState, DropState
├── use-canvas-gestures.ts   (129 L)  ★ El orquestador de gestos
├── snapping.ts              ( 98 L)  El imán
├── edges.ts                 ( 49 L)  Geometría del rectángulo
├── move-plan.ts             ( 48 L)  Plan de movimiento
├── resize-plan.ts           ( 32 L)  Plan de redimensionado
├── limits.ts                ( 31 L)  clampCanvasSize, MAX_CANVAS_WIDTH/HEIGHT
├── containers.ts            ( 50 L)  descendants, dropTargetAt
├── dock-slots.ts            ( 53 L)  Las 9 casillas 3×3
├── dock-layout.ts           ( 67 L)  layoutDocked, placedIn
├── backdrop.ts              ( 12 L)  isBackdrop (el fondo de la tarjeta)
├── editing-layer.tsx        ( 29 L)  La capa de edición (guías, cuadrícula)
├── overlays.tsx             ( 60 L)  Overlays del lienzo
├── element-handles.tsx      ( 21 L)  Las 8 manijas
├── resize-handles.ts        ( 31 L)  Manijas por lado/esquina
├── section-resize-handles.tsx ( 86 L)  Manijas de la sección
├── settings-context.tsx     ( 34 L)  EditScope, snap, grid
├── canvas-options.ts        ( 19 L)  Opciones del lienzo
├── canvas-toggles.tsx       ( 28 L)
└── canvas-settings-menu.tsx ( 86 L)
```

#### El puerto `CanvasCommands`

La costura entre `canvas-editing` y sus dos consumidores (el builder y la página):

```ts
export interface CanvasCommands {
  select: (id: string) => void;
  move:   (id: string, x: number, y: number) => void;
  resize: (id: string, frame: ResizeFrame) => void;
  dock:   (id: string, parentId: string | null, anchor?: DockAnchor) => void;
}
```

| Implementación | Traduce a |
|---|---|
| `builder/builder-commands.ts:6` | `BuilderAction` del reducer del builder |
| `site/use-block-gestures.ts:51` | `SiteAction` del sitio (con caso especial del *backdrop*) |

#### El orquestador (`use-canvas-gestures.ts`)

```
startDrag(e, element, handle?)
  ├─ commands.select(element.id)        ← seleccionar es parte del gesto
  ├─ drag.current = { id, sides, resizing, startX, startY, start, moved, scale, corner }
  └─ e.currentTarget.setPointerCapture(e.pointerId)   ← el arrastre sobrevive al salir del lienzo

onPointerMove(e)
  ├─ travelled < 3 px  ⇒ es un clic, no un arrastre
  ├─ snappedEdges()    ⇒ aplica el imán (Ctrl lo desactiva)
  ├─ resizing ⇒ planResize() ⇒ commands.resize()
  └─ moving   ⇒ planMove()   ⇒ commands.move() + actualiza el preview de soltar

endDrag()
  └─ si hubo movimiento y hay destino ⇒ commands.dock(id, parent.id, anchor)
```

**Detalle crítico: el zoom.** `DragState.scale` (línea 37) es la razón entre el ancho en pantalla y el
ancho CSS del lienzo. Todos los deltas se dividen por `scale` para que arrastrar 10 px en pantalla
mueva 10 px **de lienzo**, no 10 px escalados.

**Detalle crítico: el `ref` del drop.** `endDrag` lee `latestDrop.current`, no el estado de React —
porque el `pointerup` puede llegar antes de que el estado se haya renderizado.

#### El imán (`snapping.ts`)

```
GRID_SIZE = 8, SNAP_THRESHOLD = 6 px
```

- **Objetivos** (`targetsOf`): por cada referencia → borde inicial, **centro**, borde final. Un elemento
  se pega a bordes *y* centros.
- **Anclas** (`anchorsOf`): los bordes que se mueven; el centro sólo se ancla si se mueven **ambos**
  extremos del eje.
- **Prioridad**: guía > cuadrícula. Si no hay guía a menos de 6 px, se usa la cuadrícula (si `settings.grid`
  está activo) y **no se dibuja línea guía**.
- Cada eje se ajusta **independientemente**; como mucho 1 guía por eje.

#### Acoplado (docks)

Un elemento "acoplado" vive dentro de un contenedor, en una de las **9 casillas 3×3** (`dock-slots.ts`)
o en posición libre dentro de él (`offset`).

- `dock-layout.ts` — `layoutDocked(elements)` recalcula posiciones y **reordena** el array para que cada
  hijo se dibuje encima de su contenedor. Se aplica **después de cualquier acción** en el reducer del
  builder (`builder-reducer.ts:17`).
- `dock-patch.ts` (en `site/`) — parches de acoplado.

**Consecuencia de `layoutDocked`:** la acción `reorder` ("al frente" / "al fondo") sólo tiene efecto real
sobre elementos **sueltos**; los acoplados quedan ordenados por el árbol.

#### El "backdrop"

`canvas-editing/backdrop.ts:11` — `isBackdrop(element, section)`: un elemento que cubre ≥90% de la sección
es el fondo de la tarjeta/sección.

- En la **página**: arrastrarlo mueve la sección entera y sus manijas se reducen a 3
  (`BACKDROP_HANDLES = ["e", "s", "se"]` en `component-view.tsx:20`).
- En el **builder**: no se usa.

---

### 8.4 builder — el constructor de componentes

**22 archivos, 1.074 líneas.** Editor de **componentes reutilizables** (no de páginas). Se abre como
**modal** (`<dialog>` nativo), no como ruta.

```
builder/
├── builder-host.tsx        ( 12 L)  ★ Monta el modal si hay `builder` en el contexto
├── component-builder.tsx   (107 L)  ★ El flujo completo: estado, guardado, layout
├── builder-header.tsx      ( 77 L)  Nombre, categoría, plantilla, guardar/cancelar
├── builder-canvas.tsx      ( 83 L)  El lienzo del componente
├── builder-reducer.ts      ( 18 L)  El reducer (13 acciones)
├── builder-types.ts        ( 57 L)  BuilderState, BuilderAction
├── canvas-handlers.ts      ( 36 L)  meta, template, link, select
├── element-handlers.ts     ( 57 L)  add, update, duplicate, reorder, remove
├── placement-handlers.ts   ( 49 L)  move, nudge, resize, dock
├── builder-commands.ts     ( 11 L)  ★ El adaptador a `CanvasCommands`
├── canvas-keys.ts          ( 28 L)  Flechas (1 px / Shift 10), Supr
├── properties-panel.tsx    ( 20 L)  Despacha entre propiedades de lienzo y de elemento
├── canvas-properties.tsx   ( 49 L)  Propiedades del componente
├── element-properties.tsx  ( 90 L)  Propiedades del elemento
├── text-properties.tsx     ( 54 L)  Propiedades de texto
├── media-source-section.tsx(114 L)  Origen del medio (archivo o URL)
├── element-toolbar.tsx     ( 32 L)  La barra de la izquierda (añadir elementos)
├── element-rules.ts        ( 41 L)  detach, descendantIds
├── kind-traits.ts          ( 22 L)  Propiedades específicas por tipo
├── dock-section.tsx        ( 74 L)  Acoplar a un contenedor
├── panel-fields.tsx        ( 29 L)  Campos reutilizables
└── canvas-toolbar.tsx      ( 14 L)
```

#### El modelo (`builder-types.ts`)

```ts
export interface BuilderState {
  name: string;
  category: ComponentCategory;
  width: number;
  height: number;
  elements: CanvasElement[];
  links: Record<string, LinkTarget>;
  selectedId: string | null;
}
```

Es una **proyección** de `ComponentDef` sin `id`, `description`, `custom` ni `styles` (los preserva el
reducer del sitio).

#### Las 13 acciones

| Grupo | Acciones | Manejador |
|---|---|---|
| **Lienzo** (4) | `meta` `template` `link` `select` | `canvas-handlers.ts` |
| **Elementos** (5) | `add` `update` `duplicate` `reorder` `remove` | `element-handlers.ts` |
| **Colocación** (4) | `move` `nudge` `resize` `dock` | `placement-handlers.ts` |

Reglas relevantes:

- `update` con `x`/`y` ⇒ **suelta** el elemento de su contenedor.
- `update` con `width`/`height` ⇒ **rompe** el ajuste al contenedor (`fitToParent: undefined`).
- `duplicate` ⇒ copia **desacoplada**, desplazada +12,+12 px, y **sin heredar enlaces**.
- `remove` ⇒ **en cascada**: borra el elemento *y todos sus descendientes* *y sus enlaces*.
- `template` ⇒ **reemplaza** elementos y enlaces, y filtra los enlaces a páginas inexistentes.

#### El flujo del constructor

```
ComponentBuilder (useReducer)
  ├─ addElement(kind)  → escala en cascada (16 + (n % 6) * 12) para que no se pisen
  ├─ CanvasToolbar     → tamaño del lienzo
  ├─ BuilderCanvas     → <EditingLayer active /> + useCanvasGestures
  ├─ PropertiesPanel   → CanvasProperties (sin selección) | ElementProperties (con selección)
  └─ save()
       ├─ valida: nombre no vacío, nombre único, ≥1 elemento
       ├─ despacha { type: "component/save", component: {…, custom: true} }
       └─ onClose()
```

`PropertiesPanel` usa `key={element.id}` en `ElementProperties` para **forzar el remount** al cambiar de
selección (así se reinician los borradores internos).

#### Montaje (`builder-host.tsx`)

```tsx
export function BuilderHost() {
  const { builder, closeBuilder } = useCommands();
  if (!builder) return null;                              // no se monta si está cerrado
  return <ComponentBuilder initial={builder === "new" ? undefined : builder} onClose={closeBuilder} />;
}
```

Se abre desde tres sitios: el panel lateral (`components-tab.tsx:142`, `:158`, `:106`) y los comandos
`/crear` y `/editar` (`commands/slash/create-verb.ts:30`, `edit-verb.ts:85`).

---

### 8.5 placement — colocación libre en la página

**11 archivos, 536 líneas.** Permite **sacar** un bloque, el titular o un medio del flujo normal y
colocarlo en coordenadas absolutas de la página.

```
placement/
├── types.ts               (  7 L)  Placement = { x, y, width }
├── placement-plan.ts      (123 L)  ★ El algoritmo de colocación
├── placement-rules.ts     ( 88 L)  placeBlock, placeTitle, placeMedia, transfer*
├── placement-style.ts     ( 17 L)  placementStyle, placementAttributes
├── page-geometry.ts       ( 33 L)  ★ Conversión pantalla ↔ píxeles de página
├── page-guides.tsx        ( 28 L)  Las líneas de alineación
├── placement-grip.tsx     ( 24 L)  El botón "⠿ Mover"
├── use-placement-drag.ts  ( 94 L)  El hook de arrastre
├── use-width-resize.ts    ( 64 L)  El redimensionado de ancho
├── use-placed-extent.ts   ( 28 L)  La altura mínima de la página
└── width-handles.tsx      ( 30 L)  Las 6 manijas de ancho
```

**`Placement` sólo tiene `x`, `y`, `width`.** No hay `height`: el alto lo manda el contenido y se
calcula con `usePlacedExtent` (se mide `[data-placed]` y se suma `PAGE_PADDING_BOTTOM = 48`).

**El zoom y la conversión.** `page-geometry.ts:8` define:

```ts
scaleOf(page) = rect.width / offsetWidth     // el zoom del lienzo
edgesIn(...)  = (rect.elemento - rect.página) / scale
```

Todo el subsistema trabaja en **píxeles de página** y divide por `scale` al leer del DOM.

**El arrastre** (`use-placement-drag.ts`):

- `pointerdown` ⇒ `itemAndPage(e.currentTarget)` localiza el `[data-placeable]` y su `[data-site-page]`.
- Se registra `pointermove` / `pointerup` / `pointercancel` en `window` (patrón "latest ref" con
  `useRef` + `useLayoutEffect` para no re-registrar en cada render).
- En cada frame se aplica el `placement` provisional **de verdad** (el elemento se mueve) y se publican
  las guías.
- La página destino se resalta con `data-drop-hot` (verde, `globals.css:55`).
- Al soltar: si el puntero está sobre **otra** página ⇒ `transfer`; si no ⇒ `place` recortado.

**Transferencia entre páginas** (`placement-rules.ts:29-52`): quita el elemento de la página origen, lo
añade al final de la de destino **y cambia `currentPageId`** para que se vea lo que se movió.

---

### 8.6 navigation — enlaces, transiciones y vista previa

**12 archivos, 1.072 líneas.**

```
navigation/
├── types.ts               ( 41 L)  LinkTarget, Transition, NavMode, Point
├── links.ts               (159 L)  normalizeTransition, normalizeExternalUrl, flowEdges, pruneLinks…
├── navigation-context.tsx (204 L)  ★ El modo, la flecha de enlace, followLink
├── navigation-tab.tsx     (103 L)  La pestaña "Enlaces" del panel lateral
├── flow-map.tsx           (167 L)  ★ El mapa de flujo entre páginas (SVG)
├── link-editor.tsx        (145 L)  Editor de un enlace
├── link-handle.tsx        ( 44 L)  El botón ↗ del elemento
├── link-popover.tsx       ( 58 L)  El popover flotante
├── connection-overlay.tsx ( 28 L)  La flecha SVG que sigue al puntero
├── mode-bar.tsx           ( 40 L)  El aviso flotante en vista previa
├── preview-toggle.tsx     ( 30 L)  El botón "Probar" del header
└── transition-fields.tsx  ( 53 L)  Selector de transición
```

#### El modelo

```ts
export type TransitionKind = "none" | "fade" | "slide" | "zoom";
export interface Transition { kind: TransitionKind; seconds: number; }

export type LinkTarget =
  | { kind: "page"; pageId: string; transition?: Transition }
  | { kind: "external"; url: string; newTab: boolean };

export type NavMode = "edit" | "preview";
```

**El "preview" no es un modo de diseño separado**: es un estado binario. El diseño se edita siempre en
`edit`; `preview` sólo cambia el render a una capa a pantalla completa y activa los enlaces.

#### La flecha de enlace — el gesto más singular

No usa HTML5 drag & drop, sino **Pointer Events en `window`** (`navigation-context.tsx:140-173`):

```
pointermove → setConnecting({from, to}) + setHotDrop(dropTargetAt(x, y))
pointerup   → ¿hubo arrastre (≥6 px)?
               no  → abrir el editor de enlaces de ese elemento
               sí, destino "external" → crear enlace externo vacío y abrir el editor
               sí, destino "page:<id>" → crear enlace a esa página
```

Los destinos se marcan con **atributos DOM** `data-link-drop="page:<id>"` o `"external"`, y se detectan
con `document.elementFromPoint(...).closest("[data-link-drop]")`. Los nombres están centralizados en
`navigation-context.tsx:19-20`.

`ConnectionOverlay` dibuja una SVG a pantalla completa con la línea discontinua que sigue al puntero.

#### Transiciones

```
MIN = 0.1 s, MAX = 5 s, DEFAULT = { fade, 0.4 s }
```

`normalizeTransition` recorta, redondea a un decimal y convierte `"none"` en 0.
`resolveTransition` usa la del enlace si la tiene; si no, la del sitio.

Al navegar, `artboard.tsx:171` remonta el cuerpo con `key={`${page.id}:${transitionKey}`}` y aplica la
clase `nav-anim-{kind}`. La cabecera (`shellPage`) queda **fuera** del div animado, para conservar su
estado.

#### El mapa de flujo (`flow-map.tsx`)

`flowEdges(pages, components)` (`links.ts:124-145`) recorre páginas → bloques → componentes → `def.links`
y cuenta los enlaces **de página a página** por par. Filtra: el elemento debe existir, el destino no
puede ser la propia página, y la página destino debe existir.

---

### 8.7 media — imágenes y videos

**10 archivos, 790 líneas.**

```
media/
├── types.ts             ( 15 L)  MediaItem
├── media-url.ts         ( 78 L)  ★ parseMediaUrl, youtubeId, embedSrc
├── media-context.tsx    (137 L)  addFiles, addUrl, pickImages, posters
├── media-list.tsx       (220 L)  La lista de medios, con PlacementGrip y WidthHandles
├── media-drop-zone.tsx  ( 52 L)  Drag & drop desde el escritorio
├── media-url-dialog.tsx ( 98 L)  Diálogo de imagen/video por URL
├── media-notice.tsx     ( 17 L)  Avisos flotantes
├── poster.ts            ( 35 L)  Reglas del archivo de portada
├── poster-menu.tsx      (115 L)  Menú de portada (createPortal a document.body)
└── image-file.ts        ( 23 L)  Reglas del archivo de imagen
```

#### El modelo

```ts
export interface MediaItem extends ParsedMedia {
  id: string;
  local: boolean;        // true si src es un object URL
  hidden?: boolean;
  placement?: Placement;
  poster?: string;
  posterLocal?: boolean;
}
```

La dualidad `local`/`posterLocal` existe para poder liberar los *object URLs* con
`URL.revokeObjectURL` al borrar.

#### Parseo de URLs (`media-url.ts`)

- `youtubeId` — reconoce `youtu.be/<id>`, `?v=<id>`, `/shorts|embed|live/<id>`; valida con
  `YOUTUBE_ID = /^[\w-]{11}$/`.
- `embedSrc` — convierte a `youtube-nocookie.com/embed/<id>` o `player.vimeo.com/video/<id>`.
- `parseMediaUrl` — detecta video si hay embed **o** si la ruta acaba en `.mp4|.webm|.ogg|.mov|.m4v`.

#### Reglas de archivo (idénticas en `image-file.ts` y `poster.ts`)

Tipo `image/*` y **≤ 10 MB**. Los videos locales se rechazan:
*"Los videos solo se pueden agregar con un enlace (URL)."*

**Aviso:** esta validación está **duplicada** en `media-context.tsx:41-46` (`rejectionOf`) y en
`media/image-file.ts:8-13` (`imageFileProblem`). Ver §14.

#### El `PosterMenu` se monta en `document.body`

```tsx
createPortal(menu, document.body)
```

Porque el lienzo usa `zoom` CSS: un menú dentro se vería escalado y desplazado.

---

### 8.8 format — el menú contextual de formato

**7 archivos, 877 líneas.** Es el editor rápido de la **selección actual** (un elemento, una sección).

```
format/
├── format-model.ts        (238 L)  ★ El modelo: qué se puede cambiar y cómo
├── format-menu.tsx        (321 L)  ★ El menú contextual
├── format-menu-context.tsx ( 39 L)  openFormatMenu, FormatTarget
├── format-options.ts      ( 66 L)  MOVE_STEPS, colorInputValue
├── format-variables.ts    ( 21 L)  Crear una variable desde el menú
├── format-controls.tsx    ( 91 L)  Controles reutilizables
└── variable-select.tsx    (101 L)  Selector de variable
```

**Concepto clave:** el menú de formato trabaja sobre **`site/overrides.ts`** (formato de la instancia),
mientras que la pestaña de apariencia trabaja sobre **`styles/rules`** (reglas por tipo de elemento y
ámbito). Son dos modelos paralelos sobre el mismo DOM y **pueden pisarse** (ver §14).

`format-model.ts` centraliza:
- qué propiedades se pueden cambiar según el `kind` del elemento,
- los **pasos de movimiento** (`MOVE_STEPS`) para mover con precisión,
- la posición (clampada con `clampPosition` de `site/overrides.ts`),
- y la lista de variables aplicables.

---

### 8.9 appearance — reglas de estilo por ámbito

**6 archivos, 651 líneas.** La pestaña "Apariencia" del panel lateral.

```
appearance/
├── appearance-tab.tsx   (109 L)  ★ La pestaña: ámbito, grupos, variables
├── scope-picker.tsx     ( 51 L)  El selector global / página / componente
├── target-card.tsx      ( 79 L)  Una tarjeta por target, plegable
├── style-field.tsx      (104 L)  Una propiedad dentro de una regla
├── literal-input.tsx    (136 L)  El control de cada tipo de valor
└── variables-section.tsx(172 L)  Variables del ámbito
```

#### El modelo de la UI

```ts
export type ScopeChoice =
  | { kind: "global" }
  | { kind: "page" }
  | { kind: "component"; componentId: string };
```

Es **distinto** del `StyleScope` de `styles/types.ts` a propósito: la página es siempre la que se está
editando, así que no necesita `pageId`.

#### Sólo tres tipos de propiedad admiten variable

```ts
const bindable = kind === "color" || kind === "size" || kind === "font";
```

`weight` y `align` no son ligables. Y al elegir "Valor directo" desde una variable, se **materializa el
valor resuelto** para que la regla pase a literal sin perder el valor visual.

#### `LiteralInput` — validaciones finas

- `sixDigitHex` — el `<input type="color">` sólo entiende `#rrggbb`; expande `#abc` → `#aabbcc`.
- `SizeInput` — "10" se guarda como "10px"; un valor inválido **no se aplica** (se marca `aria-invalid`).
- El `placeholder` de un color muestra el **valor heredado**, para que el usuario vea el color real que
  se está heredando.

---

### 8.10 behaviors — interacciones

**9 archivos, 544 líneas.** Une un **disparador** con una **acción**.

```
behaviors/
├── types.ts         ( 30 L)  Behavior, TriggerKind, ActionKind, EffectName, CodeMode
├── triggers.ts      ( 12 L)  TRIGGERS: la tabla de disparadores
├── effects.ts       ( 50 L)  EFFECTS: la tabla de efectos (animaciones)
├── actions.ts       (101 L)  ACTIONS: la tabla de acciones
├── page-api.ts      ( 76 L)  ★ La API que ve el código del usuario
├── sandbox.ts       ( 68 L)  El iframe sin origen
├── execute-code.ts  ( 87 L)  ★ Los dos modos de ejecución
├── use-behaviors.ts ( 89 L)  ★ El enganche al DOM
└── use-page-code.ts ( 31 L)  El JavaScript global de la página
```

#### El modelo

```ts
export interface Behavior {
  id: string;
  name?: string;
  scope: string;              // id del elemento, o SECTION_KEY
  trigger: TriggerKind;
  action: BehaviorAction;
}
```

#### Los dos modos de ejecución (`behaviors/execute-code.ts`)

| Modo | Dónde corre | Acceso |
|---|---|---|
| `page` | En la página del editor | **Total**: DOM, librerías, `import` real |
| `isolated` | En un iframe sin origen | **Mínimo**: sólo la `api` |

El flujo de `page`:

```
splitImports(source)                  → separa los "import" (deben ir arriba)
resolveImport(...)                    → convierte "gsap" en su URL real
buildModule(source, env)
  ├─ env.functions → preludeOf()      (las funciones reutilizables se anidan DENTRO de __portalRun
  │                                   para que vean "api" y "element")
  ├─ safeTranspile()  (sucrase, sólo quita tipos; conserva import/export ES)
  └─ export default async function __portalRun(api, element)
runInPage()
  ├─ Blob → URL.createObjectURL
  ├─ await import(url)               (con webpackIgnore/turbopackIgnore)
  └─ await loaded.default(env.api, env.element)
```

El flujo de `isolated` usa `runInSandbox` (transporte por `postMessage` al iframe).

**Política de errores:** un fallo del código del usuario **nunca** rompe la página. `safeTranspile`
sustituye un error de sintaxis por un `console.error`; `executeCode` captura el error de runtime y lo
registra por `api.log`.

#### Los disparadores (`triggers.ts`)

Tabla `TRIGGERS` con un `reactProp` opcional. `use-behaviors.ts:61` recorre la tabla y asigna el
`reactProp` automáticamente — **añadir un trigger con `reactProp` no requiere tocar ese archivo**.

Dos disparadores son especiales:
- `load` — `useEffect`, se dispara al aparecer la página.
- `enter` — `IntersectionObserver`; se **desconecta tras la primera vez** (`use-behaviors.ts:81-82`),
  así que `enter` es estrictamente de una sola ejecución.

Mientras se edita (`active === false`) **no hay eventos**: sólo al probar el sitio.

---

### 8.11 functions — funciones reutilizables

**2 archivos, 94 líneas.** Es la única pieza del conjunto **sin React**.

```
functions/
├── scope.ts        (61 L)  FunctionScope, functionsFor, preludeOf, extractFunction
└── declaration.ts  (33 L)  declarationOf: la firma ambiental para Monaco
```

```ts
export type FunctionScope =
  | { kind: "global" }
  | { kind: "block"; blockId: string }
  | { kind: "element"; blockId: string; elementId: string };

export interface SharedFunction {
  id: string;
  name: string;
  code: string;      // la declaración completa: "function nombre(…) { … }"
  scope: FunctionScope;
}
```

#### La sombra por especificidad (`functions/scope.ts`)

```ts
const SPECIFICITY = { global: 0, block: 1, element: 2 };
```

`functionsFor(functions, callSite)` filtra las que aplican al punto de llamada y **deduplica por
nombre, quedándose con la más específica** (con `>=`, así que en empate gana la última). Es exactamente
el mismo patrón de *shadowing* que en CSS, pero resuelto en tiempo de ejecución al construir el
preámbulo.

`preludeOf(functions)` concatena las declaraciones; se antepone al código del usuario en
`behaviors/execute-code.ts` y en `code/build-srcdoc.ts`.

#### `extractFunction(code, name)` — convertir selección en función

Si la selección **ya** es una declaración `function nombre(…)`, se respeta tal cual. Si no, se envuelve
en una función y se devuelve también el `call` (`nombre();`) que se escribe donde estaba lo seleccionado.

#### `declarationOf(fn)` — la declaración ambiental

Genera `declare function nombre(...): any;` para que el autocompletado de Monaco vea la firma. Si el
código no parece una declaración válida, cae al fallback.

---

### 8.12 code — ejecución de código del usuario

**7 archivos, 209 líneas.**

```
code/
├── build-srcdoc.ts    ( 59 L)  ★ Genera el documento completo del iframe
├── code-frame.tsx     ( 52 L)  El iframe
├── code-block-view.tsx( 40 L)  Lo que se ve en la página
├── transpile.ts       ( 22 L)  safeTranspile con sucrase
├── use-debounced.ts   ( 13 L)
├── use-origin.ts      (  8 L)  window.location.origin como store
└── use-shared-assets.ts (15 L)  Variables + CSS global + funciones del proyecto
```

#### `buildSrcDoc` — el documento del iframe

```html
<!doctype html>
<html>
<head>
  <script src="{origin}/api/vendor/tailwind"></script>       <!-- si el bloque usa Tailwind -->
  <script type="importmap">{…}</script>                     <!-- si hay librerías -->
  <style type="text/tailwindcss">                           <!-- o sin type, si no -->
    html, body { margin: 0; }
    {variables}          <!-- @theme (con Tailwind) o :root (sin él) -->
    {globalCss}
    {code.css}
  </style>
</head>
<body>
  {code.html}
  <script type="module">{preludeOf(functions) + safeTranspile(code.js)}</script>
  <script>{SIZE_REPORTER}</script>   <!-- avisa del alto con postMessage -->
</body>
</html>
```

**El `importMap`** (`libraries/library-url.ts`) traduce los nombres de librería a URLs reales, para que
el usuario pueda escribir `import gsap from "gsap"`.

**`inside(tag, content)`** escapa `</script` y `</style` del contenido del usuario, para que no pueda
cerrar la etiqueta que lo contiene.

**`SIZE_REPORTER`** usa un `ResizeObserver` y `parent.postMessage({type:"portal:size", height})` para que
el iframe se ajuste a su contenido.

---

### 8.13 workbench — el editor de código

**15 archivos, 1.769 líneas.** Un IDE embebido sobre **archivos virtuales**.

```
workbench/
├── workbench.tsx        (127 L)  ★ El contenedor del editor
├── workbench-context.tsx( 69 L)  ★ Estado: abierto, pestañas, activo
├── file-ref.ts          (217 L)  ★★ El modelo de archivos virtuales
├── file-editor.tsx      (294 L)  El editor Monaco
├── file-target.ts       (127 L)
├── explorer.tsx         (162 L)  El árbol de archivos
├── tree.ts              (134 L)
├── outline.ts           ( 91 L)  El esquema del documento
├── html-outline.tsx     ( 82 L)
├── target-bar.tsx       (137 L)
├── make-function.tsx    ( 83 L)  Convertir selección en función
├── completions.ts       (120 L)  Autocompletado
├── css-wrapper.ts       ( 22 L)
├── typescript-setup.ts  ( 88 L)  Monaco + TypeScript
└── selection-file.ts    ( 16 L)  Qué archivo abrir por defecto
```

#### El modelo de archivos virtuales (`file-ref.ts`)

Los archivos **no existen en disco**: cada uno es un trozo de código del sitio que el editor muestra
como archivo y **guarda de vuelta en su sitio** mediante una `SiteAction`.

```ts
export type FileRef =
  | { kind: "global-css" }
  | { kind: "page-css"; pageId: string }
  | { kind: "page-js"; pageId: string }
  | { kind: "block-html"; pageId: string; blockId: string }
  | { kind: "block-css"; pageId: string; blockId: string }
  | { kind: "block-js"; pageId: string; blockId: string }
  | { kind: "custom-css"; pageId: string; blockId: string; key: string }
  | { kind: "component-css"; componentId: string; key: string }
  | { kind: "behavior-js"; pageId: string; blockId: string; behaviorId: string }
  | { kind: "function"; functionId: string };
```

Cada entrada de `FILE_KINDS` declara: `language`, `name()`, `read()`, `write()` (devuelve la
`SiteAction`), `callSite()` (desde dónde llama a las funciones) y `scopes()` (en qué alcances se puede
convertir en función).

`fileId(ref)` produce una **identificación estable** (los campos ordenados alfabéticamente, unidos con
`&`), que se usa para las pestañas y para los modelos de Monaco.

**Ejemplo** de cómo se "guarda de vuelta":

```ts
"page-css": {
  language: "css",
  name: (site, ref) => { const p = pageOf(site, ref.pageId); return p ? `Página ${p.name} · estilos.css` : null; },
  read:  (site, ref) => pageOf(site, ref.pageId)?.css ?? "",
  write: (_site, ref, css) => ({ type: "page/code", pageId: ref.pageId, patch: { css } }),
  callSite: () => null,
  scopes: () => [],
}
```

**Cuando el archivo "ya no existe", `name()` devuelve `null`** y la pestaña se cierra sola.

#### `typescript-setup.ts`

Configura Monaco con TypeScript y le inyecta:
- las declaraciones de las librerías (`Library`),
- las declaraciones ambientales de las funciones (`declarationOf`).

---

### 8.14 commands — paleta y atajos

**22 archivos, 1.555 líneas.**

```
commands/
├── command-definitions.ts (182 L)  ★ El registro único de comandos
├── commands-context.tsx   (182 L)  ★ El contexto
├── command-palette.tsx    (131 L)  La paleta (Ctrl+B)
├── use-palette.ts         (128 L)  La máquina de estados de la paleta
├── shortcut.ts            ( 70 L)  Normalización de atajos
├── shortcut-store.ts      ( 53 L)  Persistencia en localStorage
├── shortcuts-settings.tsx (127 L)  El editor de atajos
├── kbd.tsx                ( 18 L)  Renderiza una tecla
├── scroll-to-target.ts    (  5 L)
└── slash/                 (13 archivos)
    ├── types.ts     ( 46 L)  Step = List | Prompt, SlashContext
    ├── verbs.ts     ( 21 L)  El registro de verbos
    ├── steps.ts     ( 20 L)
    ├── targets.ts   ( 45 L)
    ├── text-match.ts( 16 L)  Normalización + AND de tokens
    ├── create-verb.ts ( 52 L), edit-verb.ts ( 95 L), delete-verb.ts ( 93 L),
    │   hide-verb.ts ( 79 L), color-verb.ts ( 45 L), rule-verb.ts ( 67 L),
    │   navigate-verb.ts ( 19 L), content-search.ts ( 61 L)
```

#### El registro de comandos (`command-definitions.ts`)

**25 comandos** en 8 grupos. La paleta, los atajos y los tooltips **salen todos de esta tabla** — no
hay metadatos duplicados.

| Grupo | Comandos |
|---|---|
| General | `code.open` (Ctrl+E), `app.palette` (Ctrl+B), `app.shortcuts` (Ctrl+,) |
| Versiones | `versions.open` (Ctrl+Shift+G) |
| Navegación | `mode.preview` (P), `mode.edit` |
| Herramientas | `tool.select` (V), `tool.hand` (H), `tool.frame` (F), `tool.text` (T), `tool.comment` (C) |
| Figuras | `tool.rectangle` (R), `tool.ellipse` (O), `tool.line` (L), `tool.triangle` |
| Medios | `media.upload` (I), `media.image-url` (Alt+I), `media.video-url` (Alt+V) |
| Vista | `device.desktop` (Alt+1), `device.tablet` (Alt+2), `device.mobile` (Alt+3) |
| Zoom | `zoom.in` (Alt+↑), `zoom.out` (Alt+↓), `zoom.fit` (Shift+1), `zoom.reset` (Alt+0) |

#### Los anillos de seguridad del teclado (`commands-context.tsx:120-142`)

```ts
if (e.defaultPrevented || e.repeat) return;
const combo = eventToCombo(e);
const blocked = (isTypingTarget(e.target) || isInsideDialog(e.target) || dialog !== null)
                && !hasModifier(combo);
if (blocked) return;
const command = commands.find((c) => c.shortcut === combo);
```

- No dispara si el foco está en un input, dentro de un `<dialog>` o hay un diálogo abierto — **salvo que
  haya modificador** (Ctrl/Alt).
- `isTypingTarget` cubre `contentEditable`, `INPUT`, `TEXTAREA` y `SELECT`.
- `isInsideDialog` usa `closest("dialog")`.

#### Normalización y persistencia de atajos

`shortcut.ts` normaliza a un **string canónico**:
- `ctrl` y `meta` → `ctrl` (en Mac, Cmd se muestra como "Ctrl").
- `IGNORED_KEYS` descarta `control/shift/alt/altgraph/meta/dead`.
- La tecla `+` real se guarda como `plus` (para no chocar con el separador).
- `KEY_LABELS` traduce `arrowup` → flecha, `escape` → "Esc".

`shortcut-store.ts` persiste **sólo las diferencias** respecto a los atajos de fábrica, en
`localStorage["editor.shortcuts"]`. Usa `useSyncExternalStore` con `getServerSnapshot` → `"{}"` para
evitar el desajuste de hidratación, y escucha el evento `storage` para sincronizar entre pestañas.

#### La paleta: una máquina de estados

```ts
export type Step =
  | { kind: "list"; title: string; items: ListItem[]; onPick: … }
  | { kind: "prompt"; title: string; placeholder?: string; submit: (query: string) => string | Step | void };
```

El `trail` da historial; `Backspace` con el input vacío retrocede. `Enter` en un `prompt` devuelve
`string` (error en línea), `Step` (avanza) o `void` (cierra la paleta).

**El prefijo `/`** activa los verbos. `TYPED_VERB = /^\/(\S+)\s([\s\S]*)$/` — exige **un espacio** entre
verbo y argumento: `/crear` solo lista verbos; `/crear Página` entra directamente en el paso.

Los verbos se filtran por **prefijo**; los comandos y el contenido, por **AND de tokens**.

---

### 8.15 viewport — el lienzo, el zoom y los dispositivos

**13 archivos, 969 líneas.**

```
viewport/
├── artboard.tsx         (228 L)  ★ CanvasSurface, PageArtboard, CanvasPages, ProductionView
├── viewport-context.tsx ( 92 L)  ★ device, tool, zoom, fitted
├── bottom-toolbar.tsx   ( 74 L)  La barra flotante inferior
├── zoom-controls.tsx    ( 57 L)
├── viewport-switcher.tsx( 41 L)
├── fit-zoom.ts          ( 18 L)  ★ El cálculo del zoom automático
├── use-auto-fit.ts      ( 29 L)
├── use-handle-size.ts   ( 14 L)  ★ Los iconos a tamaño constante
├── insert-menus.tsx     ( 77 L)
├── menu-button.tsx      ( 96 L)  El menú genérico
├── more-menu.tsx        ( 54 L)
├── toolbar-parts.ts    ( 10 L)
└── icons.tsx            (179 L)  Los iconos SVG propios
```

#### El contexto

```ts
export const DEVICES = [
  { value: "desktop", label: "Escritorio", width: 1024 },
  { value: "tablet",  label: "Tablet",      width: 768 },
  { value: "mobile",  label: "Móvil",       width: 390 },
];

export const ZOOM_STEPS = [10, 15, 25, 50, 75, 100, 125, 150, 200, 300];
```

`fitted` distingue el zoom manual del automático. `applyFittedZoom` lo aplica **sin** desactivar el
ajuste.

#### `fitZoom(count, pageWidth, available, steps)`

```
cabe(zoom) = count * pageWidth * zoom / 100 + (count - 1) * 32 + 64 <= available
```

Devuelve el mayor zoom de la lista que cabe; si ninguno, el menor.

#### `useHandleSize` — los iconos a tamaño constante

```ts
style={{ zoom: 100 / zoom }}    // y 12 px en vez de 20 si el zoom < 50 %
```

Los íconos sobre el lienzo miden lo mismo en pantalla, esté el lienzo al 10% o al 300%.

#### `CanvasPages` — dos modos

- **Modo `edit`**: muestra **todas** las páginas en fila, para compararlas y enlazarlas.
- **Modo `preview`**: delega en `ProductionView`, una capa `fixed inset-0 z-40` a pantalla completa.

---

### 8.16 side-panel — el panel lateral

**6 archivos, 651 líneas.**

```
side-panel/
├── side-panel.tsx    (202 L)  ★ El rail de 56px + el panel + el acordeón de estructura
├── components-tab.tsx(169 L)
├── pages-tab.tsx     (171 L)
├── structure-list.tsx( 59 L)
├── data.ts           ( 38 L)  TABS, CATEGORY_LABELS
└── tab-icons.tsx     ( 12 L)
```

**5 secciones:** `pages`, `components`, `navigation`, `appearance`, `libraries`.

- El **rail** de 56 px con los 5 iconos; pulsar la pestaña activa la pliega.
- El ancho del panel es **redimensionable** arrastrando el separador (248–520 px, por defecto 304), con
  flechas ←/→ y doble clic para restablecer.
- El acordeón **"Estructura de {página}"** arranca plegado y lista los bloques y el titular
  (usando `splitBlocks` y `TITLE_SELECTION`).

`pages-tab.tsx` valida los nombres con `isPageNameTaken` y, al borrar, **indica cuántos bloques y medios
se pierden**.

`components-tab.tsx` permite buscar, filtrar por categoría, ver el uso de cada componente, duplicarlo
(`duplicateComponent`) y abrir el constructor.

---

### 8.17 title-editor — el titular

**6 archivos, 465 líneas.**

```
title-editor/
├── types.ts          ( 25 L)  TitleState (15 campos)
├── constants.ts      ( 43 L)  INITIAL_TITLE, FONT_OPTIONS, SIZES
├── title-editor.tsx  (105 L)  ★ TitleCanvas (el titular en la página) + TitleToolbar
├── title-preview.tsx ( 56 L)  El titular con contentEditable
├── toolbar.tsx       (166 L)  La barra de formato
└── toolbar-controls.tsx (70 L)  ColorButton, HighlightButton
```

`TitleState` es un "estado de documento" plano (sin reducer propio): se guarda tal cual en `Page.title`
y se despacha con `title/patch`.

**El comportamiento más interesante** (`title-editor.tsx:33-44`): si el titular sigue los estilos del
sitio (`applyToSite: true`) y el usuario toca una propiedad **que una regla está mandando**, el titular
se **desvincula** (`applyToSite: false`) copiando primero los valores visibles — para que no dé un
salto visual.

`TitlePreview` usa `contentEditable`, envuelve en `<a>` si hay enlace y en `<ul>/<ol>` si hay lista.

---

### 8.18 customize — el inspector derecho

El panel contextual de propiedades cuenta con modos de acoplamiento lateral (en el flujo flex sin sobreponerse al lienzo), modo ventana flotante desacoplada con arrastre libre y modo colapsable a barra de iconos lateral (estilo Adobe Illustrator y panel izquierdo):

```
customize/
├── inspector.tsx                  ★ El panel derecho contextual con paleta de colores integrada
├── dockable-panel.tsx             ★ Contenedor acoplable/flotante con plegado a iconos
├── dockable-inspector-context.tsx ★ Contexto y persistencia de acople, posición y dimensiones
├── behavior-editor.tsx            Editor de una interacción
├── behavior-fields.tsx            Los campos según la acción
└── tailwind-runtime.tsx           Carga @tailwindcss/browser en la página
```

`TailwindRuntime` inyecta el script de Tailwind para que las clases `bg-primario` funcionen en el
editor, no sólo en el iframe de los bloques de código.

---

### 8.19 libraries — el gestor de librerías

**6 archivos, 335 líneas.**

```
libraries/
├── cdn.ts             ( 20 L)  El catálogo de librerías con su URL de CDN
├── library-url.ts     ( 19 L)  libraryUrl, importMapOf
├── libs-api.ts        ( 28 L)  El cliente de /api/libs
├── snippets.ts        ( 37 L)  Los ejemplos de uso
├── use-libs-status.ts ( 18 L)  Si se puede instalar en este entorno
└── libraries-tab.tsx  (213 L)  La pestaña del panel lateral
```

`Library` en el estado del sitio:

```ts
export interface Library { id: string; name: string; version: string; source: "cdn" | "pnpm"; }
```

Dos orígenes: `cdn` (una URL de un catálogo) y `pnpm` (instalada localmente con el gestor de
librerías, §9).

---

### 8.20 versioning — el control de versiones

**31 archivos, 2.615 líneas.** Es el subsistema más grande, y el más engañoso: **parte es real y parte
es simulación**.

```
versioning/
├── types.ts               (141 L)  El modelo de dominio
├── versioning-reducer.ts  (223 L)  15 acciones
├── versioning-context.tsx ( 37 L)  ★ Sólo expone { state, dispatch }
├── versioning-rules.ts    (117 L)  ★ Las reglas puras
├── mock-data.ts           (130 L)  ★ Los datos de ejemplo
├── design-snapshot.ts     (154 L)  ★★ La captura del diseño
├── use-design-snapshot.ts ( 15 L)  El hook que la calcula
├── use-working-changes.ts ( 18 L)  Los cambios sin guardar
├── preview-model.ts       ( 86 L)  El modelo "visual" (legacy)
├── visual-diff.tsx        ( 75 L)  ★ El diff visual
├── page-preview.tsx       (159 L)  La miniatura de la página
├── branches-tab.tsx       (242 L)
├── branch-switcher.tsx    ( 44 L)
├── changes-list.tsx       ( 69 L)  El "git add"
├── commit-card.tsx        ( 27 L)
├── commit-timeline.tsx    ( 54 L)
├── conflict-card.tsx      ( 59 L)
├── diff-row.tsx           ( 61 L)
├── pull-requests-tab.tsx  ( 70 L)
├── pull-request-detail.tsx(149 L)
├── new-pull-request-form.tsx (81 L)
├── publish-tab.tsx        ( 44 L)
├── publish-card.tsx       (105 L)
├── publish-button.tsx     ( 33 L)
├── issues-tab.tsx         (176 L)
├── history-tab.tsx        ( 19 L)
├── versions-dialog.tsx    ( 87 L)
├── assignee-picker.tsx    ( 59 L)
├── step.tsx               ( 27 L)
├── format-date.ts         ( 10 L)
└── versioning-icons.tsx   ( 44 L)
```

#### Qué es real y qué es simulado

| Capa | Estado | Evidencia |
|---|---|---|
| **Commits** | ✅ **REAL** | Se generan del diff real del `SiteState` vivo |
| **Cambios sin guardar / baseline** | ✅ **REAL** | `diffSnapshots` sobre el `SiteState` actual |
| **Ramas** | ⚠️ Real pero superficial | `branch/create` no clona commits ni baseline |
| **Pull Requests** | 🔶 Semi-mock | El PR se crea real y calcula sus `changes` con `summarizeChanges`, pero **nunca detecta conflictos** (`conflicts: []` hardcodeado en `versioning-reducer.ts:144`) |
| **Conflictos** | 🔴 **100% mock** | Sólo el de `mock-data.ts:82-91` |
| **Issues / etiquetas / miembros** | 🔴 **100% mock** | Seeded desde `mock-data.ts` |
| **Publicación** | 🔴 **Simulada** | `publish` sólo añade una entrada a un array; **no toca el sitio** |
| **Persistencia** | 🔴 **Ninguna** | Recargar la página reinicia todo al `INITIAL_STATE` |

**No existe ninguna API route de versionado.** Todo vive en el `useReducer` del navegador.

#### La captura del diseño (`design-snapshot.ts`) — la parte interesante

Convierte el `SiteState` en un **mapa plano de propiedades comparables**, indexado por una **clave
estable**:

```ts
export type DesignSnapshot = Record<string, SnapshotEntry>;
export interface SnapshotEntry { node: string; property: string; value: string; }
```

Las claves generadas:

| Prefijo | Qué mide |
|---|---|
| `page:<id>` | El nombre de la página |
| `<pageId>:titular:<prop>` | Las 14 propiedades del titular |
| `hidden:page:<id>` / `hidden:title:<id>` | Visibilidad |
| `block:<id>` / `hidden:block:<id>` | Presencia y visibilidad del bloque |
| `format:<id>` | Un **hash** del formato (box + elements) |
| `media:<id>` / `poster:<id>` / `hidden:media:<id>` | Medios |
| `component:<id>` | La firma del componente |
| `nav:transition` | La transición por defecto |
| `link:<defId>:<elementId>` | Los enlaces |
| `var:<id>` | Las variables |
| `rule:<scope>:<target>:<prop>` | Las reglas de estilo |

**`hashOf(value)`** es una huella **djb2** en base 36 de 5 caracteres. Permite resumir estructuras
arbitrarias (un array de elementos con 20+ campos) a un string comparable — así se detecta "el
componente cambió" sin enumerar cada campo.

`diffSnapshots(baseline, current)` es el **"git status"**: recorre la unión de claves, ignora las que
tienen el mismo valor y usa `"—"` (`ABSENT`) para la ausencia. Devuelve `WorkingChange[]`, donde
`current: null` significa "la propiedad **desapareció**" (p. ej. se quitó una imagen).

#### El baseline inicial **no** viene del mock

```tsx
// versioning-context.tsx:30-34
const initialDesign = useDesignSnapshot();
const [state, dispatch] = useReducer(versioningReducer, initialDesign, (baseline) => ({
  ...INITIAL_STATE,
  baseline,
}));
```

El tercer argumento de `useReducer` recibe `initialDesign` como `baseline`. Es decir: **la foto inicial
del portal se convierte en la "versión guardada de partida"**.

#### `summarizeChanges(commits)` — el diff neto

```ts
for (const commit of [...commits].reverse()) {   // del más antiguo al más reciente
  const key = `${change.node}\u0000${change.property}`;
  const previous = net.get(key);
  net.set(key, previous ? { ...change, before: previous.before } : change);
}
return [...net.values()].filter((c) => c.before !== c.after);
```

- La clave usa `\u0000` como separador, para que ningún nombre de nodo colisione con el de propiedad.
- Si una propiedad se tocó varias veces, **conserva el `before` original** y sobrescribe el `after` con
  el valor más reciente, **atribuido al último commit** que la tocó.
- **Filtra los cambios neutros**: si el valor final == inicial, el cambio desaparece.

#### `mergeBlockers(pr)` y `publishBlockers(ctx)`

Los dos sitios donde el versionado bloquea al usuario:

```ts
mergeBlockers(pr) → ["Resuelve N conflictos de merge.", "Faltan N aprobaciones."]
publishBlockers({unsavedCount, head, live}) →
  ["Tienes N cambios sin guardar…", "Esta rama todavía no tiene versiones…",
   "La última versión de esta rama ya está publicada."]
```

`pr/merge` **crea un commit de merge con `changes: []`**: el merge **no traslada** los cambios del PR a
la rama destino.

#### El diff visual

`visual-diff.tsx` + `page-preview.tsx` dibujan dos miniaturas de la página (antes / después) con las
zonas modificadas numeradas, y debajo una tarjeta por zona con los cambios.

⚠️ **Dos modelos de datos paralelos** (ver §14):

| | `design-snapshot.ts` (real) | `preview-model.ts` (visual) |
|---|---|---|
| Clave | `page:inicio:titular:Tamaño` | `"Titular\|Tamaño"` |
| Nodo | `"Inicio · Titular"` | `"Titular"` |
| Origen | `SiteState` real | constantes hardcodeadas |

El `VisualDiff` **no** usa el snapshot real: usa `DEFAULT_MODEL` con nombres legacy. Por eso en la UI
coexisten `"Titular · Tamaño"` y `"Inicio · Titular · Tamaño"`.

---

### 8.21 ui — los componentes base

**8 archivos, 296 líneas.**

```
ui/
├── modal.tsx         ( 42 L)  ★ <dialog> nativo con showModal()
├── badge.tsx         ( 27 L)  5 tonos: neutral | accent | success | danger | warning
├── collapsible.tsx   ( 42 L)
├── inline-form.tsx   ( 67 L)
├── number-field.tsx  ( 30 L)
├── avatar.tsx        ( 46 L)
├── section.tsx       ( 10 L)
└── use-dismiss.ts    ( 32 L)  Escape en fase de captura
```

`Modal` usa `<dialog>` nativo: el navegador aporta el **foco atrapado**, el `::backdrop` y el cierre con
`Esc`. El clic en el fondo cierra (`e.target === e.currentTarget`).

`use-dismiss` captura `Escape` **en fase de captura** con `stopPropagation`, para que un popover interno
gane al `<dialog>` padre.

---

## 9. API Routes y servidor

### 9.1 `app/api/libs/route.ts` — instalar librerías con pnpm

| Método | Qué hace |
|---|---|
| `GET` | Devuelve `{ available, reason?, installed: [{name, version}] }` |
| `POST` | `pnpm add nombre@versión` en este proyecto |
| `DELETE` | `pnpm remove nombre` |

### 9.2 `app/server/npm-libraries.ts` — el corazón

**Guardas de seguridad (líneas 29-47):**

```ts
export function guardRequest(request: Request): Response | null {
  const url = new URL(request.url);
  const origin = request.headers.get("origin");
  const sameOrigin = origin === null || new URL(origin).host === url.host;

  if (!LOCAL_HOSTS.has(url.hostname) || !sameOrigin ||
      request.headers.get(REQUEST_HEADER) !== "1") {
    return Response.json({ error: "Petición no permitida." }, { status: 403 });
  }
  const { available, reason } = availability();
  return available ? null : Response.json({ error: reason }, { status: 403 });
}
```

**Cuatro capas de protección:**

1. **Sólo en desarrollo** (`NODE_ENV !== "production"`).
2. **Sólo desde `localhost` / `127.0.0.1` / `[::1]`**.
3. **Sólo del mismo origen** (otra página necesitaría permiso CORS).
4. **Cabecera `x-portal-request: 1`** — sólo la app la envía.

El motivo está en el comentario del principio del archivo:

> *"instalar un paquete ejecuta código ajeno en tu equipo, así que ninguna otra página ni equipo de la
> red puede pedirlo."*

**Cómo se ejecuta pnpm** (líneas 98-120): se usa el `npm_execpath` que dejó pnpm al arrancar el
servidor de desarrollo, con `execFile` (sin shell), para que nada de lo recibido se interprete como un
comando. Timeout de 3 minutos. Los scripts del paquete **no** se ejecutan (`--ignore-scripts`).

**Paquetes protegidos** (líneas 64-69): los que ya están en `package.json` (next, react…) no se pueden
cambiar.

**El manifiesto** `portal-libraries.json` registra lo instalado desde la app:

```json
{ "libraries": ["swipe"] }
```

### 9.3 `app/api/libs/bundle/route.ts` — empaquetar con esbuild

```ts
const { build } = await import("esbuild");   // se carga al usarlo
build({
  stdin: { contents, resolveDir: ROOT, loader: "js" },
  bundle: true, format: "esm", platform: "browser",
  target: "es2020", minify: true, write: false,
  define: { "process.env.NODE_ENV": '"production"' },
});
```

Con **CORS abierto** (`Access-Control-Allow-Origin: "*"`) porque el código del usuario corre en un iframe
sin origen propio. El resultado se cachea en memoria por `nombre@versión`.

Si el paquete no tiene export por defecto, se reexportan sólo sus nombres (`export * from "x"`).

### 9.4 Las rutas de `vendor`

| Ruta | Qué sirve |
|---|---|
| `/api/vendor/monaco/[...path]` | `node_modules/monaco-editor/min/vs/**` — el editor de VS Code, sin depender de un CDN |
| `/api/vendor/tailwind` | `node_modules/@tailwindcss/browser/dist/index.global.js` — Tailwind que compila las clases al vuelo |

`serveVendorFile` (`app/server/vendor-files.ts`) protege contra **path traversal**:

```ts
if (!file.startsWith(root + path.sep) || !type) return new Response("No encontrado", { status: 404 });
```

Sólo se sirven extensiones conocidas (`.js`, `.css`, `.json`, `.ttf`, `.map`). Cache: 1 hora.

---

## 10. Configuración de build

### `next.config.ts`

```ts
export default {
  experimental: {
    agentFeedback: true,
    // Un solo proceso de trabajo: en equipos con poca memoria, varios hacían que Next se cayera
    // (y Monaco no cargaba).
    cpus: 1,
  },
  cacheComponents: true,
  // esbuild es un binario nativo: se usa desde el servidor (app/api/libs/bundle), no se empaqueta.
  serverExternalPackages: ["esbuild"],
  partialPrefetching: true,
  turbopack: {
    rules: { "*.css": { loaders: ["@tailwindcss/turbopack"], as: "*.css" } },
  },
} satisfies NextConfig;
```

- `cpus: 1` — un comentario explica que con varios workers Next se caía en equipos con poca memoria.
- `serverExternalPackages: ["esbuild"]` — esbuild es un binario nativo, no se puede empaquetar.
- La regla de Turbopack para `*.css` es lo que hace que Tailwind v4 funcione.

### `tsconfig.json`

`strict: true`, `noEmit: true`, `moduleResolution: "bundler"`, `paths: { "@/*": ["./*"] }`.

### `pnpm-workspace.yaml`

```yaml
allowBuilds:
  esbuild: false
  unrs-resolver: false
```

Ninguno de los dos necesita scripts de instalación.

### `eslint.config.mjs`

ESLint 9 en formato flat, con `eslint-config-next`.

---

## 11. Flujos de trabajo completos

### 11.1 Crear un componente y usarlo en una página

```
1. Panel lateral → Componentes → "+ Nuevo componente"
     └─ openBuilder("new")                        commands-context.tsx:161
2. BuilderHost detecta "builder" y monta el modal
     └─ ComponentBuilder                           builder-host.tsx:11
3. Elige una plantilla → action "template"
     └─ template.build(nextId)                    canvas-handlers.ts:17
4. Añade elementos (barra izquierda) → action "add"
     └─ newElement(kind, newId, {x, y}) escalonado  component-builder.tsx:37
5. Arrastra elementos → useCanvasGestures → CanvasCommands
     └─ builderCommands(dispatch) → BuilderAction   builder-commands.ts:6
6. "Guardar componente" → valida y despacha
     └─ { type: "component/save", component }       component-builder.tsx:50
7. El reducer del sitio guarda el ComponentDef
     └─ component/save (preserva "styles" previos)  site-reducer.ts:274
8. Añádelo a una página → action "block/add"
     └─ crea un BlockInstance con componentId       site-reducer.ts:149
9. En la página, el bloque se renderiza combinando:
     def + styles.component(def) + applyOverrides() + customCss()
                                            page-blocks.tsx:54-57
```

### 11.2 Editar un elemento en la página (alcance = bloque)

```
1. Clic sobre el elemento → interaction.onSelect
     └─ dispatch({ type: "element/select", id })   site/page-blocks.tsx:114
2. Arrastrar → useBlockGestures → useCanvasGestures
     └─ commands.move(...)                          site/use-block-gestures.ts:56
3. use-block-gestures lee settings.scope
     └─ scope === "block" → { type: "block/style" } site/scope-actions.ts:17
4. El reducer aplica el override con styleElements()
     └─ mergePatch + resolveOverride()             site/overrides.ts:94
5. applyOverrides() lo refleja en el render
```

### 11.3 Enlazar un elemento con otra página

```
1. Hover sobre el elemento → aparece el LinkHandle
2. pointerdown → startConnect(element, punto)
     └─ connecting = { from, to }                  navigation-context.tsx:140
3. pointermove → dropTargetAt(x, y)
     └─ elementFromPoint(...).closest("[data-link-drop]")
4. Se resaltan los destinos (FlowMap en verde, marcos con ring-4)
5. pointerup → { type: "link/set", id, link }
     └─ se guarda en ComponentDef.links → vale en TODAS las páginas
6. En preview, el clic → followLink(link)
     └─ resolveTransition + transitionKey + dispatch("page/select")
7. El cuerpo se remonta con key y se aplica nav-anim-{kind}
```

### 11.4 Probar la navegación

```
PreviewToggle o comando "mode.preview" (P)
  └─ setMode("preview") → limpia la transición de la primera página
CanvasPages conmuta a ProductionView (fixed inset-0 z-40)
Los elementos con enlace pasan a role="link" con aria-label
followLink → dispatch("page/select") → el key remonta → la animación CSS corre
Esc → vuelve a "edit"
```

### 11.5 Escribir y ejecutar código en un bloque

```
1. Se abre el workbench (Ctrl+E) sobre el bloque de código
2. FILE_KINDS["block-js"].read() devuelve el código
3. Monaco lo edita; al guardar → FILE_KINDS["block-js"].write()
     └─ { type: "block/code", patch: { js } }
4. CodeBlockView renderiza un iframe con buildSrcDoc(...)
     ├─ importMap de las librerías
     ├─ @theme o :root con las variables
     ├─ el CSS global y el del bloque
     └─ el JS transpilado con sucrase
5. El iframe avisa su alto con postMessage("portal:size")
```

### 11.6 Crear una versión (commit)

```
1. El usuario edita → el SiteState cambia
2. useDesignSnapshot() recalcula la instantánea (useMemo)
3. useWorkingChanges() la compara con state.baseline
     └─ diffSnapshots(baseline, current) → WorkingChange[]
4. changes-list.tsx muestra los cambios con un checkbox ("git add")
     └─ stage/toggle
5. "Hacer versión" → commit
     ├─ crea el commit con id "c{N+1}" en la rama actual
     ├─ promueve el baseline (los cambios pasan a ser la referencia)
     └─ des-stagea los cambios guardados
```

---

## 12. Mapa de importaciones

### 12.1 Grafo de dependencias entre subsistemas

```
                         site/types  (el modelo compartido)
                              ▲
        ┌─────────────────────┼──────────────────────┐
        │                     │                      │
    styles/              behaviors/              functions/
        │                     │                      │
        │            ┌────────┴────────┐             │
        │            │                 │             │
        ▼            ▼                 ▼             ▼
    format/     customize/          code/      workbench/
        │                              │
        ▼                              ▼
  site/  viewport/  navigation/  media/  placement/  title-editor/
        │                    │
        └────────┬───────────┘
                 ▼
          side-panel/  appearance/  libraries/  versioning/
```

**Reglas que se desprenden del grafo:**

1. **Sin ciclos.** `styles/` no conoce a nadie. `functions/` no conoce a nadie.
2. **El estado es el único punto de encuentro**: `site/site-context.tsx` y `site/site-reducer.ts` son
   el puente entre la UI y el modelo.
3. **`functions/` es puro y reutilizable**: lo usan tanto los iframes de código como las interacciones,
   con la misma función `functionsFor` como selector de alcance.
4. **`appearance/` y `format/` son dos vistas del mismo motor**: una edita reglas por ámbito, la otra
   overrides de una selección. Ambas despachan al mismo `siteReducer`.

### 12.2 Las dependencias internas de cada subsistema

| Subsistema | Importa de |
|---|---|
| `site` | `styles`, `behaviors`, `navigation`, `placement`, `canvas-editing`, `title-editor` |
| `styles` | *(nada interno)* — sólo `title-editor/types` y `site/types` (tipos) |
| `canvas-editing` | *(nada interno)* — sólo `site/types` (tipos) y `navigation/types` |
| `builder` | `canvas-editing`, `site`, `navigation`, `styles`, `media`, `commands`, `side-panel` |
| `placement` | `site`, `canvas-editing`, `navigation` |
| `navigation` | `site`, `ui`, `viewport`, `commands` |
| `media` | `site`, `placement`, `navigation`, `styles`, `ui`, `commands` |
| `format` | `site`, `styles`, `navigation`, `title-editor`, `workbench`, `ui` |
| `appearance` | `styles`, `site`, `title-editor/constants`, `ui` |
| `behaviors` | `functions`, `code`, `libraries`, `navigation`, `site` |
| `functions` | `site/types` (sólo tipos) |
| `code` | `functions`, `libraries`, `styles`, `site/types` |
| `workbench` | `site`, `functions`, `navigation`, `styles`, `commands` |
| `commands` | `site`, `media`, `navigation`, `viewport`, `workbench`, `builder` |
| `viewport` | `navigation`, `placement`, `media`, `site`, `styles`, `title-editor`, `behaviors`, `canvas-editing` |
| `side-panel` | `site`, `navigation`, `appearance`, `libraries`, `workbench`, `commands` |
| `versioning` | `site`, `styles`, `navigation` |
| `libraries` | `site`, `commands`, `ui` |
| `customize` | `site`, `behaviors`, `workbench`, `styles` |
| `ui` | *(nada interno)* |

### 12.3 Las dependencias de terceros

| Librería | Dónde se usa |
|---|---|
| `react` | En todos los `.tsx` |
| `next` | `layout.tsx` (font, metadata), las API routes |
| `monaco-editor` + `@monaco-editor/react` | `workbench/file-editor.tsx`, `workbench/typescript-setup.ts` |
| `sucrase` | `code/transpile.ts` (quitar tipos en el navegador) |
| `esbuild` | Sólo en el servidor (`app/server/npm-libraries.ts`) |
| `@tailwindcss/browser` | Se sirve en `/api/vendor/tailwind` y lo inyecta `customize/tailwind-runtime.tsx` |
| `swipe` | La librería de ejemplo instalada desde la app |

**Ninguna otra dependencia de terceros** — no hay librería de estado, de drag & drop, de modal, de
gráficos ni de estilos en runtime.

---

## 13. Convenciones y cómo extender

### 13.1 Convenciones del código

- **Comentarios en español**, y no sólo explicativos: explican **por qué**, no el qué.
- Los archivos `.ts` puros llevan un **docstring en la cabecera** que declara su responsabilidad.
- Los **nombres de archivo en kebab-case** (`site-reducer.ts`, `use-block-gestures.ts`).
- Las **clases de Tailwind** para el estilo; muy poco CSS escrito a mano.
- Los **iconos son SVG propios** (`viewport/icons.tsx`, `versioning/versioning-icons.tsx`).
- Los componentes con estado usan `useMemo` para el valor del contexto, para no re-renderizar en cascada.
- Los hooks de provider **lanzan un error explícito** si falta el provider:
  `"Debe usarse dentro de <SiteProvider>"`.
- Los tipos exportados se importan con `import type { … }` cuando sólo hacen falta como tipos.

### 13.2 Cómo añadir cada cosa

| Quiero… | Dónde tocar |
|---|---|
| **Una acción del sitio** | `site/types.ts` (unión `SiteAction`) + `site/site-reducer.ts` (una entrada en `HANDLERS`) |
| **Un tipo de elemento** | `site/types.ts` (`ElementKind`) + `site/component-view.tsx` (`RENDERERS`) + `site/component-templates.ts` (`KIND_DEFAULTS`) + `site/element-style.ts` (`BASE_STYLES`) |
| **Una plantilla de componente** | `site/component-templates.ts` (`TEMPLATES` + `TemplateId`) + `BUILT_IN_COMPONENTS` |
| **Una propiedad de estilo** | `styles/types.ts` (`StyleProp`) + `styles/registry.ts` (`PROP_DEFS`) |
| **Un target de estilo** | `styles/types.ts` (`StyleTarget`) + `styles/registry.ts` (`TARGET_DEFS`) |
| **Un disparador de interacción** | `behaviors/types.ts` (`TriggerKind`) + `behaviors/triggers.ts` (`TRIGGERS`) |
| **Una acción de interacción** | `behaviors/types.ts` (`ActionKind`) + `behaviors/actions.ts` (`ACTIONS`) |
| **Un efecto de animación** | `behaviors/effects.ts` (`EFFECTS`) |
| **Un modo de ejecución de código** | `behaviors/types.ts` (`CodeMode`) + `behaviors/execute-code.ts` (`EXECUTORS`) |
| **Un comando de la paleta** | `commands/command-definitions.ts` (`createCommands`) |
| **Un verbo «/»** | `commands/slash/verbs.ts` + su archivo de verbo |
| **Un tipo de archivo del editor** | `workbench/file-ref.ts` (`FileRef` + `FILE_KINDS`) |
| **Una regla de estilo por rol** | `styles/registry.ts` (`ROLE_LABELS`) + `styles/apply.ts` (`styleElement`) |
| **Un alcance de edición** | `canvas-editing/settings-context.tsx` (`EditScope`) + `site/scope-actions.ts` (las dos tablas) |
| **Una transición de navegación** | `navigation/links.ts` (`TRANSITION_LABELS`) + `app/globals.css` (un `@keyframes`) |
| **Un destino de soltar un enlace** | un atributo `data-link-drop` + su comparación en `navigation-context.tsx:152-161` |
| **Una sección del panel lateral** | `side-panel/data.ts` (`TABS`) + `side-panel/side-panel.tsx` (`TAB_CONTENT`) + `side-panel/tab-icons.tsx` |
| **Un dispositivo** | `viewport/viewport-context.tsx` (`DEVICES`) — los atajos salen de `DEVICE_SHORTCUTS` |

### 13.3 El flujo de datos en una línea

```
Evento del usuario
  └─► handler en un componente
        └─► dispatch(action)                ← el ÚNICO punto de mutación
              └─► siteReducer / builderReducer / versioningReducer
                    └─► tabla HANDLERS → reglas puras (overrides.ts, resolve.ts…)
                          └─► nuevo estado
                                └─► React re-renderiza
                                      └─► SiteStyles inyecta el CSS
                                            └─► el navegador pinta
```

**Ninguna UI muta el estado directamente.** Todo pasa por un `dispatch`.

---

## 14. Deuda técnica y riesgos conocidos

### 14.1 Bugs y duplicaciones

| # | Problema | Ubicación | Impacto |
|---|---|---|---|
| 1 | **Validación de archivos duplicada** (límite 10 MB y el mensaje de video) | `media/media-context.tsx:41-46` vs `media/image-file.ts:8-13` | Dos fuentes de verdad |
| 2 | **Fuga de object URLs** al borrar una página: `page/delete` no pasa por `media/remove`, que es el único que llama a `revokeObjectURL` | `site/site-reducer.ts:99-114` | Los medios locales de la página borrada quedan vivos en memoria |
| 3 | **`media/add` siempre va a la página actual** | `site/site-reducer.ts:127` | No se puede insertar un medio en otra página sin cambiar de página antes |
| 4 | **`usePlacedExtent` se recalcula en cada render** sin array de dependencias (con un guard anti-bucle) | `placement/use-placed-extent.ts:18-25` | Medición forzada por render |
| 5 | **`MediaDropZone` captura el `drop` de toda la ventana** | `media/media-drop-zone.tsx:25-30` | Cualquier arrastre externo con esos formatos se consume en la página actual |
| 6 | **`fitZoom` usa un padding constante (`CANVAS_PADDING = 64`) en vez de medir el real** | `viewport/fit-zoom.ts:6` frente a `viewport/artboard.tsx:58` | El lienzo usa `p-8 pb-24`: el padding lateral sí coincide (64), pero el inferior es 96 y no se descuenta |
| 7 | **`followLink` ignora `newTab` en la vista previa** (siempre abre en pestaña nueva) | `navigation/navigation-context.tsx:117-123` | Deliberado ("para no perder el trabajo"), pero la UI debe aclararlo |
| 8 | **`sixDigitHex` degrada en silencio** a `#cccccc` | `appearance/literal-input.tsx:27` | Un color heredado en `rgb(...)` se ve gris sin aviso |
| 9 | **`RuleCount` cuenta propiedades, no reglas** | `appearance/appearance-tab.tsx:36-38` | El badge puede mostrar «5» para una sola regla con 5 propiedades |
| 10 | **El prefijo `page:` se compara por cadena** (`startsWith("page:")`) | `navigation/navigation-context.tsx:159` | Dependencia implícita entre dos módulos (el reducer lo valida después) |
| 11 | **El remount por `transitionKey` reinicia el contenido** | `viewport/artboard.tsx:171` | Reinicia iframes, `<video>` y el estado de los *behaviors* |
| 12 | **`ScopeChoice` duplica `StyleScope`** | `appearance/scope-picker.tsx:6-9` | Traducción manual; no permite editar reglas de otra página |

### 14.2 Dos modelos de estilo paralelos

`format/` (overrides de instancia) y `appearance/` (reglas por tipo y ámbito) trabajan sobre el mismo DOM
y **pueden pisarse**: una regla de apariencia puede quedar visualmente anulada por un override de
instancia. **No hay código que detecte ni advierta** de esa condición.

### 14.3 Dos modelos de diff paralelos en el versionado

`design-snapshot.ts` (real, con prefijo de página) y `preview-model.ts` (visual, legacy, con constantes
hardcodeadas). El `VisualDiff` **no** usa el snapshot real. De ahí que en la UI coexistan
`"Titular · Tamaño"` y `"Inicio · Titular · Tamaño"`.

### 14.4 Huecos del subsistema de versionado

- **La detección de conflictos no está implementada**, pese a que `types.ts:65-66` la documenta. Los
  `Conflict` sólo vienen del mock.
- `pr/merge` crea un commit con `changes: []`: **el merge no traslada los cambios** a la rama destino.
- `branch/create` no clona commits ni baseline.
- `publish` no toca el sitio real: es una marca en un array.
- `baseline` es **global**, no por rama.
- No hay persistencia: recargar la página lo reinicia todo.

### 14.5 Otros puntos de atención

- **No hay tests.** La lógica de negocio está bien aislada en funciones puras, así que es ripe para
  testear (`overrides.ts`, `resolve.ts`, `versioning-rules.ts`, `functions/scope.ts`, `snapping.ts`).
- **No hay `undo/redo`.** El reducer es sin memoria. El builder tampoco.
- **El builder no tiene Ctrl+Z, Ctrl+D, Ctrl+C/V** — sólo los botones.
- **La paleta recorta la búsqueda de contenido a 30 resultados** sin avisar
  (`commands/slash/content-search.ts:17`).
- **`normalize` funde `ñ` con `n`** (el stripping de diacríticos) — «año» encuentra «ano»
  (`commands/slash/text-match.ts:2-3`).
- **Un conflicto de atajos introducido a mano en `localStorage` no se detecta**; gana el primero del
  array (`commands/commands-context.tsx:133`).
- **`runIsolated` no soporta `import` de librerías** (no hay resolución de `libraryUrl` en ese modo).
- **`metadata` de `layout.tsx` sigue siendo el de la plantilla** (`"Create Next App"`).

### 14.6 Qué arreglaría primero

1. **Persistencia**: un `useEffect` que guarde el `SiteState` en `localStorage` (o IndexedDB) y lo
   restaure al cargar. Es el cambio con más valor por línea de código: hoy se pierde todo al recargar.
2. **Tests sobre las reglas puras**: `overrides.ts`, `resolve.ts`, `versioning-rules.ts`,
   `functions/scope.ts`, `snapping.ts`, `links.ts`. Ya están aisladas para eso.
3. **Unificar los dos modelos de estilo** (overrides vs reglas) o, al menos, **avisar** cuando un
   override tapa una regla.
4. **Detección real de conflictos** en `pr/open` (comparar la base con las dos ramas).
5. **Revocar los object URLs** al borrar una página.
6. **Personalizar `metadata`** y el favicon.

---

## Apéndice A — Índice de archivos por responsabilidad

### Modelo y estado
| Archivo | Responsabilidad |
|---|---|
| `app/components/site/types.ts` | El modelo: 22 tipos + 45 acciones |
| `app/components/site/site-reducer.ts` | El reducer del sitio (45 manejadores) |
| `app/components/site/site-context.tsx` | `useSite`, `useSiteDispatch`, `useCurrentPage` |
| `app/components/site/initial-site.ts` | El estado inicial (4 páginas de ejemplo) |
| `app/components/site/rules.ts` | Slugs, nombres, `splitBlocks` |
| `app/components/site/overrides.ts` | La fusión plantilla + formato propio |
| `app/components/site/component-scope-rules.ts` | Cambios a nivel de componente |
| `app/components/site/scope-actions.ts` | El puente alcance → acción |
| `app/components/site/hiding.ts` | Ocultar/mostrar por destino |
| `app/components/site/custom-code.ts` | CSS propio, validación, flow layout |

### Render
| Archivo | Responsabilidad |
|---|---|
| `app/components/site/page-blocks.tsx` | El render de los bloques de una página |
| `app/components/site/component-view.tsx` | El render de un componente y sus elementos |
| `app/components/site/component-templates.ts` | 7 plantillas + 7 componentes de fábrica |
| `app/components/site/site-styles.tsx` | La inyección del CSS global |
| `app/components/site/element-style.ts` | El CSS base de cada elemento |
| `app/components/viewport/artboard.tsx` | El lienzo, las páginas y la vista de producción |

### Editor de componentes
| Archivo | Responsabilidad |
|---|---|
| `app/components/builder/component-builder.tsx` | El flujo completo del constructor |
| `app/components/builder/builder-reducer.ts` | El reducer del builder (13 acciones) |
| `app/components/builder/builder-commands.ts` | El adaptador a `CanvasCommands` |
| `app/components/builder/builder-host.tsx` | El montaje del modal |

### Estilos
| Archivo | Responsabilidad |
|---|---|
| `app/components/styles/resolve.ts` | La cascada y la resolución de variables |
| `app/components/styles/registry.ts` | El catálogo de propiedades y targets |
| `app/components/styles/apply.ts` | La aplicación de reglas por rol |
| `app/components/styles/css-variables.ts` | `hostVariablesCss`, `rootVariablesCss`, `themeCss` |
| `app/components/styles/use-styles.ts` | La API que consume la UI |

### Interacciones y código
| Archivo | Responsabilidad |
|---|---|
| `app/components/behaviors/execute-code.ts` | Los dos modos de ejecución |
| `app/components/behaviors/use-behaviors.ts` | El enganche al DOM |
| `app/components/behaviors/page-api.ts` | La API que ve el código del usuario |
| `app/components/behaviors/sandbox.ts` | El iframe sin origen |
| `app/components/code/build-srcdoc.ts` | El documento del iframe |
| `app/components/code/transpile.ts` | `safeTranspile` con sucrase |
| `app/components/functions/scope.ts` | El alcance y el preámbulo de funciones |

### Versionado
| Archivo | Responsabilidad |
|---|---|
| `app/components/versioning/design-snapshot.ts` | La captura del diseño y el diff |
| `app/components/versioning/versioning-rules.ts` | Las reglas puras del versionado |
| `app/components/versioning/versioning-reducer.ts` | 15 acciones |
| `app/components/versioning/mock-data.ts` | Los datos de ejemplo |

### Servidor
| Archivo | Responsabilidad |
|---|---|
| `app/server/npm-libraries.ts` | pnpm add/remove, esbuild, el manifiesto |
| `app/server/vendor-files.ts` | Serve de `node_modules` con guard de traversal |
| `app/api/libs/route.ts` | Instalar/desinstalar librerías |
| `app/api/libs/bundle/route.ts` | Empaquetar una librería para el navegador |
| `app/api/vendor/monaco/[...path]/route.ts` | Servir Monaco |
| `app/api/vendor/tailwind/route.ts` | Servir Tailwind |

## Apéndice B — Glosario

| Término | Significado |
|---|---|
| **Componente** (`ComponentDef`) | Una plantilla reutilizable de elementos posicionados |
| **Bloque** (`BlockInstance`) | Una instancia de un componente colocada en una página |
| **Override** (`ElementOverride`) | El formato propio de un elemento en un bloque concreto |
| **Regla** (`StyleRule`) | Una propiedad de estilo para un target en un ámbito |
| **Variable** (`Variable`) | Un valor con nombre, ligado a un ámbito |
| **Ámbito** (`StyleScope`) | Global, de página o de componente |
| **Alcance de edición** (`EditScope`) | Si un cambio afecta al bloque o a todo el componente |
| **Acoplado** (dock) | Un elemento dentro de un contenedor, en una casilla 3×3 o en posición libre |
| **Backdrop** | El elemento que cubre ≥90% de la sección: es su fondo |
| **Snapping** | El imán: ajustar a bordes, centros y cuadrícula |
| **Shell page** | La cabecera fija de la página, fuera del área animada |
| **Archivo virtual** (`FileRef`) | Un trozo de código del sitio que el editor muestra como archivo |
| **Snapshot** (`DesignSnapshot`) | Una foto plana del diseño, indexada por clave estable |
