import { DEVICES } from "../viewport/viewport-context";

export const MIN_ELEMENT_SIZE = 8;
export const MIN_CANVAS_SIZE = 80;
/** Una página publicada no puede ser más ancha que la mayor pantalla ni tan alta que sea inmanejable. */
export const MAX_CANVAS_WIDTH = Math.max(...DEVICES.map((device) => device.width));
export const MAX_CANVAS_HEIGHT = 1200;

export interface Size {
  width: number;
  height: number;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/** Lo más pequeño que puede ser un lienzo sin dejar elementos fuera: lo que ocupan, o el mínimo. */
export function contentExtent(elements: { x: number; y: number; width: number; height: number }[]): Size {
  return {
    width: Math.max(MIN_CANVAS_SIZE, ...elements.map((e) => e.x + e.width)),
    height: Math.max(MIN_CANVAS_SIZE, ...elements.map((e) => e.y + e.height)),
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
