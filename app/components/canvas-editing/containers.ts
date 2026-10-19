/** Consultas sobre qué elemento contiene a cuál: quién puede ser contenedor, qué hay dentro y dónde se suelta. */

import type { CanvasElement, ElementKind } from "../site/types";
import type { Point } from "./dock-slots";

/** Qué tipos de elemento pueden contener a otros. Un tipo nuevo es una entrada nueva. */
const CAN_CONTAIN: Record<ElementKind, boolean> = {
  rect: true,
  ellipse: true,
  text: false,
  image: false,
  video: false,
};

/** Qué tipos se estiran para llenar su contenedor al acoplarse: las imágenes y videos se adaptan al cuadro. */
const FILLS_PARENT_BY_DEFAULT: Record<ElementKind, boolean> = {
  rect: false,
  ellipse: false,
  text: false,
  image: true,
  video: true,
};

export const isContainer = (element: CanvasElement): boolean => CAN_CONTAIN[element.kind];

export const fillsParentByDefault = (element: CanvasElement): boolean => FILLS_PARENT_BY_DEFAULT[element.kind];

const contains = (element: CanvasElement, point: Point) =>
  point.x >= element.x &&
  point.x <= element.x + element.width &&
  point.y >= element.y &&
  point.y <= element.y + element.height;

/** El contenido de un elemento, a cualquier profundidad (sin contar al propio elemento). */
export function descendantIds(elements: CanvasElement[], id: string): Set<string> {
  const found = new Set<string>();
  let frontier = [id];
  while (frontier.length > 0) {
    const children = elements.filter((e) => e.parentId !== undefined && frontier.includes(e.parentId));
    frontier = children.map((e) => e.id).filter((childId) => !found.has(childId));
    frontier.forEach((childId) => found.add(childId));
  }
  return found;
}

/** El contenedor más alto (el que se ve encima) bajo un punto, sin contar al elemento arrastrado ni a su contenido. */
export function dropTargetAt(elements: CanvasElement[], draggedId: string, point: Point): CanvasElement | null {
  const excluded = descendantIds(elements, draggedId).add(draggedId);
  return [...elements].reverse().find((e) => isContainer(e) && !excluded.has(e.id) && contains(e, point)) ?? null;
}
