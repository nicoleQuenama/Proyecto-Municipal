import type { RecordingBaseline } from "../animation/animation-rules";
import type { AnimationStep, RecordedAnimation } from "../animation/types";
import type { Behavior } from "../behaviors/types";
import type { MediaItem } from "../media/types";
import type { LinkTarget, Transition } from "../navigation/types";
import type { DataRef, DataSource } from "../data-sources/types";
import type { SourceAction } from "../data-sources/source-rules";
import type { Placement } from "../placement/types";
import type { ResponsiveAction } from "../responsive/responsive-rules";
import type { ResponsiveLayouts } from "../responsive/types";
import type { BlockTarget, ElementRole, StyleScope, StyleProp, StyleState, StyleTarget, Variable } from "../styles/types";
import type { TitleState } from "../title-editor/types";

/** Un componente es un conjunto de elementos posicionados sobre un lienzo de tamaño fijo. */
export type ElementKind = "rect" | "ellipse" | "text" | "image" | "video";
export type TextAlign = "left" | "center" | "right";

/** Hacia qué lado de su contenedor se acopla un elemento en un eje. */
export type DockAlign = "start" | "center" | "end";

/** La casilla (de una cuadrícula de 3×3) del contenedor donde encaja un elemento acoplado. */
export interface DockSlot {
  h: DockAlign;
  v: DockAlign;
}

export interface CanvasElement {
  id: string;
  kind: ElementKind;
  /** Contenedor donde está acoplado. Acoplado, su posición (x, y) se calcula a partir de la casilla `slot`. */
  parentId?: string;
  slot?: DockSlot;
  /** Acoplado sin casilla: su posición libre dentro del contenedor, desde la esquina de este. */
  offset?: { x: number; y: number };
  /** Acoplado, se estira para llenar su contenedor: si este cambia de tamaño, el elemento se adapta. */
  fitToParent?: boolean;
  /** Con rol, el elemento sigue las reglas de estilo de ese rol; sin rol («none») conserva sus valores. */
  role: ElementRole | "none";
  x: number;
  y: number;
  width: number;
  height: number;
  /** Color de relleno de rectángulos y elipses. */
  fill: string;
  /** Radio de las esquinas (rectángulos e imágenes). */
  radius: number;
  /** Contenido de un texto, o etiqueta centrada de una forma. */
  text: string;
  fontSize: number;
  color: string;
  bold: boolean;
  align: TextAlign;
  /** Tipografía propia; vacío = la que hereda de la página. */
  fontFamily: string;
  /** URL de una imagen o de un video. */
  src: string;
  /** true si `src` es un reproductor para <iframe> (YouTube, Vimeo); si no, un archivo de video. */
  embed?: boolean;
  /** Formato extra (clic derecho). Se guarda en el bloque; estas marcas solo existen en el componente de un bloque ya mezclado. */
  italic?: boolean;
  underline?: boolean;
  /** Línea sobre el texto. */
  overline?: boolean;
  strike?: boolean;
  list?: "none" | "ul" | "ol";
  /** Oculto en un bloque concreto (lo fija el bloque, no el componente). */
  hidden?: boolean;
}

/** Un número de píxeles o `var(--nombre)` de una variable de tamaño. */
export type SizeValue = number | string;

/**
 * Lo que un bloque puede cambiar de uno de los elementos de su componente.
 * Colores, tipografía y tamaños también pueden ser `var(--nombre)`: así siguen a la variable.
 */
export type ElementOverride = Partial<
  Pick<
    CanvasElement,
    | "x"
    | "y"
    | "width"
    | "height"
    | "slot"
    | "offset"
    | "fitToParent"
    | "fill"
    | "color"
    | "fontFamily"
    | "bold"
    | "italic"
    | "underline"
    | "overline"
    | "strike"
    | "align"
    | "list"
    | "hidden"
  > & {
    radius: SizeValue;
    fontSize: SizeValue;
    /** Contenedor donde se acopla en este bloque; null lo suelta del que tenga el componente. */
    parentId: string | null;
  }
>;

/** El fondo y las esquinas de la caja de un bloque; si faltan, mandan las reglas de estilo. */
export interface BlockBox {
  background?: string;
  radius?: SizeValue;
}

/** La categoría decide qué reglas de «caja» recibe el componente. */
export type ComponentCategory = BlockTarget;

export interface ComponentDef {
  id: string;
  name: string;
  description: string;
  category: ComponentCategory;
  width: number;
  height: number;
  elements: CanvasElement[];
  /** Enlaces por id de elemento. Valen en todas las páginas donde se use el componente. */
  links: Record<string, LinkTarget>;
  /** false para los componentes de fábrica, que no se editan ni se eliminan. */
  custom: boolean;
  /** Clases de Tailwind y CSS que valen en todos los lugares donde se use el componente (por sección o elemento). */
  styles?: Record<string, CustomStyle>;
}

/** Un componente colocado en una página. */
/** El código de un bloque de código: se dibuja en un iframe aislado. */
export interface CodeSource {
  html: string;
  css: string;
  js: string;
  /** Carga Tailwind CSS dentro del bloque. */
  tailwind: boolean;
}

/** Una librería del proyecto: de un CDN (módulo ES) o instalada con pnpm en este repositorio. */
export interface Library {
  id: string;
  /** Nombre del paquete: «gsap», «@scope/paquete». */
  name: string;
  version: string;
  source: "cdn" | "pnpm";
}

/** Código propio de una sección o de uno de sus elementos: clases de Tailwind y CSS. */
export interface CustomStyle {
  classes: string;
  css: string;
}

/** Clave de `BlockInstance.custom` para la sección entera (los elementos usan su id). */
export const SECTION_KEY = "$section";

/** Destino de animación para el sitio de la sección en la página (su colocación libre), no para su contenido. */
export const PLACE_KEY = "$place";

export interface BlockInstance {
  id: string;
  componentId: string;
  hidden?: boolean;
  /** Solo en los bloques de código. */
  code?: CodeSource;
  /** Código propio por clave: la sección (`SECTION_KEY`) o el id de un elemento. */
  custom?: Record<string, CustomStyle>;
  behaviors?: Behavior[];
  /** Datos de una API por id de elemento: su texto (o su imagen) viene de la clave enlazada. */
  bindings?: Record<string, DataRef>;
  /** Repite la sección una vez por cada elemento de esta lista de una API. */
  repeat?: DataRef;
  box?: BlockBox;
  /** Posición libre en la página; sin ella el bloque va en el flujo, uno bajo otro. */
  placement?: Placement;
  /** Tamaño propio de la sección en este bloque; si falta, el del componente. */
  size?: { width: number; height: number };
  /** Formato propio por id de elemento: solo cambia este bloque, no el componente ni los demás bloques. */
  elements?: Record<string, ElementOverride>;
  /** Diseño definido a mano para tablet o móvil; el dispositivo que falta se adapta solo. */
  responsive?: ResponsiveLayouts;
}

/** Dónde vale una función reutilizable: en todo el proyecto, en una sección o en un elemento. */
export type FunctionScope =
  | { kind: "global" }
  | { kind: "block"; blockId: string }
  | { kind: "element"; blockId: string; elementId: string };

/** Una función reutilizable: se escribe una vez y todo el código de su alcance puede llamarla por su nombre. */
export interface SharedFunction {
  id: string;
  name: string;
  /** La declaración completa: `function nombre(…) { … }`. */
  code: string;
  scope: FunctionScope;
}

export interface Page {
  id: string;
  name: string;
  slug: string;
  /** La página de inicio no se puede eliminar. */
  isHome: boolean;
  title: TitleState;
  media: MediaItem[];
  blocks: BlockInstance[];
  hidden?: boolean;
  titleHidden?: boolean;
  /** Posición libre del titular; sin ella va arriba, en el flujo. */
  titlePlacement?: Placement;
  /** Animaciones grabadas en esta página; las interacciones las reproducen. */
  animations?: RecordedAnimation[];
  /** CSS y JavaScript de toda la página. */
  css?: string;
  js?: string;
}

/** Qué se oculta o se muestra: una página, su titular, un bloque, un medio o un elemento de un componente. */
export type HideTarget =
  | { kind: "page"; pageId: string }
  | { kind: "title"; pageId: string }
  | { kind: "block"; pageId: string; blockId: string }
  | { kind: "media"; pageId: string; mediaId: string }
  | { kind: "element"; pageId: string; blockId: string; elementId: string };

export const TITLE_SELECTION = "title";

export interface SiteState extends StyleState {
  /** Cómo se anima el paso entre páginas cuando un enlace no define su propia transición. */
  navigation: { defaultTransition: Transition };
  pages: Page[];
  currentPageId: string;
  components: ComponentDef[];
  /** Lo que se está editando en la página actual: "title" o el id de un bloque. */
  selectedId: string;
  /** El elemento seleccionado dentro del bloque seleccionado, si hay uno. */
  selectedElementId: string | null;
  /** Elementos que se sumaron a la selección con Ctrl/⌘-clic (además de `selectedElementId`); sirven para animar varios a la vez. */
  alsoSelectedIds?: string[];
  libraries: Library[];
  /** CSS de todo el sitio (afecta a las páginas, no al editor). */
  globalCss: string;
  functions: SharedFunction[];
  /** APIs HTTP del proyecto; sus claves se arrastran a elementos y secciones. */
  sources: DataSource[];
}

export type SiteAction =
  | { type: "page/create"; id: string; name: string }
  | { type: "page/rename"; id: string; name: string }
  | { type: "page/delete"; id: string }
  | { type: "page/select"; id: string }
  | { type: "title/patch"; patch: Partial<TitleState> }
  | { type: "title/reset" }
  | { type: "media/add"; item: MediaItem }
  | { type: "media/remove"; id: string }
  | { type: "media/poster"; pageId: string; mediaId: string; poster: string | null; local?: boolean }
  | { type: "block/add"; id: string; componentId: string; pageId?: string }
  | { type: "block/remove"; id: string }
  | { type: "block/select"; id: string }
  | { type: "component/save"; component: ComponentDef }
  | { type: "component/delete"; id: string }
  | { type: "hidden/set"; target: HideTarget; hidden: boolean }
  | { type: "element/select"; id: string | null; add?: boolean }
  | { type: "block/code"; pageId: string; blockId: string; patch: Partial<CodeSource> }
  | { type: "block/custom"; pageId: string; blockId: string; key: string; patch: Partial<CustomStyle> }
  | { type: "component/styles"; componentId: string; key: string; patch: Partial<CustomStyle> }
  | { type: "behavior/save"; pageId: string; blockId: string; behavior: Behavior }
  | { type: "behavior/remove"; pageId: string; blockId: string; behaviorId: string }
  | { type: "global-css/set"; css: string }
  | { type: "page/code"; pageId: string; patch: { css?: string; js?: string } }
  | { type: "function/save"; fn: SharedFunction }
  | { type: "function/remove"; id: string }
  | { type: "library/add"; library: Library }
  | SourceAction
  | ResponsiveAction
  | { type: "library/remove"; id: string }
  | { type: "block/style"; pageId: string; blockId: string; elementIds: string[]; patch: ElementOverride }
  | { type: "block/box"; pageId: string; blockId: string; patch: BlockBox }
  /** Cambia de una vez un color de la sección: en los elementos que lo usan (por propiedad) y en el fondo de su caja. */
  | { type: "block/recolor"; pageId: string; blockId: string; color: string; fill: string[]; text: string[]; box: boolean }
  | { type: "component/element"; componentId: string; pageId: string; blockId: string; elementId: string; patch: ElementOverride }
  | { type: "component/size"; componentId: string; pageId: string; blockId: string; size: Partial<{ width: number; height: number }>; backdropId?: string }
  | { type: "block/place"; pageId: string; blockId: string; placement: Placement }
  | { type: "block/transfer"; fromPageId: string; toPageId: string; blockId: string; placement: Placement }
  | { type: "title/place"; pageId: string; placement: Placement }
  | { type: "media/place"; pageId: string; mediaId: string; placement: Placement }
  | { type: "media/transfer"; fromPageId: string; toPageId: string; mediaId: string; placement: Placement }
  | { type: "block/size"; pageId: string; blockId: string; size: Partial<{ width: number; height: number }>; backdropId?: string }
  | { type: "block/move"; pageId: string; blockId: string; direction: -1 | 1 }
  | { type: "block/reset"; pageId: string; blockId: string }
  | { type: "link/set"; componentId: string; elementId: string; link: LinkTarget | null }
  | { type: "nav/transition"; transition: Transition }
  | { type: "variable/save"; variable: Variable }
  | { type: "variable/delete"; id: string }
  | { type: "rule/set"; scope: StyleScope; target: StyleTarget; prop: StyleProp; value: string | null }
  | { type: "rule/clear"; scope: StyleScope; target: StyleTarget }
  | { type: "animation/finish"; pageId: string; baseline: RecordingBaseline; animation?: RecordedAnimation }
  | { type: "animation/add"; pageId: string; animation: RecordedAnimation; trigger?: { blockId: string; behavior: Behavior } }
  | { type: "animation/steps"; pageId: string; id: string; steps: AnimationStep[] }
  | { type: "animation/rename"; pageId: string; id: string; name: string }
  | { type: "animation/delete"; pageId: string; id: string };
