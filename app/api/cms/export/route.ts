import { sessionUser } from "../../../server/auth-session";
import { canDeploy } from "../../../server/can-deploy";
import { buildBundle } from "../../../server/export-bundle";
import { sameOriginRequest } from "../../../server/proxy-guard";

/** Descarga el paquete del proyecto (ZIP, o ZIP con Docker). Solo para quien puede desplegar. */
export async function GET(request: Request) {
  if (!sameOriginRequest(request)) return Response.json({ error: "Petición no permitida." }, { status: 403 });
  const user = await sessionUser();
  if (!user) return Response.json({ error: "Tu sesión terminó." }, { status: 401 });
  if (!canDeploy(user)) return Response.json({ error: "No tienes permiso para exportar el proyecto." }, { status: 403 });

  const kind = new URL(request.url).searchParams.get("kind") === "docker" ? "docker" : "zip";
  const bundle = await buildBundle(kind);
  return new Response(Buffer.from(bundle), {
    headers: {
      "content-type": "application/zip",
      "content-disposition": `attachment; filename="sitio-${kind}.zip"`,
      "cache-control": "no-store",
    },
  });
}
