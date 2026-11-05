import type { SiteState } from "../../components/site/types";
import type { Tx } from "../db";
import { applyPatchToSite } from "../site/site-apply";
import { loadSite } from "../site/site-load";
import type { SitePatch } from "../site/site-patch";
import type { Scope } from "../site/site-sql";
import { VersionError, type BranchRow } from "./branch-rows";
import { readCommitSite } from "./snapshot-store";

/** Hasta qué operación de edición llega la versión de cabeza de la rama (0 si no tiene versiones). */
async function opsThrough(tx: Tx, scope: Scope, headId: string | null): Promise<number> {
  if (!headId) return 0;
  const [row] = await tx.unsafe(`select ops_through::text as n from app.commits where organization_id = $1 and project_id = $2 and id = $3`, [scope.org, scope.project, headId]);
  return Number(row?.n ?? 0);
}

/** Las ediciones de una rama posteriores a su última versión, en orden. */
async function pendingPatches(tx: Tx, scope: Scope, branch: BranchRow): Promise<SitePatch[]> {
  const after = await opsThrough(tx, scope, branch.headId);
  const rows = await tx.unsafe(
    `select action from app.edit_operations where organization_id = $1 and project_id = $2 and branch_id = $3 and seq > $4 order by seq`,
    [scope.org, scope.project, branch.id, after],
  );
  return rows.map((row) => (row.action as { patch: SitePatch }).patch);
}

/** La última operación de edición de la rama (0 si no hay): una versión nueva la incluye. */
export async function lastOperation(tx: Tx, scope: Scope, branch: BranchRow): Promise<number> {
  const [row] = await tx.unsafe(`select coalesce(max(seq), 0)::text as n from app.edit_operations where organization_id = $1 and project_id = $2 and branch_id = $3`, [scope.org, scope.project, branch.id]);
  return Number(row.n);
}

/** El sitio de la última versión de la rama; `null` si todavía no tiene (main sin ninguna versión guardada). */
export async function headSite(tx: Tx, scope: Scope, branch: BranchRow): Promise<SiteState | null> {
  return branch.headId ? readCommitSite(tx, scope, branch.headId) : null;
}

/**
 * El sitio de la rama tal como está ahora. En main son las tablas de contenido; en las demás, la foto de su última
 * versión más sus ediciones posteriores.
 */
export async function loadBranchSite(tx: Tx, scope: Scope, branch: BranchRow): Promise<SiteState | null> {
  if (branch.isMain) return loadSite(tx, scope);
  const head = await headSite(tx, scope, branch);
  if (!head) throw new VersionError("La rama no tiene una versión de partida: pide que guarden primero una versión en main.", 409);
  return (await pendingPatches(tx, scope, branch)).reduce((site, patch) => applyPatchToSite(site, patch), head);
}
