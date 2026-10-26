import type { Page, SiteState } from "../site/types";

/** Bytes de CSS y JavaScript propios que carga una página (globales, de la página y de sus bloques de código). */
export function pageCodeBytes(site: SiteState, page: Page): number {
  const blocks = page.blocks.reduce((sum, b) => sum + (b.code ? b.code.css.length + b.code.js.length + b.code.html.length : 0), 0);
  return site.globalCss.length + (page.css?.length ?? 0) + (page.js?.length ?? 0) + site.functions.reduce((s, f) => s + f.code.length, 0) + blocks;
}

/** Cálculo aproximado de nodos del DOM: cada sección y cada elemento, más las etiquetas de los bloques de código. */
export function pageNodeCount(_site: SiteState, page: Page, elementCount: number): number {
  const codeTags = page.blocks.reduce((sum, b) => sum + (b.code?.html.match(/<[a-z]/gi)?.length ?? 0), 0);
  return elementCount + page.blocks.length + page.media.length + codeTags + 10;
}
