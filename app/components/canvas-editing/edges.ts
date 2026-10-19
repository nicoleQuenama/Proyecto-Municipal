/** Un rectángulo visto por sus cuatro bordes, y lo que se hace con ellos al mover o redimensionar. */

import type { CanvasElement } from "../site/types";

export interface Edges {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

/** Qué bordes se mueven en un gesto: los cuatro al mover, solo algunos al redimensionar. */
export type Sides = Record<keyof Edges, boolean>;

export const ALL_SIDES: Sides = { left: true, top: true, right: true, bottom: true };

export const edgesOf = (e: Pick<CanvasElement, "x" | "y" | "width" | "height">): Edges => ({
  left: e.x,
  top: e.y,
  right: e.x + e.width,
  bottom: e.y + e.height,
});

/** Aplica un desplazamiento solo a los bordes que se mueven. */
export function shiftEdges(edges: Edges, sides: Sides, dx: number, dy: number): Edges {
  return {
    left: sides.left ? edges.left + dx : edges.left,
    right: sides.right ? edges.right + dx : edges.right,
    top: sides.top ? edges.top + dy : edges.top,
    bottom: sides.bottom ? edges.bottom + dy : edges.bottom,
  };
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/** Al redimensionar, los bordes que se mueven no salen del lienzo ni dejan el elemento por debajo del mínimo. */
export function constrainResize(
  edges: Edges,
  sides: Sides,
  bounds: { width: number; height: number },
  minSize: number,
): Edges {
  return {
    left: sides.left ? clamp(edges.left, 0, edges.right - minSize) : edges.left,
    top: sides.top ? clamp(edges.top, 0, edges.bottom - minSize) : edges.top,
    right: sides.right ? clamp(edges.right, edges.left + minSize, bounds.width) : edges.right,
    bottom: sides.bottom ? clamp(edges.bottom, edges.top + minSize, bounds.height) : edges.bottom,
  };
}
