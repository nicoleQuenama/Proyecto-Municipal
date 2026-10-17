/** Id del contenedor con scroll del lienzo, para medir cuánto espacio hay. */
export const CANVAS_SURFACE_ID = "canvas-surface";

/** Espacio entre marcos de página cuando se ven lado a lado, y margen del lienzo. */
export const TILE_GAP = 32;
export const CANVAS_PADDING = 64;

/**
 * El mayor zoom (de los disponibles) con el que caben `count` páginas de `pageWidth` píxeles
 * una al lado de otra en `available` píxeles. Si ni el menor cabe, devuelve el menor.
 */
export function fitZoom(count: number, pageWidth: number, available: number, steps: number[]): number {
  const ascending = [...steps].sort((a, b) => a - b);
  const fits = (zoom: number) =>
    (count * pageWidth * zoom) / 100 + (count - 1) * TILE_GAP + CANVAS_PADDING <= available;

  return [...ascending].reverse().find(fits) ?? ascending[0];
}
