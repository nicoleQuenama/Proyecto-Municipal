import type { SiteState } from "../site/types";
import { RULES } from "./rules";
import { scoreAll } from "./score";
import type { DomMeasures, PageReport, Rule } from "./types";

/** Revisa una página con todas las reglas y calcula sus notas. */
export function auditPage(site: SiteState, pageId: string, dom?: DomMeasures, rules: Rule[] = RULES): PageReport {
  const page = site.pages.find((p) => p.id === pageId);
  if (!page) return { pageId, findings: [], scores: scoreAll([], rules) };

  const findings = rules.flatMap((rule) => rule.check(site, page, dom));
  return { pageId, findings, scores: scoreAll(findings, rules) };
}

/** Revisa todas las páginas del proyecto. */
export const auditSite = (site: SiteState, dom?: DomMeasures, rules: Rule[] = RULES): PageReport[] =>
  site.pages.map((page) => auditPage(site, page.id, dom, rules));
