import { inProject } from "../../../server/site-access";
import { parseUnitInput } from "../../../server/units/unit-input";
import { assertSuperadmin, createUnit, listUnits } from "../../../server/units/unit-store";
import { versionRoute } from "../../../server/versions/version-route";

/** Las unidades de la organización, con sus miembros y ajustes, y quiénes pueden editar lo global. Solo el superadministrador. */
export const GET = (request: Request) =>
  versionRoute(request, async (actor) => {
    assertSuperadmin(actor);
    return inProject(actor, (tx, scope) => listUnits(tx, scope));
  });

/** Crea una unidad. */
export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  return versionRoute(
    request,
    async (actor) => {
      assertSuperadmin(actor);
      const input = parseUnitInput(body);
      return inProject(actor, async (tx, scope) => ({ id: await createUnit(tx, scope, input) }));
    },
    201,
  );
}
