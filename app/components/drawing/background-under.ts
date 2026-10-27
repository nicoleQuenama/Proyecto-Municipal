/** El fondo visible bajo un punto de la pantalla: el de la capa más alta que pinta algo opaco. */

import { parseCssColor } from "../audit/color";

/** Lo que se pinta con menos opacidad que esto no cuenta como fondo (velos, contornos de selección). */
const MIN_ALPHA = 0.5;

export function backgroundAt(clientX: number, clientY: number): string | null {
  for (const element of document.elementsFromPoint(clientX, clientY)) {
    const style = getComputedStyle(element);
    if (/gradient\(/i.test(style.backgroundImage)) return style.backgroundImage;
    const color = parseCssColor(style.backgroundColor);
    if (color && color.a >= MIN_ALPHA) return style.backgroundColor;
  }
  return null;
}
