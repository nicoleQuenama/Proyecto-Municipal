import { inProject } from "../../../../../server/site-access";
import { parseIds } from "../../../../../server/units/unit-input";
import { assertSuperadmin, setMembers } from "../../../../../server/units/unit-store";
import { versionRoute } from "../../../../../server/versions/version-route";

/** Reemplaza quiénes están en la unidad (`{ userIds: [...] }`); quienes entran pasan a ser miembros del proyecto si no lo eran. */
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const [{ id }, body] = [await params, await request.json().catch(() => null)];
  return versionRoute(request, async (actor) => {
    assertSuperadmin(actor);
    const userIds = parseIds(body);
    await inProject(actor, (tx, scope) => setMembers(tx, scope, id, userIds));
    return { ok: true };
  });
}
