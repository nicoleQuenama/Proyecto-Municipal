/** Los manejadores que añaden, cambian, copian, reordenan y quitan elementos. */

import { withoutElements } from "../canvas-editing/dock-release";
import { sortByOrder } from "../layers/layer-order";
import type { CanvasElement } from "../site/types";
import type { Handlers } from "./builder-types";
import { detach, editElement, fitToCanvas } from "./element-rules";

/** Dónde queda un elemento al reordenarlo. */
const REORDER: Record<"front" | "back", (others: CanvasElement[], target: CanvasElement) => CanvasElement[]> = {
  front: (others, target) => [...others, target],
  back: (others, target) => [target, ...others],
};

/** Cambiar a mano la posición suelta al elemento de su contenedor; cambiar su tamaño deja de ajustarlo a él. */
function applyPatch(element: CanvasElement, patch: Partial<CanvasElement>): CanvasElement {
  const changed = { ...element, ...patch };
  if ("x" in patch || "y" in patch) return detach(changed);
  if (("width" in patch || "height" in patch) && !("fitToParent" in patch)) return { ...changed, fitToParent: undefined };
  return changed;
}

export const ELEMENT_HANDLERS: Handlers<"add" | "update" | "duplicate" | "reorder" | "order" | "remove"> = {
  add: (state, action) => ({
    ...state,
    elements: [...state.elements, fitToCanvas(action.element, state.width, state.height)],
    selectedId: action.element.id,
  }),

  update: (state, action) => editElement(state, action.id, (element) => applyPatch(element, action.patch)),

  duplicate: (state, action) => {
    const source = state.elements.find((element) => element.id === action.id);
    if (!source) return state;

    const copy = fitToCanvas({ ...detach(source), id: action.newId, x: source.x + 12, y: source.y + 12 }, state.width, state.height);
    return { ...state, elements: [...state.elements, copy], selectedId: copy.id };
  },

  reorder: (state, action) => {
    const target = state.elements.find((element) => element.id === action.id);
    if (!target) return state;

    const others = state.elements.filter((element) => element.id !== action.id);
    return { ...state, elements: REORDER[action.to](others, target) };
  },

  order: (state, action) => ({ ...state, elements: sortByOrder(state.elements, action.ids) }),

  // Quitar un contenedor suelta lo que llevaba dentro, que se queda donde se veía.
  remove: (state, action) => {
    const removed = new Set([action.id]);
    return {
      ...state,
      elements: withoutElements(state.elements, removed),
      links: Object.fromEntries(Object.entries(state.links).filter(([id]) => id !== action.id)),
      selectedId: state.selectedId === action.id ? null : state.selectedId,
    };
  },
};
