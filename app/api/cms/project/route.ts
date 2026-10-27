import { sessionUser } from "../../../server/auth-session";
import { isPart, readPart, writePart } from "../../../server/project-store";
import { sameOriginRequest } from "../../../server/proxy-guard";

const MAX_BYTES = 20_000_000;

const signedOut = () => Response.json({ error: "Tu sesión terminó o tu acceso venció." }, { status: 401 });

const partOf = (request: Request) => {
  const part = new URL(request.url).searchParams.get("part");
  return isPart(part) ? part : null;
};

/** Lo último que se guardó de una parte del proyecto (el sitio, las versiones…). */
export async function GET(request: Request) {
  if (!sameOriginRequest(request)) return Response.json({ error: "Petición no permitida." }, { status: 403 });
  if (!(await sessionUser())) return signedOut();
  const part = partOf(request);
  if (!part) return Response.json({ error: "Parte desconocida." }, { status: 400 });

  const saved = await readPart(part);
  return saved === null
    ? Response.json({ error: "Aún no hay nada guardado." }, { status: 404 })
    : new Response(saved, { headers: { "content-type": "application/json", "cache-control": "no-store" } });
}

/** Guarda una parte del proyecto: el editor lo hace solo, poco después de cada cambio. */
export async function PUT(request: Request) {
  if (!sameOriginRequest(request)) return Response.json({ error: "Petición no permitida." }, { status: 403 });
  if (!(await sessionUser())) return signedOut();
  const part = partOf(request);
  if (!part) return Response.json({ error: "Parte desconocida." }, { status: 400 });

  const body = await request.text();
  if (body.length > MAX_BYTES) return Response.json({ error: "El proyecto es demasiado grande." }, { status: 413 });
  try {
    JSON.parse(body);
  } catch {
    return Response.json({ error: "No es JSON." }, { status: 400 });
  }
  await writePart(part, body);
  return Response.json({ ok: true });
}
