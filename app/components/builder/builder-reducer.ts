import type { LinkTarget } from "../navigation/types";
import type {
  CanvasElement,
  ComponentCategory,
  ComponentDef,
} from "../site/types";
import { templateById } from "../site/component-templates";

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
      templateId: Parameters<typeof templateById>[0];
      nextId: () => string;
      /** Páginas que existen: los enlaces de la plantilla a otras páginas se descartan. */
      pageIds: string[];
    }
  | { type: "link"; id: string; link: LinkTarget | null }
  | { type: "add"; element: CanvasElement }
  | { type: "update"; id: string; patch: Partial<CanvasElement> }
  | { type: "move"; id: string; x: number; y: number }
  | { type: "nudge"; id: string; dx: number; dy: number }
  | { type: "resize"; id: string; width: number; height: number }
  | { type: "duplicate"; id: string; newId: string }
  | { type: "reorder"; id: string; to: "front" | "back" }
  | { type: "remove"; id: string }
  | { type: "select"; id: string | null };

export const MIN_ELEMENT_SIZE = 8;
export const MIN_CANVAS_SIZE = 80;
export const MAX_CANVAS_SIZE = 1000;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/** Deja el elemento con medidas enteras, un tamaño mínimo y dentro del lienzo. */
function fitToCanvas(element: CanvasElement, canvasWidth: number, canvasHeight: number): CanvasElement {
  const width = Math.max(MIN_ELEMENT_SIZE, Math.round(element.width));
  const height = Math.max(MIN_ELEMENT_SIZE, Math.round(element.height));
  return {
    ...element,
    width,
    height,
    x: clamp(Math.round(element.x), 0, Math.max(0, canvasWidth - width)),
    y: clamp(Math.round(element.y), 0, Math.max(0, canvasHeight - height)),
  };
}

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

/** Cambia un elemento y lo deja ajustado al lienzo. */
const edit = (state: BuilderState, id: string, change: (element: CanvasElement) => CanvasElement): BuilderState => ({
  ...state,
  elements: state.elements.map((element) =>
    element.id === id ? fitToCanvas(change(element), state.width, state.height) : element,
  ),
});

/** Dónde queda un elemento al reordenarlo. */
const REORDER: Record<"front" | "back", (others: CanvasElement[], target: CanvasElement) => CanvasElement[]> = {
  front: (others, target) => [...others, target],
  back: (others, target) => [target, ...others],
};

/** Un manejador por tipo de acción: añadir una acción nueva es añadir una entrada aquí. */
type Handlers = {
  [K in BuilderAction["type"]]: (state: BuilderState, action: Extract<BuilderAction, { type: K }>) => BuilderState;
};

const HANDLERS: Handlers = {
  "meta": (state, action) => {
    const { patch } = action;
    return {
      ...state,
      ...patch,
      width: clamp(Math.round(patch.width ?? state.width), MIN_CANVAS_SIZE, MAX_CANVAS_SIZE),
      height: clamp(Math.round(patch.height ?? state.height), MIN_CANVAS_SIZE, MAX_CANVAS_SIZE),
    };
  },

  "template": (state, action) => {
    const template = templateById(action.templateId);
    const elements = template.build(action.nextId);
    const links = Object.fromEntries(
      Object.entries(template.links?.(elements) ?? {}).filter(
        ([, link]) => link.kind !== "page" || action.pageIds.includes(link.pageId),
      ),
    );
    return { ...state, width: template.width, height: template.height, elements, links, selectedId: null };
  },

  "link": (state, action) => {
    const links = { ...state.links };
    if (action.link) links[action.id] = action.link;
    else delete links[action.id];
    return { ...state, links };
  },

  "add": (state, action) => ({
    ...state,
    elements: [...state.elements, fitToCanvas(action.element, state.width, state.height)],
    selectedId: action.element.id,
  }),

  "update": (state, action) => edit(state, action.id, (element) => ({ ...element, ...action.patch })),

  "move": (state, action) => edit(state, action.id, (element) => ({ ...element, x: action.x, y: action.y })),

  "nudge": (state, action) =>
    edit(state, action.id, (element) => ({ ...element, x: element.x + action.dx, y: element.y + action.dy })),

  "resize": (state, action) => {
    return edit(state, action.id, (element) => ({
      ...element,
      // No se puede crecer más allá del borde del lienzo.
      width: Math.min(action.width, state.width - element.x),
      height: Math.min(action.height, state.height - element.y),
    }));
  },

  "duplicate": (state, action) => {
    const source = state.elements.find((element) => element.id === action.id);
    if (!source) return state;

    const copy = fitToCanvas(
      { ...source, id: action.newId, x: source.x + 12, y: source.y + 12 },
      state.width,
      state.height,
    );
    return { ...state, elements: [...state.elements, copy], selectedId: copy.id };
  },

  "reorder": (state, action) => {
    const target = state.elements.find((element) => element.id === action.id);
    if (!target) return state;

    const others = state.elements.filter((element) => element.id !== action.id);
    return {
      ...state,
      elements: REORDER[action.to](others, target),
    };
  },

  "remove": (state, action) => ({
    ...state,
    elements: state.elements.filter((element) => element.id !== action.id),
    links: Object.fromEntries(Object.entries(state.links).filter(([id]) => id !== action.id)),
    selectedId: state.selectedId === action.id ? null : state.selectedId,
  }),

  "select": (state, action) => ({ ...state, selectedId: action.id }),
};

export function builderReducer(state: BuilderState, action: BuilderAction): BuilderState {
  // TypeScript no puede relacionar el tipo de la acción con su manejador, pero `Handlers` lo garantiza.
  const handle = HANDLERS[action.type] as (state: BuilderState, action: BuilderAction) => BuilderState;
  return handle(state, action);
}
