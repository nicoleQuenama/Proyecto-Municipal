import { inProject } from "../../../../server/site-access";
import { versionRoute } from "../../../../server/versions/version-route";

/** Los nombres de las unidades de la organización (para etiquetar páginas y elegir a cuál enviar una). Cualquier miembro del proyecto. */
export const GET = (request: Request) =>
  versionRoute(request, (actor) =>
    inProject(actor, async (tx, scope) => ({
      units: (await tx.unsafe(`select id, name::text as name from app.units where organization_id = $1 and deleted_at is null order by name`, [scope.org])) as unknown as { id: string; name: string }[],
    })),
  );
