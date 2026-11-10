import type { SiteState } from "../../components/site/types";
import { decomposeRule, decomposeVariable } from "../site/decompose-site";
import type { SitePatch } from "../site/site-patch";
import { upsertRows, type Scope, type Tx } from "../site/site-sql";
import { RULES, VARIABLES } from "../site/site-tables";
import type { UnitAccess } from "./types";
import { ownsUnit } from "./units-access";

/** Los estilos se guardan enteros (se borran todos y se escriben de nuevo); quien no puede tocar lo global solo reemplaza lo suyo. */
export const replacesOnlyOwnStyles = (access: UnitAccess | undefined, current: SiteState | null | undefined): access is Extract<UnitAccess, { scoped: true }> =>
  !!access?.scoped && !access.canEditGlobal && !!current;

/**
 * Reemplaza solo los estilos con ámbito de página de las páginas de la persona. Lo demás (global, de componente, de otras
 * unidades) ya viene comprobado como idéntico por `normalizePatchForUnits` y no se toca: la base de datos no deja borrarlo.
 */
export async function replaceOwnStyles(tx: Tx, scope: Scope, access: Extract<UnitAccess, { scoped: true }>, current: SiteState, patch: SitePatch): Promise<void> {
  const own = new Set([...current.pages, ...(patch.pages?.upsert ?? [])].filter((page) => ownsUnit(access, page.unitId)).map((page) => page.id));
  const mine = (item: { scope: { kind: string; pageId?: string } }) => item.scope.kind === "page" && own.has(item.scope.pageId!);
  const clear = (table: string) => tx.unsafe(`delete from app.${table} where organization_id = $1 and project_id = $2 and scope = 'page' and page_id = any($3::text[])`, [scope.org, scope.project, [...own]]);

  if (patch.variables) {
    await clear("style_variables");
    await upsertRows(tx, VARIABLES, scope, patch.variables.flatMap((variable, index) => (mine(variable) ? [decomposeVariable(variable, index)] : [])));
  }
  if (patch.rules) {
    await clear("style_rules");
    await upsertRows(tx, RULES, scope, patch.rules.flatMap((rule, index) => (mine(rule) ? [decomposeRule(rule, index)] : [])));
  }
}
