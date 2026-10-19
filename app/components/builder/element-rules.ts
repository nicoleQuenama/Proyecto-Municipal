/** Reglas puras para cambiar los elementos de un componente en el constructor. */

import type { CanvasElement } from "../site/types";
import { MIN_ELEMENT_SIZE } from "../canvas-editing/limits";
import type { BuilderState } from "./builder-types";

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/** Deja el elemento con medidas enteras, un tamaño mínimo y dentro del lienzo. */
export function fitToCanvas(element: CanvasElement, canvasWidth: number, canvasHeight: number): CanvasElement {
  const width = Math.min(canvasWidth, Math.max(MIN_ELEMENT_SIZE, Math.round(element.width)));
  const height = Math.min(canvasHeight, Math.max(MIN_ELEMENT_SIZE, Math.round(element.height)));
  return {
    ...element,
    width,
    height,
    x: clamp(Math.round(element.x), 0, Math.max(0, canvasWidth - width)),
    y: clamp(Math.round(element.y), 0, Math.max(0, canvasHeight - height)),
  };
}

/** Un elemento suelto: sigue donde está, pero ya no depende de ningún contenedor. */
export const detach = (element: CanvasElement): CanvasElement => ({
  ...element,
  parentId: undefined,
  slot: undefined,
  offset: undefined,
  fitToParent: undefined,
});

/** Cambia un elemento y lo deja ajustado al lienzo. */
export const editElement = (
  state: BuilderState,
  id: string,
  change: (element: CanvasElement) => CanvasElement,
): BuilderState => ({
  ...state,
  elements: state.elements.map((element) =>
    element.id === id ? fitToCanvas(change(element), state.width, state.height) : element,
  ),
});
