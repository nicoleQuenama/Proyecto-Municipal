import { inProject } from "../../../server/site-access";
import { publishBranch } from "../../../server/versions/publication-store";
import { versionRoute } from "../../../server/versions/version-route";

/** Publica la última versión guardada de una rama (`{ branch }`): lo que ve el público en /ver. Solo con permiso para publicar en main. */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { branch?: unknown };
  return versionRoute(request, async (actor) => ({ release: await inProject(actor, (tx, scope) => publishBranch(tx, scope, actor.user.id, body.branch)) }), 201);
}
