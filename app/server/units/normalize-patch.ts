import type { Page, ProjectMediaAsset, SiteState } from "../../components/site/types";
import type { StyleRule, StyleScope } from "../../components/styles/types";
import type { SitePatch } from "../site/site-patch";
import { mergeVisibleSlice, type SliceRules } from "./merge-visible";
import type { UnitAccess } from "./types";
import { ownsUnit, seesUnit } from "./units-access";

type Scoped = Extract<UnitAccess, { scoped: true }>;

const ruleKey = (rule: StyleRule): string => `${JSON.stringify(rule.scope)}|${JSON.stringify(rule.target)}`;

/** Reglas de lo que cuelga de un ámbito de estilo: lo de una página es de su unidad; lo global y de componentes, de lo global. */
function styleRules<T extends { scope: StyleScope }>(access: Scoped, unitOfPage: (pageId: string) => string | null | undefined, key: (item: T) => string): SliceRules<T> {
  return {
    key,
    visible: (item) => item.scope.kind !== "page" || seesUnit(access, unitOfPage(item.scope.pageId)),
    editable: (item) => (item.scope.kind === "page" ? ownsUnit(access, unitOfPage(item.scope.pageId)) : access.canEditGlobal),
  };
}

const mediaRules = (access: Scoped): SliceRules<ProjectMediaAsset> => ({
  key: (asset) => asset.id,
  visible: (asset) => seesUnit(access, asset.unitId),
  editable: (asset) => (asset.unitId ? ownsUnit(access, asset.unitId) : access.canEditGlobal),
});

/** El orden de las páginas que envía quien ve solo algunas: las que no ve conservan su lugar y las suyas ocupan los demás. */
function mergeOrder(fullIds: readonly string[], invisible: ReadonlySet<string>, submitted: readonly string[]): string[] {
  const queue = [...submitted];
  const merged = fullIds.flatMap((id) => (invisible.has(id) ? [id] : queue.length > 0 ? [queue.shift()!] : []));
  return [...merged, ...queue];
}

/**
 * Lo que una persona sujeta a unidades envía de las listas que se guardan ENTERAS (variables, reglas y la biblioteca de medios) es
 * solo lo que ve. Esto devuelve el parche con esas listas completas (conservando lo ajeno) o lanza 403 si toca algo que no puede.
 */
export function normalizePatchForUnits(patch: SitePatch, current: SiteState, access: UnitAccess): SitePatch {
  if (!access.scoped) return patch;
  const pages: Page[] = [...current.pages, ...(patch.pages?.upsert ?? [])];
  const unitOfPage = (pageId: string) => pages.find((page) => page.id === pageId)?.unitId;
  const out: SitePatch = { ...patch };

  if (patch.pages?.order) {
    const invisible = new Set(current.pages.filter((page) => !seesUnit(access, page.unitId)).map((page) => page.id));
    out.pages = { ...patch.pages, order: mergeOrder(current.pages.map((page) => page.id), invisible, patch.pages.order) };
  }

  if (patch.variables) out.variables = mergeVisibleSlice(current.variables, patch.variables, styleRules(access, unitOfPage, (variable) => variable.id));
  if (patch.rules) out.rules = mergeVisibleSlice(current.rules, patch.rules, styleRules(access, unitOfPage, ruleKey));
  if (patch.settings) {
    const sent = (patch.settings.projectMedia as ProjectMediaAsset[] | undefined) ?? [];
    out.settings = { ...patch.settings, projectMedia: mergeVisibleSlice(current.projectMedia ?? [], sent, mediaRules(access)) };
  }
  return out;
}
