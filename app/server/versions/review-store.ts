import type { PullRequest } from "../../components/versioning/types";
import type { Tx } from "../db";
import type { Scope } from "../site/site-sql";
import { VersionError, findBranch } from "./branch-rows";
import { mergeReview, type OpenReview, type Resolution } from "./review-merge";
import { readPullRequest } from "./review-read";

const MAX_TITLE = 300;

export interface NewReview {
  title: unknown;
  from: unknown;
  into: unknown;
}

/**
 * «Enviar»: abre la pull request de una rama de esta persona hacia su rama base, o suma a la que ya estaba abierta lo nuevo.
 * La recibe quien invitó a su autor (o un superadministrador si nadie lo invitó); las reglas las impone la base de datos.
 */
export async function openReview(tx: Tx, scope: Scope, input: NewReview): Promise<PullRequest> {
  const title = typeof input.title === "string" ? input.title.trim().slice(0, MAX_TITLE) : "";
  if (!title) throw new VersionError("Escribe un título para la pull request.", 400);
  const from = await findBranch(tx, scope, typeof input.from === "string" ? input.from : "");
  if (from.isMain || from.baseName !== input.into) throw new VersionError("Solo se envía una rama a la rama de la que nació.", 400);

  const [row] = await tx.unsafe(`select app.open_pull_request($1::uuid, $2) as id`, [from.id, title]);
  return readPullRequest(tx, scope, row.id as string);
}

/** La pull request abierta con ese número, con lo necesario para fusionarla. */
async function findOpen(tx: Tx, scope: Scope, number: number): Promise<OpenReview & { authorId: string; reviewerId: string | null }> {
  const [row] = await tx.unsafe(
    `select id, number, title, from_branch_id as "fromId", into_branch_id as "intoId", author_id as "authorId", reviewer_id as "reviewerId"
     from app.pull_requests where organization_id = $1 and project_id = $2 and number = $3 and status = 'open'`,
    [scope.org, scope.project, number],
  );
  if (!row) throw new VersionError("No existe esa pull request o ya no está abierta.", 404);
  return row as never;
}

export type Decision = { decision: "merge"; resolutions: readonly Resolution[] } | { decision: "close" };

/** Solo quien la recibe la fusiona (y con eso la aprueba); la pueden cerrar él o su autor. La base de datos lo verifica. */
export async function decideReview(tx: Tx, scope: Scope, userId: string, number: number, choice: Decision): Promise<PullRequest> {
  const review = await findOpen(tx, scope, number);
  if (choice.decision === "close") {
    await tx.unsafe(`update app.pull_requests set status = 'closed', closed_at = now() where organization_id = $1 and project_id = $2 and id = $3`, [scope.org, scope.project, review.id]);
  } else {
    const [reviewable] = await tx.unsafe(`select app.can_review($1::uuid, $2::uuid) as ok`, [review.authorId, review.reviewerId]);
    if (!reviewable.ok) throw new VersionError("Solo quien invitó a esta persona puede revisar y fusionar su pull request.", 403);
    await mergeReview(tx, scope, userId, review, choice.resolutions);
  }
  return readPullRequest(tx, scope, review.id);
}
