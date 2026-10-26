/** Reparar la carga de tipografías en CSS propio (puro). */

const FONT_FACE = /@font-face\s*\{[^}]*\}/gi;
const GOOGLE_IMPORT = /@import\s+(?:url\()?['"]?https?:\/\/fonts\.googleapis\.com[^;\n]*;?/gi;

/** Cuántas tipografías del CSS se cargan sin `font-display` ni `display=swap`. */
export function fontsWithoutDisplay(css: string): number {
  const faces = (css.match(FONT_FACE) ?? []).filter((face) => !/font-display/i.test(face)).length;
  const imports = (css.match(GOOGLE_IMPORT) ?? []).filter((line) => !/display=/i.test(line)).length;
  return faces + imports;
}

/** Añade `display=swap` a una tipografía de Google, justo antes de cerrar la URL. */
function swapGoogle(line: string): string {
  if (/display=/i.test(line)) return line;
  const end = line.search(/['")\s]*;?$/);
  const url = line.slice(0, end);
  return `${url}${url.includes("?") ? "&" : "?"}display=swap${line.slice(end)}`;
}

/** Añade `font-display: swap` a cada @font-face y `display=swap` a las tipografías de Google. */
export function addFontDisplay(css: string): string {
  const faces = css.replace(FONT_FACE, (face) =>
    /font-display/i.test(face) ? face : face.replace(/\}$/, "  font-display: swap;\n}"),
  );
  return faces.replace(GOOGLE_IMPORT, swapGoogle);
}
