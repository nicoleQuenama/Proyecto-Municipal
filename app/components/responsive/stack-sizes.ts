import type { CanvasElement, ElementKind } from "../site/types";

const CHAR_WIDTH = 0.55;
const LINE_HEIGHT = 1.3;

/** Alto aproximado que ocupa un texto al ancho dado (sin medir el navegador): líneas × tamaño de letra. */
export function textHeight(el: CanvasElement, width: number): number {
  if (el.text.trim() === "") return 0;
  const perLine = Math.max(1, Math.floor(width / (el.fontSize * CHAR_WIDTH)));
  const lines = el.text.split("\n").reduce((sum, line) => sum + Math.max(1, Math.ceil(line.length / perLine)), 0);
  return Math.ceil(lines * el.fontSize * LINE_HEIGHT);
}

export interface Fit {
  width: number;
  height: number;
}

/** Imágenes, videos y elipses conservan su proporción; no se estiran más allá de su tamaño original. */
const keepAspect = (el: CanvasElement, width: number): Fit => {
  const w = Math.min(el.width, width);
  return { width: w, height: Math.round((el.height * w) / el.width) };
};

/** Textos y rectángulos llenan el ancho; el alto crece solo si el texto necesita más líneas. */
const fillWidth = (el: CanvasElement, width: number): Fit => ({
  width,
  height: Math.max(el.height, textHeight(el, width)),
});

/** Cómo se dimensiona cada tipo de elemento al apilarse en el ancho disponible. */
export const FIT: Record<ElementKind, (el: CanvasElement, width: number) => Fit> = {
  rect: (el, width) =>
    el.width <= 64 && el.height <= 64 && !el.text?.trim()
      ? keepAspect(el, width)
      : fillWidth(el, width),
  text: fillWidth,
  image: keepAspect,
  video: keepAspect,
  ellipse: keepAspect,
  triangle: keepAspect,
  line: keepAspect,
  icon: keepAspect,
};
