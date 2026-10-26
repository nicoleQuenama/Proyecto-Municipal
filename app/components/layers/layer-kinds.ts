import type { CanvasElement, ElementKind } from "../site/types";

/** Nombre y símbolo de cada tipo de elemento en el panel de capas. */
const KINDS: Record<ElementKind, { name: string; glyph: string }> = {
  rect: { name: "Rectángulo", glyph: "▭" },
  ellipse: { name: "Elipse", glyph: "◯" },
  triangle: { name: "Triángulo", glyph: "△" },
  line: { name: "Línea", glyph: "╱" },
  text: { name: "Texto", glyph: "T" },
  image: { name: "Imagen", glyph: "▣" },
  video: { name: "Video", glyph: "▶" },
  icon: { name: "Ícono", glyph: "★" },
};

export const layerGlyph = (element: CanvasElement): string => KINDS[element.kind].glyph;

/** El nombre que le puso la persona o, si no tiene, el del tipo con un trozo de su texto. */
export function layerName(element: CanvasElement): string {
  const own = element.name?.trim();
  if (own) return own;
  const text = element.text.trim().replace(/\s+/g, " ");
  const short = text.length > 22 ? `${text.slice(0, 21)}…` : text;
  return short ? `${KINDS[element.kind].name} «${short}»` : KINDS[element.kind].name;
}
