import { startSession } from "../../../server/auth-session";
import { verifyCredentials } from "../../../server/auth-login";
import { sameOriginRequest } from "../../../server/proxy-guard";

export async function POST(request: Request) {
  if (!sameOriginRequest(request)) return Response.json({ error: "Petición no permitida." }, { status: 403 });

  const body = (await request.json().catch(() => null)) as { email?: unknown; password?: unknown } | null;
  if (!body || typeof body.email !== "string" || typeof body.password !== "string") {
    return Response.json({ error: "Indica tu correo y contraseña." }, { status: 400 });
  }

  let actor;
  try {
    actor = await verifyCredentials(body.email, body.password);
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "No se pudo iniciar sesión." }, { status: 403 });
  }
  if (!actor) return Response.json({ error: "Correo o contraseña incorrectos." }, { status: 401 });

  await startSession(actor);
  return Response.json({ user: actor.user });
}
