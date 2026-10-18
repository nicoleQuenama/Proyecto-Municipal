/** Búsqueda de contenido en todo el sitio, como la de Visual Studio Code. */

import type { SiteState } from "../../site/types";
import { matchesQuery } from "./text-match";
import { placedBlocks } from "./targets";

export interface ContentHit {
  id: string;
  /** El texto encontrado. */
  label: string;
  /** Dónde está: «Servicios · Titular». */
  detail: string;
  pageId: string;
  blockId?: string;
}

const MAX_HITS = 30;
const MIN_QUERY_LENGTH = 2;

/** Nombres de página, titulares, nombres de bloque y textos de los elementos de cada página. */
export function searchContent(site: SiteState, query: string): ContentHit[] {
  if (query.trim().length < MIN_QUERY_LENGTH) return [];
  const hits: ContentHit[] = [];

  for (const page of site.pages) {
    if (matchesQuery(`${page.name} ${page.slug}`, query)) {
      hits.push({ id: `page:${page.id}`, label: page.name, detail: "Página", pageId: page.id });
    }
    if (matchesQuery(page.title.text, query)) {
      hits.push({ id: `title:${page.id}`, label: page.title.text, detail: `${page.name} · Titular`, pageId: page.id });
    }
  }

  // La página actual va primero: un componente compartido (una barra de navegación) se muestra donde estás.
  const blocks = placedBlocks(site).sort(
    (a, b) => Number(b.page.id === site.currentPageId) - Number(a.page.id === site.currentPageId),
  );
  const seenTexts = new Set<string>();

  for (const { page, block, def } of blocks) {
    const where = `${page.name} · ${def.name}`;
    if (matchesQuery(def.name, query)) {
      hits.push({ id: `block:${block.id}`, label: def.name, detail: `${page.name} · Bloque`, pageId: page.id, blockId: block.id });
    }
    for (const element of def.elements) {
      const key = `${def.id}:${element.id}`;
      if (element.text.trim() && !seenTexts.has(key) && matchesQuery(element.text, query)) {
        seenTexts.add(key);
        hits.push({
          id: `text:${block.id}:${element.id}`,
          label: element.text.trim().replace(/\s+/g, " "),
          detail: where,
          pageId: page.id,
          blockId: block.id,
        });
      }
    }
  }

  return hits.slice(0, MAX_HITS);
}
