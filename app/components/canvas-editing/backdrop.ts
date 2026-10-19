import type { CanvasElement } from "../site/types";
import type { Size } from "./limits";

/** Qué parte de la sección debe cubrir una pieza para considerarse su fondo (y no algo que se mueve dentro). */
const BACKDROP_COVERAGE = 0.9;

/**
 * El fondo de una sección, como el rectángulo de una tarjeta: no tiene a dónde moverse dentro de ella, así que
 * arrastrarlo mueve la sección entera.
 */
export const isBackdrop = (element: CanvasElement, section: Size): boolean =>
  element.width * element.height >= section.width * section.height * BACKDROP_COVERAGE;
