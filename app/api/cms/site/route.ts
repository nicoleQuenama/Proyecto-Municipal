import { isPgError } from "../../../server/db";
import type { SitePatch } from "../../../server/site/site-patch";
import { inProject } from "../../../server/site-access";
import { saveBranchPatch } from "../../../server/versions/branch-edits";
import { findBranch, VersionError } from "../../../server/versions/branch-rows";
import { headSite, loadBranchSite } from "../../../server/versions/branch-state";
import { filterSiteForUnits } from "../../../server/units/filter-site";
import { unitsOf } from "../../../server/units/units-access";
import { versionRoute } from "../../../server/versions/version-route";

const MAX_BYTES = 20_000_000;
const branchOf = (request: Request) => new URL(request.url).searchParams.get("branch") ?? "main";

/**
 * El sitio de una rama (`?branch=`, por defecto main) tal como está guardado (`site: null` si todavía no se guardó nada) y
 * el sitio de su última versión (`head`), que es la referencia para saber qué cambió desde entonces.
 */
export const GET = (request: Request) =>
  versionRoute(request, (actor) =>
    inProject(actor, async (tx, scope) => {
      const branch = await findBranch(tx, scope, branchOf(request));
      // Quien está sujeto a unidades solo recibe lo suyo y lo global; lo que se guarda, fusiona o publica sigue usando el sitio entero.
      const access = await unitsOf(tx);
      const [site, head] = [await loadBranchSite(tx, scope, branch), await headSite(tx, scope, branch)];
      return { site: site && filterSiteForUnits(site, access), head: head && filterSiteForUnits(head, access) };
    }),
  );

/** Guarda lo que cambió (`SitePatch`) en la rama: el editor lo hace solo, poco después de cada cambio. La base de datos aplica los permisos. */
export async function PUT(request: Request) {
  const body = await request.text();
  if (body.length > MAX_BYTES) return Response.json({ error: "El cambio es demasiado grande." }, { status: 413 });
  let patch: SitePatch;
  try {
    patch = JSON.parse(body) as SitePatch;
  } catch {
    return Response.json({ error: "No es JSON." }, { status: 400 });
  }

  return versionRoute(request, (actor) =>
    inProject(actor, async (tx, scope) => {
      const branch = await findBranch(tx, scope, branchOf(request));
      try {
        return await saveBranchPatch(tx, scope, actor.user.id, branch, patch);
      } catch (error) {
        if (isPgError(error, "23503") || isPgError(error, "23505")) throw new VersionError("El sitio cambió en otra pestaña o por otra persona: recarga la página para ver lo último.", 409);
        throw error;
      }
    }),
  );
}
