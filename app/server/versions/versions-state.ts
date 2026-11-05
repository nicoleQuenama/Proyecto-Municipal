import type { Branch, Commit, PullRequest, Release } from "../../components/versioning/types";
import type { Tx } from "../db";
import type { Scope } from "../site/site-sql";
import { listBranches } from "./branch-rows";
import { listCommits } from "./commit-read";
import { ensureInitialVersion } from "./commit-store";
import { readIssues, type IssuesPayload } from "./issue-store";
import { listReleases } from "./publication-store";
import { listPullRequests } from "./review-read";

export interface VersionsPayload extends IssuesPayload {
  branches: Branch[];
  /** De la más reciente a la más antigua. */
  commits: Commit[];
  pullRequests: PullRequest[];
  /** Las publicaciones, de la más reciente a la más antigua. */
  releases: Release[];
  /** La rama en la que debe trabajar esta persona: main si puede publicar en ella; si no, la suya (se crea la primera vez). */
  mine: string;
}

/** Autor que se muestra para la rama principal, que no es de nadie. */
const MAIN_AUTHOR = "Equipo";

/** La rama de trabajo de esta persona. Sin versión de partida en main no hay de dónde ramificar: se queda en main. */
async function workBranch(tx: Tx, scope: Scope): Promise<string> {
  const [main] = await tx.unsafe(`select head_commit_id is not null as ready from app.branches where organization_id = $1 and project_id = $2 and is_main`, [scope.org, scope.project]);
  if (!main.ready) return "main";
  // Primero se asegura la rama y después se lee: una sola consulta no vería la rama que ella misma crea.
  const [made] = await tx.unsafe(`select app.ensure_work_branch($1::uuid) as id`, [scope.project]);
  const [row] = await tx.unsafe(`select name::text as name from app.branches where organization_id = $1 and id = $2`, [scope.org, made.id]);
  return row.name as string;
}

/** Ramas, versiones y pull requests del proyecto, tal como las ve esta persona. */
export async function readVersions(tx: Tx, scope: Scope, userId: string): Promise<VersionsPayload> {
  await ensureInitialVersion(tx, scope, userId);
  const mine = await workBranch(tx, scope);
  const [branches, commits, pullRequests] = [await listBranches(tx, scope), await listCommits(tx, scope), await listPullRequests(tx, scope)];
  return {
    branches: branches.map((branch) => ({ name: branch.name, author: branch.ownerName ?? MAIN_AUTHOR, base: branch.baseName })),
    commits,
    pullRequests,
    releases: await listReleases(tx, scope),
    mine,
    ...(await readIssues(tx, scope)),
  };
}
