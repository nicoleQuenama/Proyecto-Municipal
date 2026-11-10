import type { SiteState } from "../../components/site/types";
import type { StyleScope } from "../../components/styles/types";
import type { UnitAccess } from "./types";
import { seesUnit } from "./units-access";

/**
 * El sitio tal como lo ve una persona sujeta a unidades: sus páginas y las globales (con sus medios, comentarios y estilos de
 * página). Lo que es de otra unidad no se envía. Solo para MOSTRAR: lo que se guarda, se fusiona o se publica usa el sitio entero.
 */
export function filterSiteForUnits(site: SiteState, access: UnitAccess): SiteState {
  if (!access.scoped) return site;
  const pages = site.pages.filter((page) => seesUnit(access, page.unitId));
  const visible = new Set(pages.map((page) => page.id));
  const onVisiblePage = (scope: StyleScope) => scope.kind !== "page" || visible.has(scope.pageId);
  return {
    ...site,
    pages,
    currentPageId: visible.has(site.currentPageId) ? site.currentPageId : (pages[0]?.id ?? site.currentPageId),
    projectMedia: site.projectMedia?.filter((asset) => seesUnit(access, asset.unitId)),
    comments: site.comments?.filter((comment) => visible.has(comment.pageId)),
    variables: site.variables.filter((variable) => onVisiblePage(variable.scope)),
    rules: site.rules.filter((rule) => onVisiblePage(rule.scope)),
  };
}
