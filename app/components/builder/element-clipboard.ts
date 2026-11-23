import { descendantIds } from "../canvas-editing/containers";
import type { CanvasElement } from "../site/types";

/** Lo último que se copió en un constructor: los elementos y todo lo que llevan dentro. Sirve entre componentes. */
let current: CanvasElement[] = [];

export const readElementClip = (): CanvasElement[] => current;

/** Copia los elementos con su contenido (en el orden del lienzo); devuelve lo copiado (vacío si no existen). */
export function copyElements(elements: CanvasElement[], ids: string[]): CanvasElement[] {
  const wanted = new Set(ids);
  for (const id of ids) descendantIds(elements, id).forEach((inside) => wanted.add(inside));
  current = elements.filter((element) => wanted.has(element.id));
  return current;
}
