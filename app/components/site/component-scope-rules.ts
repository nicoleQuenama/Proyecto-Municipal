/**
 * Reglas puras de los cambios que valen para todo el componente (y por tanto para todos los bloques que lo usan),
 * a diferencia del formato propio de un bloque (`overrides.ts`).
 */

import { layoutDocked } from "../canvas-editing/dock-layout";
import { clampCanvasSize, type Size } from "../canvas-editing/limits";
import { resolveOverride, styleElements, updateBlock } from "./overrides";
import type { ComponentDef, ElementOverride, SiteState } from "./types";

interface ComponentTarget {
  componentId: string;
  /** El bloque desde donde se edita (se conserva en la acción; el cambio vale para todos los bloques del componente). */
  pageId: string;
  blockId: string;
}

const updateComponent = (state: SiteState, componentId: string, update: (def: ComponentDef) => ComponentDef): SiteState => ({
  ...state,
  components: state.components.map((def) => (def.id === componentId ? update(def) : def)),
});

/** Un cambio de formato que quita estas propiedades (`undefined` las borra). */
const clearing = (keys: string[]): ElementOverride => Object.fromEntries(keys.map((key) => [key, undefined]));

/**
 * Quita el formato propio de esos elementos en TODOS los bloques que usan el componente, en todas las páginas.
 * Así un cambio «para todo el componente» se ve en cada uno, también en los que antes se habían ajustado a mano.
 */
function clearEverywhere(state: SiteState, componentId: string, elementIds: string[], keys: string[]): SiteState {
  return state.pages.reduce(
    (current, page) =>
      page.blocks
        .filter((block) => block.componentId === componentId)
        .reduce((inner, block) => styleElements(inner, page.id, block.id, elementIds, clearing(keys)), current),
    state,
  );
}

/** Cambia un elemento del componente. El formato propio que tuvieran los bloques en eso se quita: el cambio vale para todos. */
export function patchComponentElement(
  state: SiteState,
  { componentId }: ComponentTarget,
  elementId: string,
  patch: ElementOverride,
): SiteState {
  const changed = updateComponent(state, componentId, (def) => ({
    ...def,
    elements: layoutDocked(
      def.elements.map((element) => (element.id === elementId ? resolveOverride(element, patch, () => undefined) : element)),
    ),
  }));
  return clearEverywhere(changed, componentId, [elementId], Object.keys(patch));
}

/** Cambia el tamaño del componente; su fondo (si tiene) crece con él. El tamaño propio de los bloques se quita. */
export function resizeComponent(
  state: SiteState,
  { componentId }: ComponentTarget,
  size: Partial<Size>,
  backdropId?: string,
): SiteState {
  const def = state.components.find((c) => c.id === componentId);
  if (!def) return state;

  const next = clampCanvasSize(
    { width: size.width ?? def.width, height: size.height ?? def.height },
    def.elements.filter((element) => element.id !== backdropId),
  );
  const resized = updateComponent(state, componentId, (current) => ({
    ...current,
    ...next,
    elements: layoutDocked(
      current.elements.map((element) => (element.id === backdropId ? { ...element, x: 0, y: 0, ...next } : element)),
    ),
  }));

  const withoutOwnSize = state.pages.reduce(
    (current, page) =>
      page.blocks
        .filter((block) => block.componentId === componentId)
        .reduce((inner, block) => updateBlock(inner, page.id, block.id, (b) => ({ ...b, size: undefined })), current),
    resized,
  );
  return backdropId ? clearEverywhere(withoutOwnSize, componentId, [backdropId], ["x", "y", "width", "height"]) : withoutOwnSize;
}
