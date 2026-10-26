import { pageElements } from "./page-elements";
import type { Page, SiteState } from "../site/types";

const LEVELS = { h1: 1, h2: 2, h3: 3 } as const;

/** Niveles de títulos en orden de lectura: el titular de la página y los elementos con rol «heading» (como H2). */
export function headingLevels(site: SiteState, page: Page): number[] {
  const own = !page.titleRemoved && !page.titleHidden && page.title.text.trim() ? LEVELS[page.title.block as keyof typeof LEVELS] : undefined;
  const fromElements = pageElements(site, page).filter((a) => a.element.role === "heading" && a.element.text.trim()).map(() => 2);
  const fromCode = page.blocks.flatMap((b) => [...(b.code?.html.matchAll(/<h([1-6])\b/gi) ?? [])].map((m) => Number(m[1])));
  return [...(own ? [own] : []), ...fromElements, ...fromCode];
}
