/** Los extremos de una línea dentro de su caja, en porcentaje (0-100). Lógica pura. */

import { MIN_ELEMENT_SIZE } from "../canvas-editing/limits";
import type { CanvasElement } from "./types";

type Box = Pick<CanvasElement, "width" | "height" | "flipped">;

/** Casi plana o casi vertical: se dibuja recta por el centro en vez de en diagonal. */
export function linePoints({ width, height, flipped }: Box): { x1: number; y1: number; x2: number; y2: number } {
  if (height <= MIN_ELEMENT_SIZE) return { x1: 0, y1: 50, x2: 100, y2: 50 };
  if (width <= MIN_ELEMENT_SIZE) return { x1: 50, y1: 0, x2: 50, y2: 100 };
  return flipped ? { x1: 0, y1: 100, x2: 100, y2: 0 } : { x1: 0, y1: 0, x2: 100, y2: 100 };
}
