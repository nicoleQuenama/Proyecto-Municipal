/** Lo que se necesita del estilo calculado de una pieza para saber si su fondo se puede extender. */
export interface PaintedStyle {
  borderTopLeftRadius: string;
  backgroundImage: string;
  backgroundColor: string;
  opacity: string;
}

/** Las secciones más angostas que esto (tarjetas, pastillas) son piezas sueltas, no barras de borde a borde. */
export const MIN_BLEED_WIDTH = 900;

/** Cuánto de la sección debe cubrir una pieza para decir que es su fondo. */
const COVERAGE = 0.99;

/** El color de fondo de una pieza tal como se dibuja, si es liso, opaco y de esquinas rectas; si no, `null`. */
export function solidPaint(style: PaintedStyle): string | null {
  if (style.borderTopLeftRadius !== "0px" || style.backgroundImage !== "none" || Number(style.opacity) < 1) return null;
  const color = style.backgroundColor.trim();
  return color && color !== "transparent" && alphaOf(color) === 1 ? color : null;
}

/** La opacidad de un color CSS en cualquier notación (`rgba(…, 0.5)`, `oklch(… / 50%)`, `rgb(…)`); 1 si no dice nada. */
export function alphaOf(color: string): number {
  const slash = /\/\s*([\d.]+)(%?)\s*\)$/.exec(color);
  if (slash) return Number(slash[1]) / (slash[2] ? 100 : 1);
  const legacy = /^(?:rgba|hsla)\(([^)]*)\)$/.exec(color);
  if (legacy) {
    const parts = legacy[1].split(",");
    return parts.length === 4 ? Number(parts[3]) : 1;
  }
  return 1;
}

/** ¿Esta caja cubre (casi) toda la sección? */
export const coversSection = (box: { width: number; height: number }, section: { width: number; height: number }): boolean =>
  box.width >= section.width * COVERAGE && box.height >= section.height * COVERAGE;

/**
 * El color de fondo que de verdad se ve en una sección de borde a borde: el de la última pieza (la de más arriba)
 * que la cubre entera con un color liso y de esquinas rectas, venga de un rectángulo, de clases o de CSS propio.
 * Una tarjeta redondeada, un degradado o una imagen no cuentan, y devuelve `null`.
 */
export function visiblePaint(canvas: HTMLElement): string | null {
  const area = canvas.getBoundingClientRect();
  const layers = [canvas, ...Array.from(canvas.querySelectorAll<HTMLElement>("*"))].filter((layer) =>
    coversSection(layer.getBoundingClientRect(), area),
  );
  for (const layer of layers.reverse()) {
    const paint = solidPaint(getComputedStyle(layer));
    if (paint) return paint;
    // Una pieza que cubre todo pero no es lisa (imagen, degradado, esquinas) tapa a las de abajo: no se extiende.
    const style = getComputedStyle(layer);
    if (style.backgroundImage !== "none" || style.borderTopLeftRadius !== "0px") return null;
  }
  return null;
}
