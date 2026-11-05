import { readPublicSite } from "../../server/public-site";

/** El sitio publicado, para el público (sin sesión): solo lo que se publicó, nunca el borrador. */
export async function GET(request: Request) {
  const site = await readPublicSite(request.headers.get("host"));
  return site === null
    ? Response.json({ error: "Aún no se publicó nada." }, { status: 404 })
    : new Response(site, { headers: { "content-type": "application/json", "cache-control": "no-store" } });
}
