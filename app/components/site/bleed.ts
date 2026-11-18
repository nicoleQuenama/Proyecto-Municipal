interface BleedInput {
  /** La vista previa de escritorio a todo el ancho de la ventana («Probar»). */
  fullPage: boolean;
  /** Tiene posición libre: se coloca donde se pone, no se estira. */
  placed: boolean;
  /** Marcada «todo el ancho». */
  stretches: boolean;
  /** Pintada de borde a borde (se detecta en «Probar»). */
  autoFill: boolean;
  isHeaderOrFooter: boolean;
}

/**
 * ¿La sección sale de los márgenes de la página y llega a sus costados? En «Probar» lo hacen lo marcado «todo el ancho» y lo
 * pintado de borde a borde. En el lienzo también la barra de arriba y el pie, para que la hoja se vea como se va a ver.
 */
export const bleedsToEdges = ({ fullPage, placed, stretches, autoFill, isHeaderOrFooter }: BleedInput): boolean => {
  if (placed) return false;
  return stretches || isHeaderOrFooter || (fullPage && autoFill);
};
