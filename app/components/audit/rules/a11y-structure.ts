import { defineRule } from "../define-rule";
import type { Page } from "../../site/types";
import { headingLevels } from "../headings";
import type { Fix } from "../types";

const goPage = (page: Page) => ({ type: "page/select" as const, id: page.id });

/** Los títulos no saltan niveles (H1 → H3 sin H2). */
export const headingOrder = defineRule({ id: "a11y-heading-order", category: "accessibility", weight: 4, cap: 8 }, (site, page) => {
  const levels = headingLevels(site, page);
  const jump = levels.findIndex((level, i) => i > 0 && level - levels[i - 1] > 1);
  if (jump < 0) return [];
  const fixes: Fix[] = [];
  if (!page.titleRemoved && !page.titleHidden && page.title.block === "h3") {
    fixes.push({ label: "Subir el titular a H2", build: () => [goPage(page), { type: "title/patch", patch: { block: "h2" } }] });
  }
  return [
    {
      title: `Los títulos saltan de H${levels[jump - 1]} a H${levels[jump]}`,
      why: "Los lectores de pantalla navegan por títulos como por un índice; si faltan niveles, el índice queda roto y confunde.",
      how: "Usa los niveles en orden: H1, luego H2, luego H3.",
      fixes,
    },
  ];
});

/** La página declara su idioma. */
export const pageLang = defineRule({ id: "a11y-lang", category: "accessibility", weight: 4, cap: 4 }, (_site, page) =>
  page.seo?.lang?.trim()
    ? []
    : [
        {
          title: "La página no dice en qué idioma está",
          why: "Los lectores de pantalla eligen la voz según el idioma: sin él, un texto en español puede leerse con acento inglés. También ayuda a traducir.",
          how: "Elige el idioma en la pestaña Páginas, bajo «Buscadores».",
          fixes: [
            {
              label: "Usar español (es)",
              build: () => [{ type: "page/seo", pageId: page.id, patch: { lang: "es" } }],
            },
          ],
        },
      ],
);
