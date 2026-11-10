import { inProject } from "../../../../server/site-access";
import { parseUnitInput } from "../../../../server/units/unit-input";
import { assertSuperadmin, deleteUnit, updateUnit } from "../../../../server/units/unit-store";
import { versionRoute } from "../../../../server/versions/version-route";

type Context = { params: Promise<{ id: string }> };

/** Edita una unidad (nombre, tipo, dueño, revisión obligatoria y ajustes de permisos). */
export async function PATCH(request: Request, { params }: Context) {
  const [{ id }, body] = [await params, await request.json().catch(() => null)];
  return versionRoute(request, async (actor) => {
    assertSuperadmin(actor);
    const input = parseUnitInput(body);
    await inProject(actor, (tx, scope) => updateUnit(tx, scope, id, input));
    return { ok: true };
  });
}

/** Borra una unidad vacía (con páginas o archivos, antes hay que reasignarlos: 409). */
export async function DELETE(request: Request, { params }: Context) {
  const { id } = await params;
  return versionRoute(request, async (actor) => {
    assertSuperadmin(actor);
    await inProject(actor, (tx, scope) => deleteUnit(tx, scope, id));
    return { ok: true };
  });
}
