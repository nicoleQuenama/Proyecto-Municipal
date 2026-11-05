import type { Page, SiteState } from "../../components/site/types";
import type { Tx } from "../db";
import { deepEqual } from "../site/deep-equal";
import type { SitePatch } from "../site/site-patch";
import type { Scope } from "../site/site-sql";
import { VersionError } from "./branch-rows";

/**
 * Las tablas de main aplican los permisos con disparadores; una rama no tiene tablas, así que sus ediciones se comprueban
 * aquí con las MISMAS funciones de la base de datos (`has_permission`, `can_edit_content`): nadie puede meter en su
 * rama lo que no podría escribir en main, y al fusionar no se cuela nada con los permisos de quien revisa.
 */
async function allowed(tx: Tx, scope: Scope, sql: string, ...params: (string | null)[]): Promise<boolean> {
  const [row] = await tx.unsafe(`select ${sql} as ok`, [scope.project, ...params]);
  return row.ok === true;
}
const has = (tx: Tx, scope: Scope, permission: string) => allowed(tx, scope, `app.has_permission($1::uuid, $2)`, permission);
const canEdit = (tx: Tx, scope: Scope, page: string, block: string | null = null) => allowed(tx, scope, `app.can_edit_content($1::uuid, $2, $3)`, page, block);

async function require_(ok: boolean | Promise<boolean>, what: string): Promise<void> {
  if (!(await ok)) throw new VersionError(`No tienes permiso para ${what}.`, 403);
}

/** ¿Puede esta persona dejar la página como viene en el parche, partiendo de como está? */
async function pageAllowed(tx: Tx, scope: Scope, next: Page, current: Page | undefined): Promise<boolean> {
  if (await canEdit(tx, scope, next.id)) return true;
  if (!current) return false;
  const { blocks: nextBlocks, ...nextRest } = next;
  const { blocks: currentBlocks, ...currentRest } = current;
  if (!deepEqual(nextRest, currentRest)) return false;

  const before = new Map(currentBlocks.map((block) => [block.id, block]));
  const touched = nextBlocks.filter((block) => !deepEqual(before.get(block.id), block)).map((block) => block.id);
  const removed = currentBlocks.filter((block) => !nextBlocks.some((item) => item.id === block.id)).map((block) => block.id);
  for (const id of [...touched, ...removed]) if (!(await canEdit(tx, scope, next.id, id))) return false;
  return true;
}

/** Rechaza (403) un parche que toca algo que esta persona no puede tocar. `current` es la rama antes del parche. */
export async function assertPatchAllowed(tx: Tx, scope: Scope, patch: SitePatch, current: SiteState): Promise<void> {
  const pending = [
    [patch.variables || patch.rules || patch.navigation || patch.globalCss !== undefined, "editStyles", "cambiar los estilos"],
    [patch.components, "editContent", "editar los componentes"],
    [patch.settings, "editContent", "editar el contenido"],
    [patch.functions, "editCode", "editar las funciones"],
    [patch.sources, "editData", "editar las fuentes de datos"],
    [patch.libraries, "installLibraries", "instalar librerías"],
    [patch.comments, "comment", "comentar"],
  ] as const;
  for (const [touched, permission, what] of pending) if (touched) await require_(has(tx, scope, permission), what);

  if (!patch.pages) return;
  if (await allowed(tx, scope, `app.can_edit_all_content($1::uuid)`)) return;
  const before = new Map(current.pages.map((page) => [page.id, page]));
  for (const id of patch.pages.remove) await require_(canEdit(tx, scope, id), "quitar esta página");
  for (const page of patch.pages.upsert) {
    if (!deepEqual(before.get(page.id), page)) await require_(pageAllowed(tx, scope, page, before.get(page.id)), "editar esta página o sección");
  }
}
