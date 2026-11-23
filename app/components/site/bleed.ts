export interface BleedInput {
  /** La vista previa de escritorio a todo el ancho de la ventana («Probar»). */
  fullPage: boolean;
  /** Tiene posición libre: se coloca donde se pone, no se estira. */
  placed: boolean;
  /** Marcada «todo el ancho». */
  stretches: boolean;
  /** Pintada de borde a borde (se detecta en «Probar»). */
  autoFill: boolean;
  isHeaderOrFooter: boolean;
  /** Se marcó explícitamente «Su contenido» (con márgenes). */
  hasExplicitContentSpan?: boolean;
}

/**
 * ¿La sección sale de los márgenes de la página y llega a sus costados? Lo hacen lo marcado «todo el ancho», la cabecera
 * y el pie, y lo pintado de borde a borde en «Probar». Una sección ancha ya no sangra sola: se escala al margen de la hoja.
 */
export const bleedsToEdges = ({
  fullPage,
  placed,
  stretches,
  autoFill,
  isHeaderOrFooter,
  hasExplicitContentSpan,
}: BleedInput): boolean => {
  if (placed) return false;
  if (hasExplicitContentSpan) return false;
  return stretches || isHeaderOrFooter || (fullPage && autoFill);
};

