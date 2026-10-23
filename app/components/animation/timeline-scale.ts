/** Separación mínima (px) entre dos marcas del eje, para que las cifras no se pisen. */
const MIN_TICK_PX = 64;
const TICK_STEPS_MS = [100, 250, 500, 1000, 2000, 5000, 10000];

/** Cada cuántos ms se marca una cifra en el eje, según cuánto zoom hay (px por ms). */
export function tickStepFor(pxPerMs: number): number {
  return TICK_STEPS_MS.find((step) => step * pxPerMs >= MIN_TICK_PX) ?? TICK_STEPS_MS[TICK_STEPS_MS.length - 1];
}

/** Las marcas del eje, de 0 hasta `span`. */
export const ticksFor = (span: number, pxPerMs: number): number[] => {
  const step = tickStepFor(pxPerMs);
  return Array.from({ length: Math.floor(span / step) + 1 }, (_, i) => i * step);
};

/** Ancho (px) de la zona de pistas, que cabe entera con zoom 1 y crece al ampliar. */
export const pxPerMsFor = (available: number, span: number, zoom: number): number =>
  Math.max(0.02, available / span) * zoom;

/** Ancho (px) de la columna con el nombre de cada pista, fija a la izquierda de la línea de tiempo. */
export const TRACK_HEADER_PX = 160;
