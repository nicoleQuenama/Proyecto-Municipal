/**
 * Quitar un elemento sin deformar lo demás: lo que estaba acoplado a él se suelta y CONSERVA el sitio donde se veía
 * (no salta a 0,0 ni queda detrás), y el resto mantiene su orden de capas.
 */

import type { CanvasElement } from "../site/types";
import { layoutDocked } from "./dock-layout";

export type Frame = Pick<CanvasElement, "x" | "y" | "width" | "height">;

const isChildOf = (element: CanvasElement, ids: Set<string>) =>
  element.parentId !== undefined && ids.has(element.parentId);

/** Lo que dependía de un elemento quitado: suelto, sin casilla ni ajuste. */
const freed = (element: CanvasElement): CanvasElement => ({
  ...element,
  parentId: undefined,
  slot: undefined,
  offset: undefined,
  fitToParent: undefined,
});

/** La caja visible de los hijos directos de los elementos quitados (los que no se quitan también). */
export function releasedFrames(elements: CanvasElement[], ids: Set<string>): Record<string, Frame> {
  return Object.fromEntries(
    layoutDocked(elements)
      .filter((element) => !ids.has(element.id) && isChildOf(element, ids))
      .map(({ id, x, y, width, height }) => [id, { x, y, width, height }]),
  );
}

/** Los elementos sin los quitados; los hijos de estos quedan sueltos en su sitio visible. */
export function withoutElements(elements: CanvasElement[], ids: Set<string>): CanvasElement[] {
  // La lista ya ordenada por contenedor: cada hijo conserva su capa respecto a los demás.
  return layoutDocked(elements)
    .filter((element) => !ids.has(element.id))
    .map((element) => (isChildOf(element, ids) ? freed(element) : element));
}
