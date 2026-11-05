import { createHash } from "node:crypto";
import type { SiteState } from "../../components/site/types";
import type { Tx } from "../db";
import type { Scope } from "../site/site-sql";
import { decodeSite, encodeSite, type SnapshotDocument } from "../site/snapshot-codec";
import { VersionError } from "./branch-rows";

/**
 * Guarda el sitio como foto inmutable y devuelve su id. La foto se identifica por su contenido: guardar dos veces el mismo
 * estado no duplica nada. El código con errores de sintaxis no tiene árbol que guardar, así que no se puede versionar.
 */
export async function saveSnapshot(tx: Tx, scope: Scope, site: SiteState): Promise<string> {
  const { document, rejectedCode } = encodeSite(site);
  if (rejectedCode.length > 0) {
    throw new VersionError(`Hay código con errores de sintaxis (${rejectedCode.length}): corrígelo antes de guardar la versión.`, 422, { rejectedCode });
  }
  const sha = createHash("sha256").update(JSON.stringify(document)).digest();
  const [created] = await tx.unsafe(
    `insert into app.site_snapshots (organization_id, project_id, sha256, document) values ($1, $2, $3, $4::jsonb)
     on conflict (organization_id, project_id, sha256) do nothing returning id`,
    [scope.org, scope.project, sha, document as never],
  );
  if (created) return created.id as string;
  const [existing] = await tx.unsafe(`select id from app.site_snapshots where organization_id = $1 and project_id = $2 and sha256 = $3`, [scope.org, scope.project, sha]);
  return existing.id as string;
}

/** El sitio de una foto. */
export async function readSnapshot(tx: Tx, scope: Scope, snapshotId: string): Promise<SiteState> {
  const [row] = await tx.unsafe(`select document from app.site_snapshots where organization_id = $1 and project_id = $2 and id = $3`, [scope.org, scope.project, snapshotId]);
  if (!row) throw new VersionError("La versión no existe.", 404);
  return decodeSite(row.document as SnapshotDocument);
}

/** El sitio tal como quedó en una versión. */
export async function readCommitSite(tx: Tx, scope: Scope, commitId: string): Promise<SiteState> {
  const [row] = await tx.unsafe(`select snapshot_id as id from app.commits where organization_id = $1 and project_id = $2 and id = $3`, [scope.org, scope.project, commitId]);
  if (!row) throw new VersionError("La versión no existe.", 404);
  return readSnapshot(tx, scope, row.id as string);
}
