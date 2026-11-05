import type { Conflict } from "../../components/versioning/types";
import { diffSite } from "../../components/persistence/site-diff";
import type { Tx } from "../db";
import { applyPatch } from "../site/site-save";
import { loadSite } from "../site/site-load";
import { conflictKey, mergeSites, type MergeConflict, type Resolutions } from "../site/site-merge";
import type { Scope } from "../site/site-sql";
import { VersionError, findBranchById } from "./branch-rows";
import { ensureInitialVersion } from "./commit-store";
import { loadBranchSite } from "./branch-state";
import { readCommitSite, saveSnapshot } from "./snapshot-store";

const SHOWN = 200;
const show = (value: unknown): string => {
  const text = typeof value === "string" ? value : value === undefined ? "—" : JSON.stringify(value);
  return text.length > SHOWN ? `${text.slice(0, SHOWN)}…` : text;
};

export const toConflict = (conflict: MergeConflict): Conflict => ({
  node: conflict.node,
  property: conflict.property || "(todo)",
  base: show(conflict.base),
  into: show(conflict.into),
  from: show(conflict.from),
  resolution: conflict.resolution,
});

export interface Resolution {
  node: string;
  property: string;
  resolution: "into" | "from";
}

export const resolutionMap = (list: readonly Resolution[]): Resolutions => new Map(list.map((item) => [conflictKey(item.node, item.property === "(todo)" ? "" : item.property), item.resolution]));

export interface OpenReview {
  id: string;
  number: number;
  title: string;
  fromId: string;
  intoId: string;
}

/**
 * Fusiona la pull request en main, todo en la transacción de quien revisa: mezcla las dos ramas con el punto donde se
 * separaron, escribe el resultado en las tablas de main (con SUS permisos) y registra la versión de fusión de dos padres.
 * Con conflictos sin resolver no escribe nada y devuelve la lista (409) para que se resuelvan.
 */
export async function mergeReview(tx: Tx, scope: Scope, userId: string, review: OpenReview, resolutions: readonly Resolution[]): Promise<void> {
  const from = await findBranchById(tx, scope, review.fromId);
  const into = await findBranchById(tx, scope, review.intoId);
  if (!into.isMain) throw new VersionError("Por ahora solo se fusiona en la rama principal.", 400);
  if (!from.forkId) throw new VersionError("La rama no tiene punto de partida.", 409);
  await ensureInitialVersion(tx, scope, userId);

  const base = await readCommitSite(tx, scope, from.forkId);
  const current = await loadSite(tx, scope);
  const theirs = await loadBranchSite(tx, scope, from);
  if (!current || !theirs) throw new VersionError("No hay nada que fusionar.", 409);

  const { merged, conflicts } = mergeSites(base, current, theirs, resolutionMap(resolutions));
  if (conflicts.some((conflict) => conflict.resolution === null)) {
    throw new VersionError("Hay conflictos sin resolver.", 409, { conflicts: conflicts.map(toConflict) });
  }

  const patch = diffSite(current, merged);
  if (patch) {
    const { rejectedCode } = await applyPatch(tx, scope, userId, patch);
    if (rejectedCode.length > 0) throw new VersionError("El resultado de la fusión tiene código con errores de sintaxis.", 422, { rejectedCode });
  }
  const snapshotId = await saveSnapshot(tx, scope, (await loadSite(tx, scope))!);
  await tx.unsafe(`select app.merge_pull_request($1::uuid, $2::uuid, $3)`, [review.id, snapshotId, `Merge del PR #${review.number}: ${review.title}`]);
}
