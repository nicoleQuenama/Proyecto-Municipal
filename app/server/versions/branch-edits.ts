import { randomUUID } from "node:crypto";
import type { Tx } from "../db";
import { applyPatch } from "../site/site-save";
import type { SitePatch, SaveResult } from "../site/site-patch";
import type { Scope } from "../site/site-sql";
import type { BranchRow } from "./branch-rows";
import { loadBranchSite } from "./branch-state";
import { assertPatchAllowed } from "./patch-permissions";

/**
 * Guarda lo que cambió en una rama. En main se escribe en las tablas (la base de datos aplica los permisos); en las demás
 * queda como una operación de edición: cuando guarden una versión, la foto nueva las incluye.
 */
export async function saveBranchPatch(tx: Tx, scope: Scope, userId: string, branch: BranchRow, patch: SitePatch): Promise<SaveResult> {
  if (branch.isMain) return applyPatch(tx, scope, userId, patch);

  const current = await loadBranchSite(tx, scope, branch);
  if (current) await assertPatchAllowed(tx, scope, patch, current);
  await tx.unsafe(`select app.append_operations($1::uuid, $2::uuid, $3::jsonb)`, [branch.id, randomUUID(), [{ type: "patch", patch }] as never]);
  return { rejectedCode: [] };
}
