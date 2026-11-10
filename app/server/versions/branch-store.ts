import { randomUUID } from "node:crypto";
import { diffSite } from "../../components/persistence/site-diff";
import { isPgError, type Tx } from "../db";
import type { Scope } from "../site/site-sql";
import { VersionError, findBranch, type BranchRow } from "./branch-rows";
import { headSite, loadBranchSite } from "./branch-state";
import { ensureInitialVersion } from "./commit-store";

const NAME = /^[^\s]{1,100}$/;

/**
 * Crea una rama de esta persona a partir de otra. Nace en la última versión de la base; lo que la base tiene sin guardar
 * (lo que se ve ahora en el editor) viaja a la rama como su primera edición, para no perderlo al cambiar de rama.
 */
export async function createBranch(tx: Tx, scope: Scope, userId: string, nameInput: unknown, baseInput: unknown): Promise<BranchRow> {
  const name = typeof nameInput === "string" ? nameInput.trim() : "";
  if (!NAME.test(name)) throw new VersionError("El nombre de la rama no puede tener espacios y debe tener hasta 100 caracteres.", 400);

  await ensureInitialVersion(tx, scope, userId);
  const base = await findBranch(tx, scope, typeof baseInput === "string" ? baseInput : "main");
  if (!base.headId) throw new VersionError("Todavía no hay ninguna versión guardada de la que partir: pide a quien publica que guarde una en main.", 409);

  try {
    await tx.unsafe(`insert into app.branches (organization_id, project_id, name, base_branch_id, owner_id) values ($1, $2, $3, $4, $5)`, [scope.org, scope.project, name, base.id, userId]);
  } catch (error) {
    if (isPgError(error, "23505")) throw new VersionError("Ya existe una rama con ese nombre.", 409);
    throw error;
  }
  const branch = await findBranch(tx, scope, name);

  const [saved, current] = [await headSite(tx, scope, base), await loadBranchSite(tx, scope, base)];
  const carried = saved && current ? diffSite(saved, current) : null;
  if (carried) await tx.unsafe(`select app.append_operations($1::uuid, $2::uuid, $3::jsonb)`, [branch.id, randomUUID(), [{ type: "patch", patch: carried }] as never]);
  return branch;
}

/** Elimina una rama (solo su dueño). Sus pull requests abiertas se cierran: ya no hay nada que revisar. */
export async function deleteBranch(tx: Tx, scope: Scope, userId: string, name: string): Promise<void> {
  const branch = await findBranch(tx, scope, name);
  if (branch.isMain) throw new VersionError("La rama principal no se puede eliminar.", 400);
  if (branch.ownerId !== userId) {
    // Quien puede publicar en main (p. ej. el superadministrador) también limpia las ramas de su equipo.
    const [row] = await tx.unsafe(`select app.has_permission($1::uuid, 'publishMain') as ok`, [scope.project]);
    if (row?.ok !== true) throw new VersionError("Solo quien creó la rama, o quien puede publicar en main, puede eliminarla.", 403);
  }

  await tx.unsafe(
    `update app.pull_requests set status = 'closed', closed_at = now()
     where organization_id = $1 and project_id = $2 and status = 'open' and (from_branch_id = $3 or into_branch_id = $3)`,
    [scope.org, scope.project, branch.id],
  );
  await tx.unsafe(`update app.branches set deleted_at = now() where organization_id = $1 and project_id = $2 and id = $3`, [scope.org, scope.project, branch.id]);
}
