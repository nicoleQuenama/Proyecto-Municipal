import type { DataSource } from "../data-sources/types";
import type { Page, SiteState } from "../site/types";

/** Las fuentes de datos que una página pide (por enlaces de elementos o por secciones repetidas). */
export function sourcesOfPage(site: SiteState, page: Page): DataSource[] {
  const ids = new Set<string>();
  for (const block of page.blocks) {
    if (block.repeat) ids.add(block.repeat.sourceId);
    for (const ref of Object.values(block.bindings ?? {})) ids.add(ref.sourceId);
  }
  return site.sources.filter((source) => ids.has(source.id));
}
