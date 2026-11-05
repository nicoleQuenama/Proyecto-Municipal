import { commitBranch, type NewCommit } from "../../../server/versions/commit-store";
import { readVersions } from "../../../server/versions/versions-state";
import { versionRoute } from "../../../server/versions/version-route";
import { inProject } from "../../../server/site-access";

/** Ramas, versiones y pull requests del proyecto, y la rama en la que esta persona debe trabajar. */
export const GET = (request: Request) => versionRoute(request, (actor) => inProject(actor, (tx, scope) => readVersions(tx, scope, actor.user.id)));

/** Guarda una versión de una rama: `{ branch, message, changes }`. */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as NewCommit | null;
  if (!body) return Response.json({ error: "Faltan datos." }, { status: 400 });
  return versionRoute(request, async (actor) => ({ commit: await inProject(actor, (tx, scope) => commitBranch(tx, scope, actor.user.id, body)) }), 201);
}
