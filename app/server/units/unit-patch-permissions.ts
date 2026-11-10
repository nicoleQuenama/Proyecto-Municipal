import { without } from "../site/decompose-page";
import { decomposeProject } from "../site/decompose-site";
import { deepEqual } from "../site/deep-equal";
import type { Page, SiteState } from "../../components/site/types";
import type { Tx } from "../db";
import type { SitePatch } from "../site/site-patch";
import type { Scope } from "../site/site-sql";
import { VersionError } from "../versions/branch-rows";
import type { UnitAccess } from "./types";

const deny = (what: string): never => {
  throw new VersionError(`No tienes permiso para ${what}.`, 403);
};

/** ¿Puede esta persona editar contenido de esa unidad (`null` = global)? La misma función SQL que usan los disparadores de main. */
async function canEditUnit(tx: Tx, scope: Scope, unitId: string | null | undefined): Promise<boolean> {
  const [row] = await tx.unsafe(`select app.can_edit_in_unit($1::uuid, $2::uuid) as ok`, [scope.project, unitId ?? null]);
  return row.ok === true;
}

const hasGlobalBlock = (page: Page | undefined) => !!page?.blocks.some((block) => block.scope === "global");

/** Lo global (componentes, funciones, fuentes, librerías, navegación, CSS global y ajustes que no son la biblioteca) exige permiso global. */
export function assertGlobalAllowed(patch: SitePatch, current: SiteState, access: UnitAccess): void {
  if (!access.scoped || access.canEditGlobal) return;
  const touched = patch.components || patch.functions || patch.sources || patch.libraries || patch.navigation !== undefined || patch.globalCss !== undefined;
  if (touched) deny("cambiar lo global del sitio");
  if (patch.settings) {
    if (!deepEqual(without(patch.settings, "projectMedia"), without(decomposeProject(current).row.settings, "projectMedia"))) deny("cambiar los ajustes globales del sitio");
  }
}

/**
 * Las páginas de un parche para quien está sujeto a unidades. Las ramas no tienen tablas donde consultar de quién es una página,
 * así que se decide con la `unitId` que traen las páginas. Mover una página a otra unidad solo exige poder editar la de origen.
 */
export async function assertUnitPages(tx: Tx, scope: Scope, patch: SitePatch, current: SiteState): Promise<void> {
  if (!patch.pages) return;
  const before = new Map(current.pages.map((page) => [page.id, page]));
  for (const id of patch.pages.remove) {
    if (!(await canEditUnit(tx, scope, before.get(id)?.unitId))) deny("quitar esta página");
  }
  for (const page of patch.pages.upsert) {
    const old = before.get(page.id);
    if (old && deepEqual(old, page)) continue;
    if (!(await canEditUnit(tx, scope, old ? old.unitId : page.unitId))) deny("editar esta página o sección");
    const touchedGlobal = hasGlobalBlock(page) !== hasGlobalBlock(old) || (hasGlobalBlock(page) && !deepEqual(old?.blocks.filter((b) => b.scope === "global"), page.blocks.filter((b) => b.scope === "global")));
    if (touchedGlobal && !(await canEditUnit(tx, scope, null))) deny("cambiar una sección global");
  }
}
