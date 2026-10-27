/** El color con que nace un texto nuevo: el que mejor se lee sobre lo que hay debajo (puro). */

import { averageColor, blend, contrastRatio, parseCssColor, type Rgba } from "../audit/color";

const DARK_INK = "#0f172a";
const LIGHT_INK = "#ffffff";
const PAGE: Rgba = { r: 255, g: 255, b: 255, a: 1 };

/** Sin fondo conocido (o con una variable o imagen que no se puede leer), el texto se escribe como siempre: tinta oscura. */
export function textColorOn(background: string | null): string {
  const under = background ? averageColor(background) : null;
  if (!under) return DARK_INK;

  const solid = under.a < 1 ? blend(under, PAGE) : under;
  const dark = contrastRatio(parseCssColor(DARK_INK)!, solid);
  const light = contrastRatio(parseCssColor(LIGHT_INK)!, solid);
  return light > dark ? LIGHT_INK : DARK_INK;
}
