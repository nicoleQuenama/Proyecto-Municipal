import { readManifest } from "../../../server/cms-store";

/** Lo último publicado para un sitio. Es público y de solo lectura: lo pide el script de la web del cliente. */
export async function GET(request: Request) {
  const site = new URL(request.url).searchParams.get("site") ?? "";
  const manifest = await readManifest(site);
  if (!manifest) return Response.json({ error: "Nada publicado para este sitio." }, { status: 404 });

  return Response.json(manifest, { headers: { "access-control-allow-origin": "*", "cache-control": "no-store" } });
}
