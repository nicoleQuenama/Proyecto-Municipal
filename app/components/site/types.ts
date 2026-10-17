import type { MediaItem } from "../media/types";
import type { LinkTarget, Transition } from "../navigation/types";
import type { BlockTarget, ElementRole, StyleScope, StyleProp, StyleState, StyleTarget, Variable } from "../styles/types";
import type { TitleState } from "../title-editor/types";

/** Un componente es un conjunto de elementos posicionados sobre un lienzo de tamaño fijo. */
export type ElementKind = "rect" | "ellipse" | "text" | "image";
export type TextAlign = "left" | "center" | "right";

export interface CanvasElement {
  id: string;
  kind: ElementKind;
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
  /** URL de una imagen. */
  src: string;
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
}

/** Un componente colocado en una página. */
export interface BlockInstance {
  id: string;
  componentId: string;
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
}

export const TITLE_SELECTION = "title";

export interface SiteState extends StyleState {
  /** Cómo se anima el paso entre páginas cuando un enlace no define su propia transición. */
  navigation: { defaultTransition: Transition };
  pages: Page[];
  currentPageId: string;
  components: ComponentDef[];
  /** Lo que se está editando en la página actual: "title" o el id de un bloque. */
  selectedId: string;
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
  | { type: "block/add"; id: string; componentId: string }
  | { type: "block/remove"; id: string }
  | { type: "block/select"; id: string }
  | { type: "component/save"; component: ComponentDef }
  | { type: "component/delete"; id: string }
  | { type: "link/set"; componentId: string; elementId: string; link: LinkTarget | null }
  | { type: "nav/transition"; transition: Transition }
  | { type: "variable/save"; variable: Variable }
  | { type: "variable/delete"; id: string }
  | { type: "rule/set"; scope: StyleScope; target: StyleTarget; prop: StyleProp; value: string | null }
  | { type: "rule/clear"; scope: StyleScope; target: StyleTarget };
