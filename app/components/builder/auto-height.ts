import { isBackdrop } from "../canvas-editing/backdrop";
import { MAX_CANVAS_HEIGHT, MIN_CANVAS_SIZE } from "../canvas-editing/limits";
import type { CanvasElement } from "../site/types";

/** Aire que queda bajo lo último del contenido en un componente nuevo. */
export const BOTTOM_GAP = 24;

type Size = { width: number; height: number };

/** Lo más bajo que llega el contenido (el fondo, que cubre toda la sección, no cuenta); `null` si no hay contenido. */
export function contentBottom(elements: CanvasElement[], size: Size): number | null {
  const content = elements.filter((el) => !isBackdrop(el, size));
  return content.length === 0 ? null : Math.max(...content.map((el) => el.y + el.height));
}

/** El aire que tenía un componente guardado bajo su contenido (0 si el contenido llega al borde). */
export function savedGap(initial: { elements: CanvasElement[]; width: number; height: number }): number {
  const bottom = contentBottom(initial.elements, initial);
  return bottom === null ? BOTTOM_GAP : Math.max(0, initial.height - bottom);
}

/**
 * El alto que abraza al contenido, con `gap` de aire debajo. El fondo se estira o se encoge con la sección, así que
 * quitar algo del final acorta la sección. Con `gap` igual al que ya tenía el diseño, lo que no cambió no se mueve.
 */
export function fitHeight(elements: CanvasElement[], size: Size, gap = BOTTOM_GAP): { height: number; elements: CanvasElement[] } {
  const bottom = contentBottom(elements, size);
  if (bottom === null) return { height: size.height, elements };

  const height = Math.min(MAX_CANVAS_HEIGHT, Math.max(MIN_CANVAS_SIZE, Math.round(bottom + gap)));
  const backdrops = new Set(elements.filter((el) => isBackdrop(el, size)).map((el) => el.id));
  return { height, elements: elements.map((el) => (backdrops.has(el.id) ? { ...el, y: 0, height } : el)) };
}
