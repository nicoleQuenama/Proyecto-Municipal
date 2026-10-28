/** Texto que se adapta al ancho de la pantalla con un mínimo y un máximo (como `clamp()` en CSS). */

/** El ancho en que se diseñó la página: ahí el texto mide justo lo que se dibujó. */
export const DESIGN_WIDTH = 1024;

export interface FluidText {
  min: number;
  max: number;
}

/** Los límites de partida: de la mitad al doble del tamaño dibujado. */
export const defaultFluid = (fontSize: number): FluidText => ({
  min: Math.max(10, Math.round(fontSize / 2)),
  max: Math.round(fontSize * 1.5),
});

/** El `font-size` en CSS: crece y se encoge con el ancho de la página (`--cms-w`), sin salirse de [min, max]. */
export function fluidFontSize(fontSize: number, fluid: FluidText): string {
  const ratio = Number((fontSize / DESIGN_WIDTH).toFixed(5));
  const min = Math.min(fluid.min, fluid.max);
  const max = Math.max(fluid.min, fluid.max);
  return `clamp(${min}px, calc(var(--cms-w, ${DESIGN_WIDTH}px) * ${ratio}), ${max}px)`;
}

/** Cuánto mide el texto con una página de ese ancho (lo mismo que calcula el CSS), para mostrarlo al diseñar. */
export function fluidSizeAt(fontSize: number, fluid: FluidText, pageWidth: number): number {
  const min = Math.min(fluid.min, fluid.max);
  const max = Math.max(fluid.min, fluid.max);
  return Math.round(Math.min(max, Math.max(min, (pageWidth * fontSize) / DESIGN_WIDTH)));
}
