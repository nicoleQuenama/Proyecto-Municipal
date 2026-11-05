import type { Commit } from "../../components/versioning/types";
import { isPgError, type Tx } from "../db";
import type { Scope } from "../site/site-sql";
import { VersionError, findBranch, type BranchRow } from "./branch-rows";
import { lastOperation, loadBranchSite } from "./branch-state";
import { readCommit } from "./commit-read";
import { saveSnapshot } from "./snapshot-store";

const MAX_CHANGES = 500;
const MAX_TEXT = 300;
const text = (value: unknown): string => (typeof value === "string" ? value.slice(0, MAX_TEXT) : "");

export interface NewCommit {
  branch: unknown;
  message: unknown;
  /** El resumen legible de lo que cambió (nodo, propiedad, antes → después). Lo calcula el editor; la fuente de verdad es la foto. */
  changes: unknown;
}

function cleanChanges(value: unknown): Commit["changes"] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, MAX_CHANGES).map((item: Record<string, unknown>) => ({ node: text(item.node), property: text(item.property), before: text(item.before), after: text(item.after) }));
}

/** Escribe una versión de esa rama con el estado en que está ahora. Devuelve `null` si no cambió nada desde la anterior. */
async function writeCommit(tx: Tx, scope: Scope, userId: string, branch: BranchRow, message: string, changes: Commit["changes"]): Promise<string | null> {
  const site = await loadBranchSite(tx, scope, branch);
  if (!site) throw new VersionError("Todavía no hay nada que guardar.", 409);
  const snapshotId = await saveSnapshot(tx, scope, site);

  if (branch.headId) {
    const [head] = await tx.unsafe(`select snapshot_id as id from app.commits where organization_id = $1 and project_id = $2 and id = $3`, [scope.org, scope.project, branch.headId]);
    if (head.id === snapshotId) return null;
  }
  const through = branch.isMain ? 0 : await lastOperation(tx, scope, branch);
  const [commit] = await tx.unsafe(
    `insert into app.commits (organization_id, project_id, branch_id, snapshot_id, kind, parent_commit_id, author_id, message, ops_through)
     values ($1, $2, $3, $4, 'save', $5, $6, $7, $8) returning id`,
    [scope.org, scope.project, branch.id, snapshotId, branch.headId, userId, message, through],
  );
  if (changes.length > 0) {
    await tx.unsafe(
      `insert into app.commit_changes (organization_id, project_id, commit_id, node, property, before_value, after_value)
       select $1::uuid, $2::uuid, $3::uuid, r.node, r.property, r.before, r."after" from jsonb_to_recordset($4::jsonb) as r(node text, property text, before text, "after" text)`,
      [scope.org, scope.project, commit.id, changes as never],
    );
  }
  return commit.id as string;
}

/** Guarda una versión. El servidor toma el estado de la rama de la base de datos: lo que se guarda es lo que está guardado. */
export async function commitBranch(tx: Tx, scope: Scope, userId: string, input: NewCommit): Promise<Commit> {
  const message = text(input.message).trim();
  if (!message) throw new VersionError("Escribe un mensaje para la versión.", 400);
  const branch = await findBranch(tx, scope, text(input.branch));
  try {
    const id = await writeCommit(tx, scope, userId, branch, message, cleanChanges(input.changes));
    if (!id) throw new VersionError("No hay cambios para guardar.", 409);
    return await readCommit(tx, scope, id);
  } catch (error) {
    if (isPgError(error, "40001")) throw new VersionError("La rama cambió mientras guardabas: vuelve a intentarlo.", 409);
    throw error;
  }
}

/** Main sin ninguna versión (el proyecto es anterior al control de versiones): su estado de ahora es la versión inicial. */
export async function ensureInitialVersion(tx: Tx, scope: Scope, userId: string): Promise<void> {
  const main = await findBranch(tx, scope, "main");
  if (main.headId) return;
  const [permitted] = await tx.unsafe(`select app.has_permission($1::uuid, 'publishMain') as ok`, [scope.project]);
  if (!permitted.ok) return;
  await writeCommit(tx, scope, userId, main, "Versión inicial", []).catch((error) => {
    if (!(error instanceof VersionError)) throw error;
  });
}
