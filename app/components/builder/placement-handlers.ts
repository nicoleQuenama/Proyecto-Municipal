/** Los manejadores que cambian dónde está un elemento y cómo se acopla a su contenedor. */

import { descendantIds, fillsParentByDefault, isContainer } from "../canvas-editing/containers";
import { detach, editElement } from "./element-rules";
import type { Handlers } from "./builder-types";

export const PLACEMENT_HANDLERS: Handlers<"move" | "nudge" | "resize" | "dock"> = {
  // Mover a mano suelta al elemento de su contenedor.
  move: (state, action) => editElement(state, action.id, (element) => ({ ...detach(element), x: action.x, y: action.y })),

  nudge: (state, action) =>
    editElement(state, action.id, (element) => ({ ...detach(element), x: element.x + action.dx, y: element.y + action.dy })),

  // Acoplado, la posición la decide el contenedor: redimensionar a mano deja de ajustarlo a él.
  resize: (state, action) =>
    editElement(state, action.id, (element) => ({
      ...element,
      x: action.x,
      y: action.y,
      width: action.width,
      height: action.height,
      fitToParent: element.fitToParent ? false : undefined,
      ...(action.offset ? { offset: action.offset } : {}),
    })),

  dock: (state, action) => {
    const parent = state.elements.find((element) => element.id === action.parentId);
    const { anchor } = action;
    const canDock =
      parent !== undefined &&
      anchor !== undefined &&
      isContainer(parent) &&
      parent.id !== action.id &&
      !descendantIds(state.elements, action.id).has(parent.id);

    return editElement(state, action.id, (element) =>
      canDock
        ? {
            ...element,
            parentId: parent.id,
            slot: "slot" in anchor ? anchor.slot : undefined,
            offset: "offset" in anchor ? anchor.offset : undefined,
            // Las imágenes y videos se adaptan al cuadro donde se sueltan.
            fitToParent: fillsParentByDefault(element) || undefined,
          }
        : detach(element),
    );
  },
};
