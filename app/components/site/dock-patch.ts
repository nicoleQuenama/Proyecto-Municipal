import { fillsParentByDefault } from "../canvas-editing/containers";
import type { DockAnchor } from "../canvas-editing/dock-slots";
import { FREE_OF_CONTAINER } from "./overrides";
import type { CanvasElement, ElementOverride } from "./types";

/** El formato que deja a un elemento acoplado a un contenedor, en una casilla o en posición libre. */
export function dockPatch(element: CanvasElement | undefined, parentId: string, anchor: DockAnchor | undefined): ElementOverride {
  return {
    parentId,
    slot: anchor && "slot" in anchor ? anchor.slot : undefined,
    offset: anchor && "offset" in anchor ? anchor.offset : undefined,
    // Las imágenes y videos se adaptan al cuadro donde se sueltan.
    fitToParent: element && fillsParentByDefault(element) ? true : undefined,
  };
}

/** El formato de un elemento al acoplarlo (o soltarlo, con `parentId` null). */
export const dockChange = (element: CanvasElement | undefined, parentId: string | null, anchor: DockAnchor | undefined) =>
  parentId === null ? FREE_OF_CONTAINER : dockPatch(element, parentId, anchor);
