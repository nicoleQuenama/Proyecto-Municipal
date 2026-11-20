import { DEVICES } from "../viewport/viewport-context";

export const MIN_ELEMENT_SIZE = 1;
export const MIN_CANVAS_SIZE = 24;
/** Una página publicada no puede ser más ancha que la mayor pantalla ni tan alta que sea inmanejable. */
export const MAX_CANVAS_WIDTH = Math.max(...DEVICES.map((device) => device.width));
export const MAX_CANVAS_HEIGHT = 1200;

export interface Size {
  width: number;
  height: number;
}

/** Qué lados mueve la manija con la que se redimensiona: el izquierdo y el de arriba cambian también la posición. */
export interface ResizeAnchor {
  left: boolean;
  top: boolean;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/** Lo más pequeño que puede ser un lienzo sin dejar elementos fuera: lo que ocupan; sin elementos, el mínimo. */
export function contentExtent(elements: { x: number; y: number; width: number; height: number }[]): Size {
  const extent = (pick: (element: { x: number; y: number; width: number; height: number }) => number): number =>
    elements.length > 0 ? Math.max(...elements.map(pick)) : MIN_CANVAS_SIZE;
  return {
    width: extent((element) => element.x + element.width),
    height: extent((element) => element.y + element.height),
  };
}

/** El tamaño pedido, entero y entre lo que ocupan los elementos y el máximo de pantalla. */
export function clampCanvasSize(wanted: Size, elements: Parameters<typeof contentExtent>[0]): Size {
  const content = contentExtent(elements);
  return {
    width: clamp(Math.round(wanted.width), content.width, MAX_CANVAS_WIDTH),
    height: clamp(Math.round(wanted.height), content.height, MAX_CANVAS_HEIGHT),
  };
}
