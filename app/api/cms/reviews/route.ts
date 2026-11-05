import { inProject } from "../../../server/site-access";
import type { Resolution } from "../../../server/versions/review-merge";
import { listPullRequests } from "../../../server/versions/review-read";
import { decideReview, openReview, type NewReview } from "../../../server/versions/review-store";
import { versionRoute } from "../../../server/versions/version-route";

const bad = (error: string) => Response.json({ error }, { status: 400 });

/** Las pull requests que esta persona envió o tiene que revisar. */
export const GET = (request: Request) => versionRoute(request, async (actor) => ({ pullRequests: await inProject(actor, listPullRequests) }));

/** Envía una pull request: `{ title, from, into }`. */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as NewReview | null;
  if (!body) return bad("Faltan datos.");
  return versionRoute(request, async (actor) => ({ pullRequest: await inProject(actor, (tx, scope) => openReview(tx, scope, body)) }), 201);
}

/** Decide sobre una: `{ number, decision: "merge" | "close", resolutions? }`. */
export async function PATCH(request: Request) {
  const body = (await request.json().catch(() => null)) as { number?: unknown; decision?: unknown; resolutions?: Resolution[] } | null;
  if (typeof body?.number !== "number" || (body.decision !== "merge" && body.decision !== "close")) return bad("Faltan datos.");
  const choice = body.decision === "merge" ? ({ decision: "merge", resolutions: Array.isArray(body.resolutions) ? body.resolutions : [] } as const) : ({ decision: "close" } as const);
  const number = body.number;
  return versionRoute(request, async (actor) => ({ pullRequest: await inProject(actor, (tx, scope) => decideReview(tx, scope, actor.user.id, number, choice)) }));
}
