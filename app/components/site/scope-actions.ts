import type { EditScope } from "../canvas-editing/settings-context";
import type { Size } from "../canvas-editing/limits";
import type { ElementOverride, SiteAction } from "./types";

/** El bloque donde se edita y el componente que usa. */
export interface EditTarget {
  pageId: string;
  blockId: string;
  componentId: string;
}

/**
 * Cómo se guarda cada cambio según el alcance elegido: solo en este bloque (formato propio) o en el componente,
 * y por tanto en todos los bloques que lo usan. Un alcance nuevo es una entrada nueva en cada tabla.
 */
const ELEMENT_ACTIONS: Record<EditScope, (target: EditTarget, elementId: string, patch: ElementOverride) => SiteAction> = {
  block: ({ pageId, blockId }, elementId, patch) => ({ type: "block/style", pageId, blockId, elementIds: [elementId], patch }),
  component: ({ pageId, blockId, componentId }, elementId, patch) => ({
    type: "component/element",
    componentId,
    pageId,
    blockId,
    elementId,
    patch,
  }),
};

const SECTION_ACTIONS: Record<EditScope, (target: EditTarget, size: Partial<Size>, backdropId?: string) => SiteAction> = {
  block: ({ pageId, blockId }, size, backdropId) => ({ type: "block/size", pageId, blockId, size, backdropId }),
  component: ({ pageId, blockId, componentId }, size, backdropId) => ({
    type: "component/size",
    componentId,
    pageId,
    blockId,
    size,
    backdropId,
  }),
};

export const elementChange = (scope: EditScope, target: EditTarget, elementId: string, patch: ElementOverride) =>
  ELEMENT_ACTIONS[scope](target, elementId, patch);

export const sectionResize = (scope: EditScope, target: EditTarget, size: Partial<Size>, backdropId?: string) =>
  SECTION_ACTIONS[scope](target, size, backdropId);
