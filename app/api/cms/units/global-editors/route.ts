import { inProject } from "../../../../server/site-access";
import { parseIds } from "../../../../server/units/unit-input";
import { assertSuperadmin, setGlobalEditors } from "../../../../server/units/unit-store";
import { versionRoute } from "../../../../server/versions/version-route";

/** Reemplaza quiénes pueden editar lo global (`{ userIds: [...] }`): cabecera, pie, estilos y medios comunes, y los servidores. */
export async function PUT(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  return versionRoute(request, async (actor) => {
    assertSuperadmin(actor);
    const userIds = parseIds(body);
    await inProject(actor, (tx, scope) => setGlobalEditors(tx, scope, userIds));
    return { ok: true };
  });
}
