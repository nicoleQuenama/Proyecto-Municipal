import { sessionActor } from "../../../server/auth-session";
import { canDeploy } from "../../../server/can-deploy";
import { buildBundle } from "../../../server/export-bundle";
import { sameOriginRequest } from "../../../server/proxy-guard";
import { loadSite } from "../../../server/site/site-load";
import { inProject } from "../../../server/site-access";
import { liveSite } from "../../../server/versions/publication-store";

/** Descarga el paquete del proyecto (ZIP, o ZIP con Docker). Solo para quien puede desplegar. */
export async function GET(request: Request) {
  if (!sameOriginRequest(request)) return Response.json({ error: "Petición no permitida." }, { status: 403 });
  const actor = await sessionActor();
  if (!actor) return Response.json({ error: "Tu sesión terminó." }, { status: 401 });
  if (!canDeploy(actor.user)) return Response.json({ error: "No tienes permiso para exportar el proyecto." }, { status: 403 });

  const kind = new URL(request.url).searchParams.get("kind") === "docker" ? "docker" : "zip";
  const [live, draft] = await inProject(actor, async (tx, scope) => [await liveSite(tx, scope), await loadSite(tx, scope)] as const);
  const bundle = await buildBundle(kind, live && JSON.stringify(live.snapshot), draft && JSON.stringify(draft));
  return new Response(Buffer.from(bundle), {
    headers: {
      "content-type": "application/zip",
      "content-disposition": `attachment; filename="sitio-${kind}.zip"`,
      "cache-control": "no-store",
    },
  });
}
