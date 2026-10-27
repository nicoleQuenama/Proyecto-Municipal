/** Tamaños de uso común, para no tener que saber cuánto mide una tarjeta o un botón. */

import { MAX_CANVAS_HEIGHT, MAX_CANVAS_WIDTH, MIN_CANVAS_SIZE } from "../canvas-editing/limits";
import type { CanvasElement } from "../site/types";

export interface SizePreset {
  label: string;
  width: number;
  height: number;
}

export const SIZE_PRESETS: SizePreset[] = [
  { label: "Botón", width: 180, height: 52 },
  { label: "Campo de texto", width: 320, height: 48 },
  { label: "Tarjeta", width: 300, height: 380 },
  { label: "Tarjeta ancha", width: 560, height: 220 },
  { label: "Miniatura 16:9", width: 320, height: 180 },
  { label: "Cuadrado", width: 240, height: 240 },
  { label: "Barra", width: 1024, height: 80 },
  { label: "Banner", width: 1024, height: 480 },
];

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, Math.round(value)));

/** El tamaño que abraza a todos los elementos, con un margen; sin elementos, no cambia nada (null). */
export function fitToContent(elements: CanvasElement[], margin = 16): { width: number; height: number } | null {
  if (elements.length === 0) return null;
  const right = Math.max(...elements.map((el) => el.x + el.width));
  const bottom = Math.max(...elements.map((el) => el.y + el.height));
  return {
    width: clamp(right + margin, MIN_CANVAS_SIZE, MAX_CANVAS_WIDTH),
    height: clamp(bottom + margin, MIN_CANVAS_SIZE, MAX_CANVAS_HEIGHT),
  };
}
