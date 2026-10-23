import { writeManifest } from "../../../server/cms-store";
import { validateManifest } from "../../../server/cms-validate";
import { sameOriginRequest } from "../../../server/proxy-guard";

/** Publica los cambios de un sitio: desde ese momento el script de su web los aplica a quien la visite. */
export async function POST(request: Request) {
  if (!sameOriginRequest(request)) return Response.json({ error: "Petición no permitida." }, { status: 403 });

  const result = validateManifest(await request.json().catch(() => null));
  if ("error" in result) return Response.json({ error: result.error }, { status: 400 });

  await writeManifest(result.manifest);
  return Response.json({ site: result.manifest.site, publishedAt: result.manifest.publishedAt });
}
