import { sessionUser } from "../../../server/auth-session";
import { sameOriginRequest } from "../../../server/proxy-guard";
import { writePublished } from "../../../server/published-store";

const MAX_BYTES = 20_000_000;

/** Guarda el sitio publicado: lo que ve el público en /ver. Quien no puede publicar en main (solo pull requests) no pasa. */
export async function POST(request: Request) {
  if (!sameOriginRequest(request)) return Response.json({ error: "Petición no permitida." }, { status: 403 });
  const user = await sessionUser();
  if (!user) return Response.json({ error: "Tu sesión terminó." }, { status: 401 });
  if (user.access?.denied.includes("publishMain")) return Response.json({ error: "Tu cuenta publica con pull request, no directo." }, { status: 403 });

  const body = await request.text();
  if (body.length > MAX_BYTES) return Response.json({ error: "El sitio es demasiado grande." }, { status: 413 });
  try {
    JSON.parse(body);
  } catch {
    return Response.json({ error: "No es JSON." }, { status: 400 });
  }
  await writePublished(body);
  return Response.json({ ok: true });
}
