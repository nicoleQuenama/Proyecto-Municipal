/**
 * Casillas de acoplado: un contenedor se divide en 3×3 casillas (inicio, centro y final en cada eje) y un
 * elemento acoplado a una queda alineado a ella, como una pieza de rompecabezas.
 */

import type { CanvasElement, DockAlign, DockSlot } from "../site/types";

export interface Point {
  x: number;
  y: number;
}

/** El tamaño de un elemento, lo único que hace falta para saber dónde cabe en una casilla. */
type Boxed = Pick<CanvasElement, "width" | "height">;

/** Cómo queda acoplado un elemento: en una casilla del contenedor, o en una posición libre dentro de él. */
export type DockAnchor = { slot: DockSlot } | { offset: Point };

/** Separación entre el borde del contenedor y un elemento acoplado al inicio o al final. */
export const DOCK_PADDING = 8;

/** A cuántos píxeles de una casilla el elemento se le pega; más lejos, se queda donde se suelta. */
export const DOCK_SNAP = 16;

const ALIGNS: DockAlign[] = ["start", "center", "end"];

/** Todas las casillas: cada combinación de alineación horizontal y vertical. */
const ALL_SLOTS: DockSlot[] = ALIGNS.flatMap((v) => ALIGNS.map((h): DockSlot => ({ h, v })));

/** Dónde empieza un elemento de tamaño `size` en un espacio de `space`, según el lado al que se acopla. */
const ALIGN_OFFSET: Record<DockAlign, (space: number, size: number) => number> = {
  start: () => DOCK_PADDING,
  center: (space, size) => (space - size) / 2,
  end: (space, size) => space - size - DOCK_PADDING,
};

/** Posición (en el lienzo) de un elemento acoplado a `slot` dentro de `parent`. */
export function dockedPosition(parent: CanvasElement, child: Boxed, slot: DockSlot): Point {
  return {
    x: Math.round(parent.x + ALIGN_OFFSET[slot.h](parent.width, child.width)),
    y: Math.round(parent.y + ALIGN_OFFSET[slot.v](parent.height, child.height)),
  };
}

/** La casilla de `parent` a la que un elemento, puesto en `at`, queda lo bastante cerca; `null` si a ninguna. */
export function snappedSlot(parent: CanvasElement, child: Boxed, at: Point): DockSlot | null {
  const distances = ALL_SLOTS.map((slot) => {
    const target = dockedPosition(parent, child, slot);
    return { slot, distance: Math.hypot(target.x - at.x, target.y - at.y) };
  });
  const nearest = distances.reduce((best, next) => (next.distance < best.distance ? next : best));
  return nearest.distance <= DOCK_SNAP ? nearest.slot : null;
}
