import { createBranch, deleteBranch } from "../../../server/versions/branch-store";
import { versionRoute } from "../../../server/versions/version-route";
import { inProject } from "../../../server/site-access";

/** Crea una rama de esta persona: `{ name, base }`. */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { name?: unknown; base?: unknown } | null;
  if (!body) return Response.json({ error: "Faltan datos." }, { status: 400 });
  return versionRoute(
    request,
    async (actor) => {
      const branch = await inProject(actor, (tx, scope) => createBranch(tx, scope, actor.user.id, body.name, body.base));
      return { branch: { name: branch.name, author: branch.ownerName, base: branch.baseName } };
    },
    201,
  );
}

/** Elimina una rama: `?name=`. Solo la puede eliminar quien la creó. */
export const DELETE = (request: Request) =>
  versionRoute(request, async (actor) => {
    const name = new URL(request.url).searchParams.get("name") ?? "";
    await inProject(actor, (tx, scope) => deleteBranch(tx, scope, actor.user.id, name));
    return { deleted: name };
  });
