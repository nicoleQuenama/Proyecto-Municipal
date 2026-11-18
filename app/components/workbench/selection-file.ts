import type { SiteState } from "../site/types";
import type { FileRef } from "./file-ref";

/**
 * El archivo que corresponde a lo que está seleccionado: el HTML de la sección (su código de plantilla, o el
 * que se añadió), el CSS propio de un elemento. Sin selección, el código de la página que se está editando.
 */
export function selectionFile(site: SiteState): FileRef {
  const page = site.pages.find((p) => p.id === site.currentPageId);
  const block = page?.blocks.find((b) => b.id === site.selectedId);
  if (!page) return { kind: "global-css" };
  if (!block) return { kind: "page-js", pageId: page.id };

  if (site.selectedElementId) return { kind: "custom-css", pageId: page.id, blockId: block.id, key: site.selectedElementId };
  // Una sección seleccionada abre su HTML: los archivos de plantilla existen aunque aún no se haya escrito en ellos.
  return { kind: "block-html", pageId: page.id, blockId: block.id };
}
