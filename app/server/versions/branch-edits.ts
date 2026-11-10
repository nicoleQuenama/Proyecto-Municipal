import { randomUUID } from "node:crypto";
import type { Tx } from "../db";
import { applyPatch } from "../site/site-save";
import type { SitePatch, SaveResult } from "../site/site-patch";
import type { Scope } from "../site/site-sql";
import type { BranchRow } from "./branch-rows";
import { loadBranchSite } from "./branch-state";
import { assertBrandRespected } from "./brand-rules";
import { normalizePatchForUnits } from "../units/normalize-patch";
import { unitsOf } from "../units/units-access";
import { assertPatchAllowed } from "./patch-permissions";

/**
 * Guarda lo que cambió en una rama. En main se escribe en las tablas (la base de datos aplica los permisos); en las demás
 * queda como una operación de edición: cuando guarden una versión, la foto nueva las incluye.
 */
export async function saveBranchPatch(tx: Tx, scope: Scope, userId: string, branch: BranchRow, sent: SitePatch): Promise<SaveResult> {
  const current = await loadBranchSite(tx, scope, branch);
  // Quien está sujeto a unidades envía filtradas las listas que se guardan enteras: se reconstruyen completas (o se rechaza).
  const access = await unitsOf(tx);
  const patch = current ? normalizePatchForUnits(sent, current, access) : sent;
  // El manual de marca vale en todas las ramas, también en main.
  if (current) await assertBrandRespected(tx, patch, current);
  if (branch.isMain) return applyPatch(tx, scope, userId, patch, { current, access });

  if (current) await assertPatchAllowed(tx, scope, patch, current, access);
  await tx.unsafe(`select app.append_operations($1::uuid, $2::uuid, $3::jsonb)`, [branch.id, randomUUID(), [{ type: "patch", patch }] as never]);
  return { rejectedCode: [] };
}
