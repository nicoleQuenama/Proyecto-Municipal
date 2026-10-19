import type { DockAnchor, Point } from "../canvas-editing/dock-slots";
import type { LinkTarget } from "../navigation/types";
import type { CanvasElement, ComponentCategory, ComponentDef } from "../site/types";
import type { TemplateId } from "../site/component-templates";

/** Estado del editor de un componente (lo que se está creando o editando). */
export interface BuilderState {
  name: string;
  category: ComponentCategory;
  width: number;
  height: number;
  elements: CanvasElement[];
  links: Record<string, LinkTarget>;
  selectedId: string | null;
}

export type BuilderAction =
  | { type: "meta"; patch: Partial<Pick<BuilderState, "name" | "category" | "width" | "height">> }
  | {
      type: "template";
      templateId: TemplateId;
      nextId: () => string;
      /** Páginas que existen: los enlaces de la plantilla a otras páginas se descartan. */
      pageIds: string[];
    }
  | { type: "link"; id: string; link: LinkTarget | null }
  | { type: "add"; element: CanvasElement }
  | { type: "update"; id: string; patch: Partial<CanvasElement> }
  | { type: "move"; id: string; x: number; y: number }
  | { type: "nudge"; id: string; dx: number; dy: number }
  | { type: "resize"; id: string; x: number; y: number; width: number; height: number; offset?: Point }
  /** Acopla un elemento a un contenedor (en una casilla o en posición libre) o lo suelta (`parentId` null). */
  | { type: "dock"; id: string; parentId: string | null; anchor?: DockAnchor }
  | { type: "duplicate"; id: string; newId: string }
  | { type: "reorder"; id: string; to: "front" | "back" }
  | { type: "remove"; id: string }
  | { type: "select"; id: string | null };

export function initialBuilderState(def?: ComponentDef): BuilderState {
  if (!def) {
    return { name: "", category: "cards", width: 320, height: 200, elements: [], links: {}, selectedId: null };
  }
  return {
    name: def.name,
    category: def.category,
    width: def.width,
    height: def.height,
    elements: def.elements,
    links: def.links,
    selectedId: null,
  };
}

/** Un manejador por tipo de acción: añadir una acción nueva es añadir una entrada a algún grupo de manejadores. */
export type Handlers<K extends BuilderAction["type"]> = {
  [T in K]: (state: BuilderState, action: Extract<BuilderAction, { type: T }>) => BuilderState;
};
