import { createHash } from "node:crypto";
import type { Release } from "../../components/versioning/types";
import type { Tx } from "../db";
import type { Scope } from "../site/site-sql";
import { VersionError, findBranch } from "./branch-rows";
import { readCommitSite } from "./snapshot-store";

interface ReleaseRow {
  number: number;
  commitId: string;
  branch: string;
  message: string;
  author: string | null;
  at: Date;
}

const toRelease = (row: ReleaseRow): Release => ({ id: `r${row.number}`, commitId: row.commitId, branch: row.branch, message: row.message, author: row.author ?? "Alguien", at: row.at.toISOString() });

const SELECT = `select p.number, p.commit_id as "commitId", b.name::text as branch, p.message, u.name as author, p.published_at as at
  from app.publications p
  join app.branches b on b.organization_id = p.organization_id and b.project_id = p.project_id and b.id = p.branch_id
  left join app.users u on u.organization_id = p.organization_id and u.id = p.published_by
  where p.organization_id = $1 and p.project_id = $2 and p.commit_id is not null`;

/** Las publicaciones del proyecto, de la más reciente a la más antigua. */
export async function listReleases(tx: Tx, scope: Scope): Promise<Release[]> {
  return ((await tx.unsafe(`${SELECT} order by p.number desc`, [scope.org, scope.project])) as unknown as ReleaseRow[]).map(toRelease);
}

/** La publicación que está en línea ahora (su sitio ya armado), o `null` si todavía no se publicó nada. */
export async function liveSite(tx: Tx, scope: Scope): Promise<{ id: string; snapshot: unknown } | null> {
  const [row] = await tx.unsafe(
    `select pub.id, pub.snapshot from app.projects p join app.publications pub on pub.organization_id = p.organization_id and pub.project_id = p.id and pub.id = p.live_publication_id
     where p.organization_id = $1 and p.id = $2`,
    [scope.org, scope.project],
  );
  return row ? { id: row.id as string, snapshot: row.snapshot } : null;
}

/**
 * Publica la última versión guardada de una rama: la deja como foto inmutable y la pone en línea. Solo se publican versiones
 * (nunca lo que está a medio editar). Quien no puede publicar en main no pasa: lo impide la base de datos.
 */
export async function publishBranch(tx: Tx, scope: Scope, userId: string, branchName: unknown): Promise<Release> {
  const branch = await findBranch(tx, scope, typeof branchName === "string" ? branchName : "main");
  if (!branch.headId) throw new VersionError("Esta rama todavía no tiene versiones: guarda una para poder publicar.", 409);

  const [live] = await tx.unsafe(
    `select pub.commit_id as id from app.projects p join app.publications pub on pub.organization_id = p.organization_id and pub.project_id = p.id and pub.id = p.live_publication_id
     where p.organization_id = $1 and p.id = $2`,
    [scope.org, scope.project],
  );
  if (live?.id === branch.headId) throw new VersionError("La última versión de esta rama ya está publicada.", 409);

  const [head] = await tx.unsafe(`select message from app.commits where organization_id = $1 and project_id = $2 and id = $3`, [scope.org, scope.project, branch.headId]);
  const snapshot = await readCommitSite(tx, scope, branch.headId);
  const sha = createHash("sha256").update(JSON.stringify(snapshot)).digest();
  const [made] = await tx.unsafe(
    `insert into app.publications (organization_id, project_id, number, branch_id, commit_id, message, snapshot, snapshot_sha256, published_by)
     values ($1, $2, app.next_number($2::uuid, 'publication'), $3, $4, $5, $6::jsonb, $7, $8) returning id, number`,
    [scope.org, scope.project, branch.id, branch.headId, head.message, snapshot as never, sha, userId],
  );
  await tx.unsafe(`update app.projects set live_publication_id = $3 where organization_id = $1 and id = $2`, [scope.org, scope.project, made.id]);

  return (await listReleases(tx, scope)).find((release) => release.id === `r${made.number}`)!;
}
