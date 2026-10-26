import { startSession } from "../../../server/auth-session";
import { verifyCredentials } from "../../../server/auth-store";
import { sameOriginRequest } from "../../../server/proxy-guard";

export async function POST(request: Request) {
  if (!sameOriginRequest(request)) return Response.json({ error: "Petición no permitida." }, { status: 403 });

  const body = (await request.json().catch(() => null)) as { username?: unknown; password?: unknown } | null;
  if (!body || typeof body.username !== "string" || typeof body.password !== "string") {
    return Response.json({ error: "Indica tu usuario y contraseña." }, { status: 400 });
  }

  const user = await verifyCredentials(body.username, body.password);
  if (!user) return Response.json({ error: "Usuario o contraseña incorrectos." }, { status: 401 });

  await startSession(user.id);
  return Response.json({ user });
}
