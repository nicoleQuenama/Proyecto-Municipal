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
  /** Ancho diseñado del componente; si fue diseñado para ocupar todo el lienzo (>= 1000px), sangra a los bordes. */
  defWidth?: number;
  /** Se marcó explícitamente «Su contenido» (con márgenes). */
  hasExplicitContentSpan?: boolean;
}

/**
 * ¿La sección sale de los márgenes de la página y llega a sus costados? En «Probar» lo hacen lo marcado «todo el ancho» y lo
 * pintado de borde a borde. En el lienzo también la barra de arriba y el pie, para que la hoja se vea como se va a ver.
 * Las secciones diseñadas a todo el lienzo (>= 1000px) sangran a los bordes para no desfasarse ni salirse de la hoja.
 */
export const bleedsToEdges = ({
  fullPage,
  placed,
  stretches,
  autoFill,
  isHeaderOrFooter,
  defWidth,
  hasExplicitContentSpan,
}: BleedInput): boolean => {
  if (placed) return false;
  if (hasExplicitContentSpan) return false;
  const isFullWidthComponent = typeof defWidth === "number" && defWidth >= 1000;
  return stretches || isHeaderOrFooter || isFullWidthComponent || (fullPage && autoFill);
};

