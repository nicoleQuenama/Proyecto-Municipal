import type { Category, Finding, Rule } from "./types";

export const CATEGORIES: Category[] = ["performance", "accessibility", "best-practices", "seo"];

export type Band = "good" | "average" | "poor";

/** Verde desde 90, naranja de 50 a 89, rojo por debajo (como Lighthouse). */
export const bandOf = (score: number): Band => (score >= 90 ? "good" : score >= 50 ? "average" : "poor");

/**
 * Nota 0–100 de una categoría: 100 menos lo que resta cada regla, con tope por regla
 * (así un solo problema repetido muchas veces no hunde toda la nota).
 */
export function scoreCategory(category: Category, findings: Finding[], rules: Rule[]): number {
  const caps = new Map(rules.map((rule) => [rule.id, rule.cap]));
  const lost = new Map<string, number>();
  for (const finding of findings.filter((f) => f.category === category)) {
    lost.set(finding.ruleId, (lost.get(finding.ruleId) ?? 0) + finding.points);
  }
  let total = 0;
  for (const [id, points] of lost) total += Math.min(points, caps.get(id) ?? points);
  return Math.max(0, Math.round(100 - total));
}

export function scoreAll(findings: Finding[], rules: Rule[]): Record<Category, number> {
  return Object.fromEntries(CATEGORIES.map((c) => [c, scoreCategory(c, findings, rules)])) as Record<Category, number>;
}

/** Cuántos puntos recuperaría arreglar un hallazgo (lo que aporta a su categoría). */
export const impactOf = (finding: Finding): number => Math.round(finding.points);
