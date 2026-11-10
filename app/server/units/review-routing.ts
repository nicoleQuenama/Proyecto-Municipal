import type { Tx } from "../db";
import type { Scope } from "../site/site-sql";
import type { BranchRow } from "../versions/branch-rows";
import { loadBranchSite } from "../versions/branch-state";
import { readCommitSite } from "../versions/snapshot-store";
import { changedUnitIds } from "./changed-units";
import { pickReviewer } from "./reviewer";

/** El revisor de lo que envía una rama: el dueño de la unidad que toca, o un superadministrador (`null`). */
export async function reviewerFor(tx: Tx, scope: Scope, from: BranchRow, authorId: string): Promise<string | null> {
  const [base, theirs] = [from.forkId ? await readCommitSite(tx, scope, from.forkId) : null, await loadBranchSite(tx, scope, from)];
  if (!theirs) return null;
  const rows = await tx.unsafe(`select id, owner_id from app.units where organization_id = $1 and deleted_at is null`, [scope.org]);
  const owners = new Map(rows.map((row) => [row.id as string, row.owner_id as string | null]));
  return pickReviewer({ authorId, changedPageUnitIds: changedUnitIds(base, theirs), owners });
}
