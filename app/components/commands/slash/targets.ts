/** Qué hay en el sitio sobre lo que actúan los comandos: bloques colocados y elementos de componentes. */

import type { BlockInstance, CanvasElement, ComponentDef, Page, SiteState } from "../../site/types";

export const currentPageOf = (site: SiteState): Page =>
  site.pages.find((page) => page.id === site.currentPageId) ?? site.pages[0];

export interface PlacedBlock {
  page: Page;
  block: BlockInstance;
  def: ComponentDef;
}

/** Los bloques de las páginas (o de una sola), con su componente. */
export function placedBlocks(site: SiteState, pageId?: string): PlacedBlock[] {
  return site.pages
    .filter((page) => pageId === undefined || page.id === pageId)
    .flatMap((page) =>
      page.blocks.flatMap((block) => {
        const def = site.components.find((c) => c.id === block.componentId);
        return def ? [{ page, block, def }] : [];
      }),
    );
}

export interface UsedElement {
  def: ComponentDef;
  element: CanvasElement;
}

export interface PlacedElement extends PlacedBlock {
  element: CanvasElement;
}

/** Cada elemento de cada bloque colocado: el mismo componente en dos páginas da dos entradas. */
export const placedElements = (site: SiteState): PlacedElement[] =>
  placedBlocks(site).flatMap((placed) => placed.def.elements.map((element) => ({ ...placed, element })));

/** Los elementos de los componentes que están en alguna página, cada componente una sola vez. */
export function usedElements(site: SiteState): UsedElement[] {
  const used = new Set(placedBlocks(site).map(({ def }) => def.id));
  return site.components
    .filter((def) => used.has(def.id))
    .flatMap((def) => def.elements.map((element) => ({ def, element })));
}
