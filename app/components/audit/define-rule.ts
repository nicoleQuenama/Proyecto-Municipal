import type { DomMeasures, FindingData, Rule, RuleMeta } from "./types";
import type { Page, SiteState } from "../site/types";

/** Crea una regla: `find` solo cuenta qué pasa; la categoría, el peso y los puntos se rellenan aquí. */
export function defineRule(
  meta: RuleMeta,
  find: (site: SiteState, page: Page, dom?: DomMeasures) => FindingData[],
): Rule {
  const cap = meta.cap ?? meta.weight * 4;
  return {
    id: meta.id,
    category: meta.category,
    weight: meta.weight,
    cap,
    check: (site, page, dom) =>
      find(site, page, dom).map((data) => {
        const severity = data.severity ?? meta.severity ?? "warning";
        return {
          fixes: [],
          ...data,
          severity,
          ruleId: meta.id,
          category: meta.category,
          pageId: page.id,
          points: severity === "info" ? 0 : (data.points ?? meta.weight),
        };
      }),
  };
}
