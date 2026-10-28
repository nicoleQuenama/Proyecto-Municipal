import { readPublished } from "../../server/published-store";

/** El sitio publicado, para el público (sin sesión): solo lo que se publicó, nunca el borrador. */
export async function GET() {
  const site = await readPublished();
  return site === null
    ? Response.json({ error: "Aún no se publicó nada." }, { status: 404 })
    : new Response(site, { headers: { "content-type": "application/json", "cache-control": "no-store" } });
}
