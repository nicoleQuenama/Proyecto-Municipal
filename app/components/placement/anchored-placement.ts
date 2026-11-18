import type { ResizeAnchor, Size } from "../canvas-editing/limits";
import type { Placement } from "./types";

/**
 * Dónde queda un elemento colocado tras cambiar de tamaño agarrando un lado: el lado contrario se queda donde estaba.
 * Si se agarra el izquierdo (o el de arriba), la posición se mueve lo que creció o se achicó; si se agarra el derecho
 * (o el de abajo), la posición no cambia. Nunca sale por la izquierda ni por arriba de la página.
 */
export function anchoredPlacement(placement: Placement, from: Size, to: Size, anchor: ResizeAnchor): Placement {
  return {
    ...placement,
    x: anchor.left ? Math.max(0, Math.round(placement.x + from.width - to.width)) : placement.x,
    y: anchor.top ? Math.max(0, Math.round(placement.y + from.height - to.height)) : placement.y,
  };
}
