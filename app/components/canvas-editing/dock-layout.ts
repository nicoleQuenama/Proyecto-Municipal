/**
 * El layout de lo acoplado. Un elemento acoplado no guarda su posición: se calcula a partir de su contenedor
 * (casilla, posición libre o ajuste al contenedor). Así, si el contenedor se mueve o cambia de tamaño, lo que
 * lleva dentro lo sigue.
 */

import type { CanvasElement } from "../site/types";
import { DOCK_PADDING, dockedPosition, type Point } from "./dock-slots";
import { MIN_ELEMENT_SIZE } from "./limits";

type Frame = Pick<CanvasElement, "x" | "y" | "width" | "height">;

/** Cada elemento acoplado va justo después de su contenedor, para dibujarse encima de él. */
function orderByTree(elements: CanvasElement[]): CanvasElement[] {
  const ids = new Set(elements.map((e) => e.id));
  const childrenOf = (id: string) => elements.filter((e) => e.parentId === id);
  const place = (element: CanvasElement): CanvasElement[] => [element, ...childrenOf(element.id).flatMap(place)];

  // Un elemento cuyo contenedor ya no existe cuenta como suelto.
  return elements.filter((e) => e.parentId === undefined || !ids.has(e.parentId)).flatMap(place);
}

/** La caja que llena el contenedor, con el mismo margen que las casillas. */
const filledFrame = (parent: CanvasElement): Frame => ({
  x: parent.x + DOCK_PADDING,
  y: parent.y + DOCK_PADDING,
  width: Math.max(MIN_ELEMENT_SIZE, parent.width - 2 * DOCK_PADDING),
  height: Math.max(MIN_ELEMENT_SIZE, parent.height - 2 * DOCK_PADDING),
});

const offsetPosition = (parent: CanvasElement, offset: Point): Point => ({
  x: parent.x + offset.x,
  y: parent.y + offset.y,
});

/** Cómo se coloca un elemento acoplado, de lo más específico a lo más general. */
function placedIn(parent: CanvasElement, element: CanvasElement): CanvasElement {
  if (element.fitToParent) return { ...element, ...filledFrame(parent) };
  if (element.slot) return { ...element, ...dockedPosition(parent, element, element.slot) };
  if (element.offset) return { ...element, ...offsetPosition(parent, element.offset) };
  return element;
}

/** Un elemento al que le falta su contenedor queda suelto, donde está. */
const orphaned = (element: CanvasElement): CanvasElement => ({
  ...element,
  parentId: undefined,
  slot: undefined,
  offset: undefined,
  fitToParent: undefined,
});

/**
 * Recalcula la posición (y el tamaño, si se ajustan) de todos los elementos acoplados, de fuera hacia dentro, y
 * los ordena tras su contenedor. Es idempotente: aplicarla dos veces da lo mismo que una.
 */
export function layoutDocked(elements: CanvasElement[]): CanvasElement[] {
  const placedById = new Map<string, CanvasElement>();

  return orderByTree(elements).map((element) => {
    const parent = element.parentId === undefined ? undefined : placedById.get(element.parentId);
    const placed = element.parentId === undefined ? element : parent ? placedIn(parent, element) : orphaned(element);

    placedById.set(placed.id, placed);
    return placed;
  });
}
