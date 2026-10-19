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
  /** El bloque desde donde se edita: su formato propio sobre lo cambiado se quita, para que el cambio se vea. */
  pageId: string;
  blockId: string;
}

const updateComponent = (state: SiteState, componentId: string, update: (def: ComponentDef) => ComponentDef): SiteState => ({
  ...state,
  components: state.components.map((def) => (def.id === componentId ? update(def) : def)),
});

/** Un cambio de formato que quita estas propiedades (`undefined` las borra). */
const clearing = (keys: string[]): ElementOverride => Object.fromEntries(keys.map((key) => [key, undefined]));

/** Cambia un elemento del componente. Los bloques que ya tenían su propio formato en eso lo conservan. */
export function patchComponentElement(
  state: SiteState,
  { componentId, pageId, blockId }: ComponentTarget,
  elementId: string,
  patch: ElementOverride,
): SiteState {
  const changed = updateComponent(state, componentId, (def) => ({
    ...def,
    elements: layoutDocked(
      def.elements.map((element) => (element.id === elementId ? resolveOverride(element, patch, () => undefined) : element)),
    ),
  }));
  return styleElements(changed, pageId, blockId, [elementId], clearing(Object.keys(patch)));
}

/** Cambia el tamaño del componente; su fondo (si tiene) crece con él. Lo que ya cambió el bloque se quita. */
export function resizeComponent(
  state: SiteState,
  { componentId, pageId, blockId }: ComponentTarget,
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

  const withoutOwnSize = updateBlock(resized, pageId, blockId, (block) => ({ ...block, size: undefined }));
  return backdropId ? styleElements(withoutOwnSize, pageId, blockId, [backdropId], clearing(["x", "y", "width", "height"])) : withoutOwnSize;
}
