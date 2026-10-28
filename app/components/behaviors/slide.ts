/** A dónde desliza un carrusel: de tarjeta en tarjeta, sea cual sea su ancho. */

export type SlideTo = "prev" | "next" | "start" | "end";

/** El desplazamiento destino. `starts` son los bordes izquierdos de las tarjetas; `left`, lo desplazado ahora. */
export function slideDestination(starts: number[], left: number, to: SlideTo, scrollWidth: number): number {
  const sorted = [...new Set(starts)].sort((a, b) => a - b);
  const tolerance = 1;
  const options: Record<SlideTo, () => number> = {
    start: () => 0,
    end: () => scrollWidth,
    next: () => sorted.find((start) => start > left + tolerance) ?? left,
    prev: () => [...sorted].reverse().find((start) => start < left - tolerance) ?? 0,
  };
  return options[to]();
}
